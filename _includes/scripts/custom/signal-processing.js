
let canvas;
let context;
const setup = () => {
  canvas = document.getElementById("frame-canvas");
  context = canvas.getContext("2d");
}

const singleBinaryChannel = (imageData) => {
  let compressedData = Array(imageData.width * imageData.height);
  for(var i = 0; i < compressedData.length; i++) {
    if (imageData.data[i+2] != 0) {
      compressedData[i] = 1;
    } else {
      compressedData[i] = 0;
    }
  }
  return {height: imageData.height, width: imageData.width, data: compressedData};
}
const getPixel = (point, imageData) => {
  let [x,y] = [point[0], point[1]];
  if (x < 0
  ||  x > imageData.width
  ||  y < 0
  ||  y > imageData.height) {
    return [0,0,0,0];
  } else {
    let index = (imageData.width * point[1] + point[0]) * 4;
    return [
      imageData.data[index],
      imageData.data[index + 1],
      imageData.data[index + 2],
      imageData.data[index + 3],
    ];
  }
}
const copy = arr => {
  let newArr = Array(arr.length);
  for (var i = 0; i < arr.length; i++) {
    newArr[i] = arr[i];
  }
  return newArr;
}
const half = v => v.map(a => Math.floor(a / 2));

const dwt = (ID, order) => {
  let returnData = new ImageData(ID.width, ID.height);
  let [height,width] = [ID.height,ID.width];
  let [halfHeight, halfWidth] = half([height, width]);
  let workingData = new ImageData(ID.width, ID.height);
  for (var i = 0; i < workingData.data.length; i++) {
    workingData.data[i] = ID.data[i];
  }
  for (var nesting = 1; nesting <= order; ++nesting) {
    for (var i = 0; i < width; i += 2) {
      for (var j = 0; j < height; j += 2) {
        let [TL, BL, TR, BR] = [
          getPixel([i,j], workingData),
          getPixel([i,j+1], workingData),
          getPixel([i+1,j], workingData),
          getPixel([i+1,j+1], workingData)
        ].map(x => (x[3] > 0 ? ((x[0] < 150) ? 1 : 0) : 0));
        let A = Array(3).fill(255 - (+ TL + BL + TR + BR) * 63).concat(255);
        let V = Array(3).fill(127 - ((+ TL + BL - TR - BR) * 127)).concat(255);
        let H = Array(3).fill(127 - ((- TL + BL - TR + BR) * 127)).concat(255);
        let D = Array(3).fill(127 - ((+ TL - BL - TR + BR) * 127)).concat(255);
        
        paintPixel([i/2, j/2], returnData, A);
        paintPixel([i/2 + halfWidth, j/2], returnData, V);
        paintPixel([i/2, j/2 + halfHeight], returnData, H);
        paintPixel([i/2 + halfWidth, j/2 + halfHeight], returnData, D);
      }
    }
    [height, width, halfHeight, halfWidth] =
      half([height, width, halfHeight, halfWidth]);
    for (var i = 0; i < workingData.data.length; i++) {
      workingData.data[i] = returnData.data[i];
    }
  }
  return returnData;
}

const W = (scale, v) => {
  let f = 1 / scale;
  return img => {
    let result = 0;
    for(var i = 0; i < img.width; i++) {
      for(var j = 0; j < img.height; j++) {
        let pixelValue = getPixel([i,j], img)
        if (pixelValue[3] > 0) {
          let pointMass = ricker2d(f)(vMinus([i,j], v));
          result += pointMass;
        }
      }
    }
    return result
  }
}

const cwt = (range, samplingRate, pixelPos) => {
  return (img, inverseProjection) => {
    let arr = []
    for (var scale = range[0]; scale < range[1]; scale += samplingRate) {
      actualPos = inverseProjection(pixelPos);
      arr = arr.concat(W(scale, actualPos)(img));
    }
    return arr;
  }
}
const square = x => x * x;
const ricker1d = f => {
  return t => (1 - 2 * square(Math.PI * f * t)) * Math.exp(-square(Math.PI * f * t));
}
const ricker2d = f => {
  return ([x,y]) => ricker1d(f)(Math.sqrt(square(x) + square(y)));
}
