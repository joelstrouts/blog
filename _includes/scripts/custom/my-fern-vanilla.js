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
const constrain = (x, bounds) => Math.max(Math.min(x,bounds[1],bounds[0]));

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

const paint = (canvas, fractalGetter) => {
  Fractal.canvas = canvas;
  canvas.getContext('2d').putImageData(fractalGetter(), 0, 0);
}

/************************/
/* HELPER FUNCTIONS END */
/************************/

/************************/
/*    PRESETS           */
/************************/
const randomAffine = () => {
  let r = [0,0,0,0,0,0].map(() => Math.random() * 2 - 1);
  return getAffine([[r[0], r[1]], [r[2], r[3]]], [r[4], r[5]]);
}
const randomLinear = () => {
  let r = [0,0,0,0].map(() => Math.random() * 2 - 1);
  return getLinear([[r[0], r[1]], [r[2], r[3]]], [r[4], r[5]]);
}
const scaleTransform = (f, amount) => p => {
  return getComposition(f, getLinear([[amount,0],[0,amount]]))(p)
}
const getOutputRegion = (referenceRegion, canvas, options) => {
  let outputRegion = { o: [0,0], x: [1,0], y: [0,1] };
  switch (options.position) {
    case 'centre':
      let inX = vMod(referenceRegion.x), inY = vMod(referenceRegion.y),
          canvX = canvas.width,          canvY = canvas.height,
          outX,                          outY;
      if (inY / inX > canvY / canvX) { // slack width
        outY = canvY;
        outX = Math.floor((inX / inY) * canvY);
        outputRegion = { 
          o: [
            Math.floor((canvY - outY) / 2) + options.margin, 
            outY - options.margin
          ],
          x: [outX - 2 * options.margin, 0],
          y: [0, - outY + 2 * options.margin],
        }
      } else { // slack height
        outX = canvX;
        outY = Math.abs(Math.floor((inY / inX) * canvX));
        outputRegion = { 
          o: [
            options.margin, 
            outY + Math.floor(canvY - outY) / 2 - options.margin
          ],
          x: [outX - 2 * options.margin, 0],
          y: [0, 2 * options.margin - outY],
        }
      }
      break;
  }
  return outputRegion;
}

const Fractal = {
  init: (def, options) => {
    if (def.init) { def.init(); }
    def.ctf = getCoordinateTransform(
      def.referenceRegion, 
      getOutputRegion(def.referenceRegion, Fractal.canvas, options)
    );
    if (def.probabilities === 'equal') {
      def.probabilities = Array(def.transforms.length).fill(1/def.transforms.length);
    }
    def.getPixel = p => def.ctf(p).map(e => Math.floor(e));
    def.probBins = cummulative(def.probabilities);
  },
  get: (def, n, options) => () => {
    options = override(Fractal.defaultOptions, options);
    Fractal.init(def, options);
    return getFractal(def, n, options);
  },
  applyTransform: def => p => {
    let rand = Math.random();
    let choice = 0;
    while (rand > def.probBins[choice]) { choice += 1; }
    Fractal.lastTransform = choice;
    return def.transforms[choice](p);
  },
  defaultOptions: {
    runnable: false,
    style: 'dots',
    color: 'uniform',
    colors: [
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
    margin: 40,
  },
}
const getFractal = (def, N, options) => {
  const imageData = new ImageData(Fractal.canvas.width, Fractal.canvas.height);
  let thisColor; if (options.color == 'last') {
    Fractal.lastTransform = 0;
    thisColor = () => options.colors[Fractal.lastTransform];
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
    let [p,q,r,s] = [a,b,c,d].map(p => def.getPixel(p));
    drawPolygon([p,q,r,s], imageData, [0,0,0,255]);
    Fractal.lastTransform = 0;
    def.transforms.map(f => {
      [p,q,r,s] = [a,b,c,d].map(p => def.getPixel(f(p)));
      drawPolygon([p,q,r,s], imageData, thisColor().concat(255));
      Fractal.lastTransform += 1;  
    })
  }
  // MAIN LOOP
  if(options.style == 'lines') {
    // draw initial point before the main loop begins
    let pixelOrigin = def.ctf(p).map(e => Math.floor(e));
    paintPixelBox(pixelOrigin, imageData, thisColor().concat(255), options.blobsSize);
  }
  for (var i = 0; i < N; i++) {
    let q = Fractal.applyTransform(def)(p);
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
  return imageData;
}

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
    o: [-3.5,-3.5],
    x: [7,0] ,
    y: [0,7],
  },
  transforms: [
    getComposition(getLinear([[0.5,0],[0,0.65]]), getTranslation([0,1.2])),
    getAffine([[ 0.45,-0.45],[ 0.45, 0.45]], [ 1.62,-0.65]),
    getAffine([[ 0.45, 0.45],[-0.45, 0.45]], [-1.62,-0.65]),
    getLinear([[0,0],[0,-1.1]]),
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
  scale: 1,
  order: 4,
  referenceRegion: {
    o: [-0.5,0],
    x: [1   ,0] ,
    y: [0   ,1],
  },
  transforms: [], // defined on object initialization
  probabilities: [], 
  init: () => {
    random.transforms = [];
    for (var i = 0; i < random.order; i++) {
      random.transforms = random.transforms.concat(scaleTransform(randomAffine(), random.scale))
    }
    random.probabilities = Array(random.order).fill(1/random.order);
  },
};
