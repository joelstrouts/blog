// TODO: add functionality to write a properties on each last generation
// TODO: add functionality to save last random system of equations
// in placeholder IFS variable
// Thought about using this program to help with inverse problem:
// (note, i know nothing about working with neural networks this is
// conjecture about what could be a useful approach)
// make training data for neural network by automatically generating
// vast numbers of random images and associating with each output
// image a battery of statistics about each combination of transforms.
// perhaps train several models one for each different aspect of
// the reverse engineering problem. Supply each with vector of values
// you think most relevant.
/**************************/
/* HELPER FUNCTIONS START */
/**************************/
/* FUNCTIONAL ESSENTIALS
 */
const zip = (list1, list2) => list1.map((value, key) => [value, list2[key]]);
const getComposition = (...functions) => (point) => {
  return functions.reduce((value, func) => func(value), point);
}
const override = (defaults, reconsiderations) => {
  let returnValues = {};
  if (!reconsiderations) {
    for (index in Object.keys(defaults)) {
      let key = Object.keys(defaults)[index];
      returnValues[key] = defaults[key];
    }
    return defaults;
  } else {
    for (index in Object.keys(defaults)) {
      let key = Object.keys(defaults)[index];
      returnValues[key] =  
        (reconsiderations[key]) ? reconsiderations[key] : defaults[key];
    }
    return returnValues;
  }
}

/* LINEAR ALGEBRA
 * (VECTOR RELATED)
 */
const vScale = (a, v) => v.map((entry) => a * entry);
const vAdd = (...vectors) => vectors.reduce((v,w) => [v[0] + w[0], v[1] + w[1]]);
const vMinus = (v, w) => vAdd(v, vScale(-1, w));
const vMod = v => Math.sqrt(v.reduce((e1, e2) => e1 * e1 + e2 * e2));
const dot = (v, w) => zip(v,w).reduce((pair1, pair2) => pair1[0] * pair1[1] + pair2[0] * pair2[1]);
const getTranslation = c => p => vAdd(p,c);
/* (MATRIX RELATED)
 */
const det = ([[a,c],[b,d]]) => a*d - b*c;
const mInverse = ([[a,c],[b,d]]) => mScale(1/(a*d - b*c), [[d,-c],[-b,a]]);
const mScale = (a, M) => M.map(v => vScale(a, v));
const mProduct = (...matricies) => matricies.reduce(
  (A, B) => [getLinear(A)(B[0]), getLinear(A)(B[1])]
);
const getAffine = (M,c) => p => getComposition(getLinear(M), getTranslation(c))(p);
const getLinear = M => p => {
  return [
    p[0] * M[0][0] + p[1] * M[1][0],
    p[0] * M[0][1] + p[1] * M[1][1]
  ];
}
const randomAffine = (rotation, uniform) => {
  let r = [0,0,0,0,0,0].map(() => Math.random() * 2 - 1);
  if (!rotation) { [r[1],r[2]] = [0,0]; }
  if (uniform) { r[3] = r[0]; }
  return getAffine([[r[0], r[1]], [r[2], r[3]]], [r[4], r[5]]);
}
const randomLinear = () => {
  let r = [0,0,0,0].map(() => Math.random() * 2 - 1);
  return getLinear([[r[0], r[1]], [r[2], r[3]]], [r[4], r[5]]);
}
const inferTranslation = affine => {
  return affine([0,0]);
}
const inferLinear = affine => {
  let v = inferTranslation(affine);
  return [vMinus(affine([1,0]), v), vMinus(affine([0,1]), v)]
}
const inferInverse = affine => {
  return getComposition(
    getTranslation(vScale(-1, inferTranslation(affine))),
    getLinear(mInverse(inferLinear(affine))),
  )
}
const getFixedPoint = affine => {
  let v = inferTranslation(affine);
  console.log('translation is '.concat(v));
  let phi = inferLinear(affine);
  console.log('linear part is '.concat(phi));
  let coefficients = mInverse([vMinus(phi[0], [1,0]), vMinus(phi[1], [0,1])]);
  return getLinear(coefficients)(vScale(-1, v))
}
/* DISCRETE MATHS
 */
const ipart = x => Math.floor(x);
const round = x => ipart(x + 0.5);
const fpart = x => x - Math.floor(x);
const rfpart = x => 1 - fpart(x);
const cummulative = list => {
  let returnList = [list[0]];
  let runningTotal = list[0];
  for (var i = 1; i < list.length; i++) {
    runningTotal += list[i];
    returnList = returnList.concat(runningTotal);
  }
  return returnList;
}

/* PROJECTION / DRAWING
 */
const getCoordinateTransform = (from, to) => (point) => {
  return getComposition(
    getTranslation(vScale(-1, from.o)),
    getLinear(mInverse([from.x, from.y])),
    getLinear([to.x, to.y]),
    getTranslation(to.o)
  )(point);
}
const scaleTransform = (f, amount) => p => {
  return getComposition(f, getLinear([[amount,0],[0,amount]]))(p)
}
const getOutputRegion = (referenceRegion, canvas, options) => {
  let outputRegion = { o: [0,0], x: [1,0], y: [0,1] };
  switch (options.position) {
    case 'centre':
      // input region is R, output region is S - given heights and widths.
      // f: R -> S
      let R = [vMod(referenceRegion.x), vMod(referenceRegion.y)],
          Rratio = R[1]/R[0];
          S = [],
          VP = [canvas.width, canvas.height],
          VPratio = VP[1]/VP[0];
          middle = vScale(1/2, VP);
      if (Rratio > VPratio) { // slack width
        S = [
          Math.floor((1 / Rratio) * VP[1] * options.scale), 
          Math.floor(VP[1] * options.scale)
        ];
      } else { // slack height
        S = [
          Math.floor(VP[0] * options.scale), 
          Math.floor(Rratio * VP[0] * options.scale)
        ];
      }
      outputRegion = { 
        o: [
          Math.floor(middle[0] - S[0]/2),
          Math.floor(middle[0] + S[1]/2),
        ],
        x: [ S[0], 0 ],
        y: [ 0, - S[1] ],
        }
      break;
  }
  return outputRegion;
}
const paintPixel = ([x,y], imgData, rgba) => {
  if  (x > 0 
    && x < imgData.width
    && y > 0
    && y < imgData.height) {
    const index = 4 * (y * imgData.width + x);
    imgData.data[index + 0] = rgba[0];
    imgData.data[index + 1] = rgba[1];
    imgData.data[index + 2] = rgba[2];
    imgData.data[index + 3] = rgba[3];
  }
}
const paintPixelBox = ([x,y], imgData, rgba, size) => {
  for (var i = - size; i < size; i++) {
    for (var j = - size; j < size; j++) {
      paintPixel([x + i, y + j], imgData, rgba);
    }
  }
}

const drawPoint = (point, imageData, style, rgba, options) => {
  switch (style) {
    case 'dots':
      paintPixel(point, imageData, rgba);
      break;
    case 'blobs':
      paintPixelBox(point, imageData, rgba, options);
      break;
  }
}
const drawLine = ([x1,y1], [x2,y2], imgData, rgb) => {
  let steep = Math.abs(y2 - y1) > Math.abs(x1 - x2);
  if (steep)   { [x1, y1] = [y1, x1]; [x2, y2] = [y2, x2]; }
  if (x1 > x2) { [x1, x2] = [x2, x1]; [y1, y2] = [y2, y1]; }
  let dx = x2 - x1;
  let dy = y2 - y1;
  let m = dy / dx;
  if (dx === 0) { m = 1 }
   
  // first end point
  let xend = round(x1);
  let yend = y1 + m * (xend - x1);
  let xgap = rfpart(x1 + 0.5)
  let xpxl1 = xend;
  let ypxl1 = ipart(yend);
  if (steep) {
    paintPixel([ypxl1, xpxl1],     imgData, rgb.concat(rfpart(yend) * xgap * 255));
    paintPixel([ypxl1 + 1, xpxl1], imgData, rgb.concat( fpart(yend) * xgap * 255));
  } else {
    paintPixel([xpxl1, ypxl1],     imgData, rgb.concat(rfpart(yend) * xgap * 255));
    paintPixel([xpxl1, ypxl1 + 1], imgData, rgb.concat( fpart(yend) * xgap * 255));
  }
  let intery = yend + m;

  // second end point
  xend = round(x2);
  yend = y2 + m * (xend - x2);
  xgap = fpart(x2 + 0.5)
  let xpxl2 = xend;
  let ypxl2 = ipart(yend);
  if (steep) {
    paintPixel([ypxl2, xpxl2],     imgData, rgb.concat(rfpart(yend) * xgap * 255));
    paintPixel([ypxl2 + 1, xpxl2], imgData, rgb.concat(fpart(yend) * xgap * 255));
  } else {
    paintPixel([xpxl2, ypxl2],     imgData, rgb.concat(rfpart(yend) * xgap * 255));
    paintPixel([xpxl2, ypxl2 + 1], imgData, rgb.concat( fpart(yend) * xgap * 255));
  }

  // line inbetween
  if (steep) {
    for (var x = xpxl1 + 1; x < xpxl2; x++) {
      paintPixel([ipart(intery), x],     imgData, rgb.concat(rfpart(intery) * 255));
      paintPixel([ipart(intery) + 1, x], imgData, rgb.concat( fpart(intery) * 255));
      intery = intery + m;
    }
  } else {
    for (var x = xpxl1 + 1; x < xpxl2; x++) {
      paintPixel([x, ipart(intery)],     imgData, rgb.concat(rfpart(intery) * 255));
      paintPixel([x, ipart(intery) + 1], imgData, rgb.concat( fpart(intery) * 255));
      intery = intery + m;
    }
  }
}
const drawPolygon = (verts, imgData, rgba) => {
  let rgb = rgba.slice(0,3);
  verts = verts.concat([verts[0]]);
  verts.reduce((a,b) => { drawLine(a,b,imgData,rgb); return b; });
  verts.map(p => { paintPixelBox(p, imgData, rgba, 3); return p});
}
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')

/************************/
/* HELPER FUNCTIONS END */
/************************/

/************************/
/*  API-like functions  */
/************************/

const transformToLatex = (index, array, reColor) => {
  let linear = array[0].map(column => column.map(el => el.toFixed(5)));
  let translation = array[1].map(el => el.toFixed(5));
  let myColor = "#000000";
  if (reColor) {
    myColor = rgbToHex(...IFS.defaultOptions.colors[index+1]);
  }

  return `\\color{${myColor}}{f_{${index + 1}}(\\mathbf{x})}&=\\begin{bmatrix}${linear[0][0]} & ${linear[1][0]}\\\\${linear[0][1]} & ${linear[1][1]}\\end{bmatrix}\\mathbf{x} + \\begin{bmatrix}${translation[0]}\\\\${translation[1]}\\end{bmatrix}`;
}
const paint = (canvas, fractalGetter) => {
  IFS.canvas = canvas;
  canvas.getContext('2d').putImageData(fractalGetter(), 0, 0);
}


const IFS = {
  init: (def, options) => {
    if (def.init) { def.init(options); }
    def.ctf = getCoordinateTransform(
      def.referenceRegion, 
      getOutputRegion(def.referenceRegion, IFS.canvas, options)
    );
    // calculate probability bins
    if (def.probabilities === 'equal') {
      def.probabilities = Array(def.transforms.length).fill(1/def.transforms.length);
      def.probBins = cummulative(def.probabilities);
      def.probabilities = 'equal';
    } else if (def.probabilities === 'area-weighted') {
      let scales = def.transforms.map(f => {
        let e1 = vMinus(f([1,0]), f([0,0]));
        let e2 = vMinus(f([0,1]), f([0,0]));
        return e1[0] * e2[1] - e2[0] * e1[1];
      }).map(x => Math.abs(x) + 0.25 / def.transforms.length);
      let M = scales.reduce((a,b) => a + b);
      def.probabilities = scales.map(factor => factor / M);
      console.log(def.probabilities);
      def.probBins = cummulative(def.probabilities);
      def.probabilities = 'area-weighted';
    } else {
      def.probBins = cummulative(def.probabilities);
    }
    def.asPixel = p => def.ctf(p).map(e => Math.floor(e));
    IFS.setProperties(def);
    IFS.setReport(options);
  },
  get: (def, n, options) => () => {
    options = override(IFS.defaultOptions, options);
    IFS.init(def, options);
    IFS.lastOutput.push(getIFS(def, n, options));
    return IFS.lastOutput.slice(-1)[0];
  },
  applyTransform: def => p => {
    let rand = Math.random();
    let choice = 0;
    while (rand > def.probBins[choice]) { choice += 1; }
    IFS.lastTransform = choice;
    return def.transforms[choice](p);
  },
  lastOutput: [],
  defaultOptions: {
    runnable: false,
    style: 'dots',
    color: 'uniform',
    colors: [
      [0, 0, 0],
      [0, 200, 0],
      [190, 0, 150],
      [200, 110, 0],
      [210, 0, 0],
      [0, 0, 200],
      [0, 110, 200],
      [40, 40, 40],
    ],
    bboxes: false,
    blobsSize: 1,
    initialPoint: [0,0],
    position: 'centre',
    scale: 0.9,
    new: false,
  },
  setProperties: def => {
    IFS.properties = {};
    IFS.properties.transforms = def.transforms.map(affine => {
      return [inferLinear(affine), inferTranslation(affine)];
    })
    IFS.properties.fixedPoints = def.transforms.map(affine => getFixedPoint(affine));
  },
  setReport: options => {
    let color = (options.color == 'last') ? true : false;
    latexTransforms = IFS.properties.transforms.map((v,k) => transformToLatex(k, v, color));
    latexTransforms = latexTransforms.reduce((prev, current) => prev + "\\\\" + current);
    IFS.latex = "$$\\bbox[20px, border: 2px solid orange]{\\begin{align}" + latexTransforms + "\\end{align}}$$";
  },
}

// returns an imagedata object which is an image of the IFS with the
// parameters provided
const getIFS = (def, N, options) => {
  const imageData = new ImageData(IFS.canvas.width, IFS.canvas.height);
  let thisColor; if (options.color == 'last') {
    IFS.lastTransform = 0;
    thisColor = () => options.colors[IFS.lastTransform + 1];
  } else {
    thisColor = () => options.colors[0];
  }
  let p = options.initialPoint;
  if (options.bboxes) {
    let [a,b,c,d] = [
      def.referenceRegion.o,
      vAdd(def.referenceRegion.o, def.referenceRegion.x),
      vAdd(def.referenceRegion.o, def.referenceRegion.x, def.referenceRegion.y),
      vAdd(def.referenceRegion.o, def.referenceRegion.y)
    ];
    let [p,q,r,s] = [a,b,c,d].map(p => def.asPixel(p));
    drawPolygon([p,q,r,s], imageData, [0,0,0,255]);
    IFS.lastTransform = 0;
    def.transforms.map(f => {
      [p,q,r,s] = [a,b,c,d].map(p => def.asPixel(f(p)));
      drawPolygon([p,q,r,s], imageData, thisColor().concat(255));
      IFS.lastTransform += 1;  
    })
  }
  // MAIN LOOP
  console.log(options.style);
  for (var i = 0; i < N; i++) {
    let q = IFS.applyTransform(def)(p);
    let [a, b] = [p,q].map(v => def.ctf(v).map(e => Math.floor(e)));
    if (options.style == 'dots') {
      paintPixel(b, imageData, thisColor().concat(255));
    } else if (options.style == 'blobs') {
      paintPixelBox(b, imageData, thisColor().concat(255), options.blobsSize);
    } else if (options.style == 'lines') {
      drawLine(a, b, imageData, thisColor());
      paintPixelBox(b, imageData, thisColor().concat(255), options.blobsSize);
    }
    p = q;
  }
  if (options.style == 'blobs' || options.style == 'lines') {
    paintPixelBox(def.ctf(options.initialPoint).map(e => Math.floor(e)), imageData, [255,0,0,255], options.blobsSize);
  }
  if (options.fixedPoints) {
    IFS.lastTransform = 0;
    def.transforms.map(affine => {
      let fixedP = getFixedPoint(affine);
      console.log('fixed point is: '.concat(fixedP));
      paintPixelBox(def.asPixel(fixedP, imageData), imageData, thisColor().concat(255), 4);
      paintPixelBox(def.asPixel(fixedP, imageData), imageData, [255,0,0,255], 2);
      IFS.lastTransform += 1;  
    })
  }
  return imageData;
}

/**************************/
/*     PRESETS            */
/**************************/

// these are objects correctly formatted
// so as to work as IFS definitions (for
// use as the first argument of the
// `getIFS()` function)

// The IFS object handles most of the operations
// that actually do work with/on these IFS definition
// constructs. I see now, looking back at the code
// that it is a weird OOP-but-without-actually-using-
// -OOP-language-features type pattern.

// passing one of these definitions to IFS.init()
// is essentially the object construction, and
// the method properties of the IFS object are essentially
// the member methods for what would be an IFS class.
// (I think).

const barnsleyFern = {
  referenceRegion: {
    o: [-2.4,-0.5],
    x: [5.5 ,0 ] ,
    y: [0   ,11],
  },
  transforms: [
    getLinear([[ 0.00, 0.00],[ 0.00, 0.16]]),
    getAffine([[ 0.85,-0.04],[ 0.04, 0.85]], [0.00,1.60]),
    getAffine([[ 0.20, 0.23],[-0.26, 0.22]], [0.00,1.60]),
    getAffine([[-0.15, 0.26],[ 0.28, 0.24]], [0.00,0.44]),
  ],
  probabilities: [
    0.01,
    0.85,
    0.07,
    0.07,
  ],
};
const binaryTree = {
  referenceRegion: {
    o: [-0.5,0  ],
    x: [1   ,0  ] ,
    y: [0   ,0.9],
  },
  transforms: [
    getLinear([[ 0, 0.00],[ 0.00, 0.45]]),
    getAffine([[ 0.42, 0.42],[-0.42, 0.42]], [0.00, 0.40]),
    getAffine([[ 0.42,-0.42],[ 0.42, 0.42]], [0.00, 0.40]),
  ],
  probabilities: Array(3).fill(1/3),
};

const mapleLeaf = {
  referenceRegion: {
    o: [-3.5,-3.6],
    x: [7,0] ,
    y: [0,7.1],
  },
  transforms: [
    getComposition(getLinear([[0.5,0],[0,0.65]]), getTranslation([0,1.2])),
    getAffine([[ 0.45,-0.45],[ 0.45, 0.45]], [ 1.62,-0.65]),
    getAffine([[ 0.45, 0.45],[-0.45, 0.45]], [-1.62,-0.65]),
    getComposition(getLinear([[0,0],[0,-0.4]]), getTranslation([0,-2.3])),
  ],
  probabilities: [0.31,0.31,0.31,0.07]
};
const sandDollar = {
  referenceRegion: {
    o: [0,0],
    x: [1,0] ,
    y: [0,1],
  },
  transforms: [
    getAffine([[ 0.382, 0.0000],[ 0.0000, 0.382]], [0.3090, 0.5710]),
    getAffine([[ 0.118, 0.3630],[-0.3630, 0.118]], [0.3633, 0.3306]),
    getAffine([[ 0.118,-0.3630],[ 0.3630, 0.118]], [0.5187, 0.6940]),
    getAffine([[-0.309, 0.2245],[-0.2245,-0.309]], [0.6070, 0.3090]),
    getAffine([[-0.309,-0.2245],[ 0.2245,-0.309]], [0.7016, 0.5335]),
    getAffine([[ 0.382, 0.0000],[ 0.0000,-0.382]], [0.3090, 0.6770]),
  ],
  probabilities: 'equal',
};
const serpinski = {
  referenceRegion: {
    o: [0,0],
    x: [2,0],
    y: [0,2],
  },
  transforms: [
    getLinear([[1/2, 0],[0,1/2]]),
    getAffine([[1/2, 0],[0,1/2]], [1, 0]),
    getAffine([[1/2, 0],[0,1/2]], [0, 1]),
  ],
  probabilities: Array(3).fill(1/3),
};
const random = {
  scale: 0.7,
  order: 4,
  rotation: true,
  uniform: false,
  referenceRegion: {
    o: [-0.5,-0.5],
    x: [1   ,0] ,
    y: [0   ,1],
  },
  transforms: [], // defined on object initialization
  probabilities: 'area-weighted', 
  init: options => {
    if (options.new == true || random.transforms.length < 1) {
      random.transforms = [];
      for (var i = 0; i < random.order; i++) {
        random.transforms = random.transforms.concat(scaleTransform(randomAffine(random.rotation, random.uniform), random.scale))
      }
    }
  },
};
