
const getScale = ctf => {
  // ctf :: coordinate transform
  return {
    x: (ctf.x.out.right - ctf.x.out.left) / (ctf.x.in.right - ctf.x.in.left),
    y: (ctf.y.out.right - ctf.y.out.left) / (ctf.y.in.right - ctf.y.in.left)
  };
};

const getNewPostion = point => {
  let p = [point.x,point.y];
  let q; let ran = Math.random();
  if (0.0 <= ran && ran < 0.01) {
    q = math.multiply([[0, 0], [0, 0.16]], p);
  } else if (0.01 <= ran && ran < 0.86) {
    q = math
      .chain([point.x, point.y])
      .multiply([[0.85, -0.04], [0.04, 0.85]])
      .add([0, 1.6])
      .done();
  } else if (0.86 <= ran && ran < 0.93) {
    q = math
      .chain([point.x, point.y])
      .multiply([[0.2, 0.23], [-0.26, 0.22]])
      .add([0, 1.6])
      .done();
  } else if (0.93 <= ran && ran < 1.0) {
    q = math
      .chain([point.x, point.y])
      .multiply([[-0.15, 0.26], [0.28, 0.24]])
      .add([0, 0.44])
      .done();
  }
  return { x: q[0], y: q[1] };
};

const paintPixel = (vec, ctf, imd) => {
  // ctf :: coordinate transform, imd :: image data
  let pixel = {
    x: Math.floor( ctf.x.out.left + ctf.scale.x * (vec.x - ctf.x.in.left) ),
    y: Math.floor( ctf.y.out.left + ctf.scale.y * (vec.y - ctf.y.in.left) )
  }
  let index = 4 * (pixel.y * imd.width + pixel.x);
  imd.data[index] = 255;
  imd.data[index + 3] = 255;
};

const myFern = (points) => {
  const starttime = new Date().getTime();
  const myCanvas = document.getElementById('myCanvas');
  const context = myCanvas.getContext('2d');
  const margin = 5;
  const width = 373;
  const height = 752;
  let imageData = new ImageData(width, height);
  const coordTransform = {
    x: {
      in: { left: -2.182, right: 2.6558 },
      out: { left: 0 + margin, right: width - margin },
    },
    y: {
      in: { left: 0, right: 9.9983 },
      out: { left: height - margin, right: 0 + margin },
    },
  };
  coordTransform.scale = getScale(coordTransform);

  var p = { x: 0, y: 0 };
  const itterations = points;

  for (var i = 0; i < itterations; i++) {
    paintPixel(p, coordTransform, imageData);
    p = getNewPostion(p);
  }
  context.putImageData(imageData,0,0);
  const timetaken = new Date().getTime() - starttime;
  document.getElementById('myReport').innerHTML =
    points + ' points plotted in ' + timetaken + 'ms';
}

myFern(500000);
