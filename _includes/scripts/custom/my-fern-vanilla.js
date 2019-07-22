const apply = (p, ...functions) => {
  return functions.reduce((value, func) => func(value) , p);
}
const getComposition = (...functions) => (point) => {
  return functions.reduce((value, func) => func(value), point);
}
const getLinear = M => p => {
  return [
    p[0] * M[0][0] + p[1] * M[1][0],
    p[0] * M[0][1] + p[1] * M[1][1]
  ];
}
const getTranslation = c => p => vAdd(p,c);
const getAffine = (M,c) => p => getComposition(getLinear(M), getTranslation(c))(p);
const mScale = (a, M) => M.map(v => vScale(a, v));
const det = ([[a,c],[b,d]]) => a*d - b*c;
const mInverse = ([[a,c],[b,d]]) => mScale(1/(a*d - b*c), [[d,-c],[-b,a]]);
const vScale = (a, v) => v.map((entry) => a * entry);
const vAdd = (...vectors) => {
  return vectors.reduce((v,w) => [v[0] + w[0], v[1] + w[1]]);
}
const vMinus = (v, w) => vAdd(v, vScale(-1, w));
const zip = (list1, list2) => list1.map((value, key) => [value, list2[key]]);
const dot = (v, w) => zip(v,w).reduce((pair1, pair2) => pair1[0] * pair1[1] + pair2[0] * pair2[1]);
const vMod = v => Math.sqrt(v.reduce((e1, e2) => e1 * e1 + e2 * e2));
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
  imgData.data[index] = rgba[0];
  imgData.data[index + 1] = rgba[1];
  imgData.data[index + 2] = rgba[2];
  imgData.data[index + 3] = rgba[3];
}
const barnsleyAlg = (p) => {
  const f1 = getLinear([[ 0.00, 0.00],[ 0.00, 0.16]]);
  const f2 = getAffine([[ 0.85,-0.04],[ 0.04, 0.85]], [0.00,1.60]);
  const f3 = getAffine([[ 0.20, 0.23],[-0.26, 0.22]], [0.00,1.60]);
  const f4 = getAffine([[-0.75, 0.26],[ 0.28, 0.24]], [0.00,0.44]);
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
const myFern = (algorithm, N, coordTransform, dims) => {
  const imageData = new ImageData(dims[0], dims[1])
  let p = [0,0];
  for (var i = 0; i < N; i++) {
    let pixelPos = coordTransform(p).map(c => Math.floor(c));
    paintPixel(pixelPos, imageData, [0,0,255,255]);
    p = algorithm(p);
  }
  return imageData;
}
const canvX = 373; const canvY = 752; const margin = 5;
const myCanvas = document.getElementById('myCanvas');
const context = myCanvas.getContext('2d');
const inplex = [[-2.182,0],[-2.182,9.9983],[2.6558,0]]
const outplex = [[margin, canvY - margin], [margin,margin], [canvX - margin, canvY - margin]];
const myCtf = getCoordinateTransform(inplex, outplex);
context.putImageData(myFern(barnsleyAlg, 100000, myCtf, [canvX, canvY]), 0, 0)
