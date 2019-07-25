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
const getAffine = (M,c) => p => getComposition(getLinear(M), getTranslation(c))(p);
const getLinear = M => p => {
  return [
    p[0] * M[0][0] + p[1] * M[1][0],
    p[0] * M[0][1] + p[1] * M[1][1]
  ];
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

// TODO: implement this draw line function properly
// const drawLine = ([x1,y1], [x2,y2], imgData, rgba) => {
//   let dx = x2 - x1; let dy = y2 - y1;
//   if (dx === dy) {
//     for (var i = 0; i <= dx; i++) {
//       paintPixel([x1 + Math.sign(dx) * i, y1 + Math.sign(dy) * i], imgData, rgba);
//     }
//   }
// }
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

const getFractal = (def, N) => {
  const imageData = new ImageData(
    def.canvasDimensions[0], def.canvasDimensions[1]
  );
  let p = [0,0];
  for (var i = 0; i < N; i++) {
    let pixelPos = def.ctf(p).map(c => Math.floor(c));
    paintPixel(pixelPos, imageData, [0,160,0,255]);
    p = def.algorithm(p);
  }
  return imageData;
}
const Fractal = {
  get: (def, n) => {
    def.ctf = getCoordinateTransform(
      def.referenceRegion,
      [
        [def.margin, def.canvasDimensions[1] - def.margin], 
        [def.margin, def.margin], 
        [def.canvasDimensions[0] - def.margin, def.canvasDimensions[1] - def.margin]
      ]
    ),
    def.init();
    def.initialised = true;
    return getFractal(def, n)
  }
}

const barnsleyFern = {
  initialised: false,
  init: x => x,
  margin: 40,
  canvasDimensions: [373, 752],
  referenceRegion: [[-2.182,0],[-2.182,9.9983],[2.6558,0]],
  algorithm: (p) => {
    // they are: base, stem copies, left frond, right frond.
    const f1 = getLinear([[ 0.00, 0.00],[ 0.00, 0.16]]);
    const f2 = getAffine([[ 0.85,-0.04],[ 0.04, 0.85]], [0.00,1.60]);
    const f3 = getAffine([[ 0.20, 0.23],[-0.26, 0.22]], [0.00,1.60]);
    const f4 = getAffine([[-0.15, 0.26],[ 0.28, 0.24]], [0.00,0.44]);
    let q; let rand = Math.random();
    if (0.0 <= rand && rand < 0.01) {
      q = f1(p);
    } else if (0.01 <= rand && rand < 0.86) {
      q = f2(p);
    } else if (0.86 <= rand && rand < 0.93) {
      q = f3(p);
    } else if (0.93 <= rand && rand < 1.0) {
      q = f4(p);
    }
    return q;
  }
}
const mapleLeaf = {
  initialised: false,
  margin: 40,
  canvasDimensions: [373, 752],
  referenceRegion: [[-3,-4],[-3,5],[3,-4]],
  algorithm: (p) => {
    // they are: base, stem copies, left frond, right frond.
    const f1 = getAffine([[ 0.14, 0.00],[ 0.01, 0.51]], [-0.08,-1.31]);
    const f2 = getAffine([[ 0.43,-0.45],[ 0.52, 0.50]], [ 1.49,-0.75]);
    const f3 = getAffine([[ 0.45, 0.47],[-0.49, 0.47]], [-1.62,-0.74]);
    const f4 = getAffine([[ 0.49, 0.00],[ 0.00, 0.51]], [ 0.02, 1.62]);
    let q; let rand = Math.random();
    if (0.0 <= rand && rand < 0.01) {
      q = f1(p);
    } else if (0.01 <= rand && rand < 0.86) {
      q = f2(p);
    } else if (0.86 <= rand && rand < 0.93) {
      q = f3(p);
    } else if (0.93 <= rand && rand < 1.0) {
      q = f4(p);
    }
    return q;
  }
}
const random = {
  initialised: false,
  init: () => {
    random.transforms = [
      randomAffine(),
      randomAffine(),
      randomAffine(),
      randomAffine(),
    ]
    console.log(random.transforms)
  },
  margin: 40,
  canvasDimensions: [373, 752],
  referenceRegion: [[-3,-4],[-3,5],[3,-4]],
  algorithm: (p) => {
    let q; let rand = Math.random();
    if (0.0 <= rand && rand < 0.2) {
      q = random.transforms[0](p);
    } else if (0.2 <= rand && rand < 0.4) {
      q = random.transforms[1](p);
    } else if (0.4 <= rand && rand < 0.7) {
      q = random.transforms[2](p);
    } else if (0.7 <= rand && rand < 1.0) {
      q = random.transforms[3](p);
    }
    return q;
  }
}
