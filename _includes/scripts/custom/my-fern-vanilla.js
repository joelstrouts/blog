/**************************/
/* HELPER FUNCTIONS START */
/**************************/
/* FUNCTIONAL ESSENTIALS
 */
const zip = (list1, list2) => list1.map((value, key) => [value, list2[key]]);
const getComposition = (...functions) => (point) => {
  return functions.reduce((value, func) => func(value), point);
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
    returnList = Array.concat(returnList, runningTotal);
  }
  return returnList;
}

/* PROJECTION / DRAWING
 */
const getCoordinateTransform = (inplex, outplex) => (point) => {
  const rx = vMinus(inplex[1],  inplex[0]);
  const ry = vMinus(inplex[2],  inplex[0]);
  const rx_out = vMinus(outplex[1],  outplex[0]);
  const ry_out = vMinus(outplex[2],  outplex[0]);
  return getComposition(
    getTranslation(vScale(-1, inplex[0])),
    getLinear(mInverse([rx, ry])),
    getLinear([rx_out, ry_out]),
    getTranslation(outplex[0])
  )(point);
}
const paintPixel = ([x,y], imgData, rgba) => {
  const index = 4 * (y * imgData.width + x);
  imgData.data[index + 0] = rgba[0];
  imgData.data[index + 1] = rgba[1];
  imgData.data[index + 2] = rgba[2];
  imgData.data[index + 3] = rgba[3];
}
const paintPixelBox = ([x,y], imgData, rgba, size) => {
  for (var i = - size; i < size; i++) {
    for (var j = - size; j < size; j++) {
    const index = 4 * ((y + j) * imgData.width + (x + i));
    imgData.data[index] = rgba[0];
    imgData.data[index + 1] = rgba[1];
    imgData.data[index + 2] = rgba[2];
    imgData.data[index + 3] = rgba[3];
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
    paintPixel([ypxl1, xpxl1],     imgData, Array.concat(rgb, rfpart(yend) * xgap * 255));
    paintPixel([ypxl1 + 1, xpxl1], imgData, Array.concat(rgb,  fpart(yend) * xgap * 255));
  } else {
    paintPixel([xpxl1, ypxl1],     imgData, Array.concat(rgb, rfpart(yend) * xgap * 255));
    paintPixel([xpxl1, ypxl1 + 1], imgData, Array.concat(rgb,  fpart(yend) * xgap * 255));
  }
  let intery = yend + m;

  // second end point
  xend = round(x2);
  yend = y2 + m * (xend - x2);
  xgap = fpart(x2 + 0.5)
  let xpxl2 = xend;
  let ypxl2 = ipart(yend);
  if (steep) {
    paintPixel([ypxl2, xpxl2],     imgData, Array.concat(rgb, rfpart(yend) * xgap * 255));
    paintPixel([ypxl2 + 1, xpxl2], imgData, Array.concat(rgb, fpart(yend) * xgap * 255));
  } else {
    paintPixel([xpxl2, ypxl2],     imgData, Array.concat(rgb, rfpart(yend) * xgap * 255));
    paintPixel([xpxl2, ypxl2 + 1], imgData, Array.concat(rgb,  fpart(yend) * xgap * 255));
  }

  // line inbetween
  if (steep) {
    for (var x = xpxl1 + 1; x < xpxl2; x++) {
      paintPixel([ipart(intery), x],     imgData, Array.concat(rgb, rfpart(intery) * 255));
      paintPixel([ipart(intery) + 1, x], imgData, Array.concat(rgb,  fpart(intery) * 255));
      intery = intery + m;
    }
  } else {
    for (var x = xpxl1 + 1; x < xpxl2; x++) {
      paintPixel([x, ipart(intery)],     imgData, Array.concat(rgb, rfpart(intery) * 255));
      paintPixel([x, ipart(intery) + 1], imgData, Array.concat(rgb,  fpart(intery) * 255));
      intery = intery + m;
    }
  }
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

const getFractal = (def, N, providedOptions) => {
  const imageData = new ImageData(
    def.canvasDimensions[0],
    def.canvasDimensions[1]
  );
  let p = [0,0];
  let options = {};
  if (providedOptions) {
    options = providedOptions;
    if (!options.style)  { options.style = Fractal.defaultOptions.style; }
    if (!options.color)  { options.color = Fractal.defaultOptions.color; }
    if (!options.colors) { options.colors = Fractal.defaultOptions.colors; }
  } else {
    options = Fractal.defaultOptions;
  }

  // MAIN LOOP
  if(options.style == 'lines') {
    // draw initial point before the main loop begins
    let pixelOrigin = def.ctf(p).map(e => Math.floor(e));
    paintPixelBox(pixelOrigin, imageData, Array.concat(color, 255), 4);
  }
  let thisColor;
  if (options.color == 'last') {
    thisColor = () => options.colors[Fractal.lastTransform];
  } else {
    thisColor = () => options.colors[0];
  }
  for (var i = 0; i < N; i++) {
    let q = Fractal.applyTransform(def)(p);
    let [a, b] = [p,q].map(v => def.ctf(v).map(e => Math.floor(e)));
    if (options.style == 'dots') {
      paintPixel(b, imageData, Array.concat(thisColor(), 255));
    } else if (options.style == 'blobs') {
      paintPixelBox(b, imageData, Array.concat(thisColor(), 255), 1);
    } else if (options.style == 'lines') {
      drawLine(a, b, imageData, Fractal.thisColor());
      paintPixelBox(b, imageData, Array.concat(thisColor(), 255), 4);
    }
    p = q;
  }
  return imageData;
}
const Fractal = {
  init: (def) => {
    def.ctf = getCoordinateTransform(
      def.referenceRegion,
      [
        [def.margin, def.canvasDimensions[1] - def.margin], 
        [def.margin, def.margin], 
        [def.canvasDimensions[0] - def.margin, def.canvasDimensions[1] - def.margin]
      ]
    )
    def.probBins = cummulative(def.probabilities);
    if (def.init) { def.init(); }
  },
  get: (def, n, drawingMethod, coloringMethod) => {
    Fractal.init(def);
    return getFractal(def, n, drawingMethod, coloringMethod);
  },
  applyTransform: def => p => {
    let rand = Math.random();
    let choice = 0;
    while (rand > def.probBins[choice]) { choice += 1; }
    Fractal.lastTransform = choice;
    return def.transforms[choice](p);
  },
  defaultOptions: {
    style: 'dots',
    color: 'uniform',
    colors: [
      [0, 200, 0],
      [190, 0, 150],
      [200, 110, 0],
      [210, 0, 0],
      [0, 0, 200],
      [40, 40, 40],
    ],
  }
}

const barnsleyFern = {
  margin: 40,
  canvasDimensions: [373, 752],
  referenceRegion: [[-2.182,0],[-2.182,9.9983],[2.6558,0]],
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
}
const binaryTree = {
  margin: 40,
  canvasDimensions: [373, 752],
  referenceRegion: [[-0.5,0],[-0.5,1],[0.5,0]],
  algorithm: (p) => {
    // they are: base, stem copies, left frond, right frond.
    const f1 = getLinear([[ 0.01, 0.00],[ 0.00, 0.45]]);
    const f2 = getAffine([[-0.01,-0.04],[ 0.00,-0.45]], [0.00, 0.40]);
    const f3 = getAffine([[ 0.42, 0.42],[-0.42, 0.42]], [0.00, 0.40]);
    const f4 = getAffine([[ 0.42,-0.42],[ 0.42, 0.42]], [0.00, 0.40]);
    let q; let rand = Math.random();
    if (0.0 <= rand && rand < 0.25) {
      q = f1(p);
      Fractal.color = [200, 110, 0];
    } else if (rand < 0.5) {
      q = f2(p);
      Fractal.color = [190, 0, 150];
    } else if (rand < 0.75) {
      q = f3(p);
      Fractal.color = [0, 200, 0];
    } else if (rand < 1.0) {
      q = f4(p);
      Fractal.color = [0, 50, 200];
    }
    return q;
  }
}
const mapleLeaf = {
  margin: 40,
  canvasDimensions: [373, 752],
  referenceRegion: [[-3,-4],[-3,5],[3,-4]],
  transforms: [
    getAffine([[ 0.14, 0.00],[ 0.01, 0.51]], [-0.08,-1.31]),
    getAffine([[ 0.43,-0.45],[ 0.52, 0.50]], [ 1.49,-0.75]),
    getAffine([[ 0.45, 0.47],[-0.49, 0.47]], [-1.62,-0.74]),
    getAffine([[ 0.49, 0.00],[ 0.00, 0.51]], [ 0.02, 1.62]),
  ],
  probabilities: [
    0.01,
    0.85,
    0.07,
    0.07,
  ],
}
const sandDollar = {
  margin: 40,
  canvasDimensions: [373, 752],
  referenceRegion: [[0,0],[0,1],[1,0]],
  transforms: [
    getAffine([[ 0.382, 0.0100],[ 0.0000, 0.382]], [0.3090, 0.5700]),
    getAffine([[ 0.118, 0.3630],[-0.3630, 0.118]], [0.3633, 0.3306]),
    getAffine([[ 0.118,-0.3630],[ 0.3630, 0.118]], [0.5187, 0.6940]),
    getAffine([[-0.309, 0.2245],[-0.2245,-0.309]], [0.6070, 0.3090]),
    getAffine([[-0.309,-0.2245],[ 0.2245,-0.309]], [0.7016, 0.5335]),
    getAffine([[ 0.382, 0.0000],[ 0.0000,-0.382]], [0.3090, 0.6770]),
  ],
  probabilities: Array(6).fill(1/6),
}
const random = {
  margin: 60,
  canvasDimensions: [373, 752],
  referenceRegion: [[-1,-1],[-1,1],[1,-1]],
  num: 4,
  transforms: [], // defined on function call
  probabilities: [], // ditto
  init: () => {
    random.transforms = [];
    for (var i = 0; i < random.num; i++) {
      random.transforms = Array.concat(random.transforms, randomAffine());
    }
    random.probabilities = Array(random.num).fill(1/random.num);
  },
}
