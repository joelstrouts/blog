
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
      .chain(p)
      .multiply([[0.85, -0.04], [0.04, 0.85]])
      .add([0, 1.6])
      .done();
  } else if (0.86 <= ran && ran < 0.93) {
    q = math
      .chain(p)
      .multiply([[0.2, 0.23], [-0.4, 0.22]])
      .add([0, 1.6])
      .done();
  } else if (0.93 <= ran && ran < 1.0) {
    q = math
      .chain(p)
      .multiply([[-0.15, 0.26], [0.28, 0.24]])
      .add([0, 0.44])
      .done();
  }
  return { x: q[0], y: q[1] };
};
const getNewPostion2 = args => {
  let p = [args.point.x, args.point.y];
  let q = [args.point.x, args.point.y];
  let ran = Math.random();
  if (0.0 <= ran && ran < 0.01) {
    if (args.active[0]) {
      q = math.multiply([[0, 0], [0, 0.16]], p);
    }
  } else if (0.01 <= ran && ran < 0.86) {
    if (args.active[1]) {
      q = math
        .chain(p)
        .multiply([[0.85, -0.04], [0.04, 0.85]])
        .add([0, 1.6])
        .done();
    }
  } else if (0.86 <= ran && ran < 0.93) {
    if (args.active[2]) {
      q = math
        .chain(p)
        .multiply([[0.2, 0.23], [-0.26, 0.22]])
        .add([0, 1.6])
        .done();
    }
  } else if (0.93 <= ran && ran < 1.0) {
    if (args.active[3]) {
      q = math
        .chain(p)
        .multiply([[-0.15, 0.26], [0.28, 0.24]])
        .add([0, 0.44])
        .done();
    }
  }
  return { x: q[0], y: q[1] };
};
const myFern = (args) => {
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
  const itterations = args.points;

  for (var i = 0; i < itterations; i++) {
    paintPixel(p, coordTransform, imageData);
    p = getNewPostion(p);
  }
  context.putImageData(imageData,0,0);
  const timetaken = new Date().getTime() - starttime;
  document.getElementById('myReport').innerHTML =
    args.points + ' points plotted in ' + timetaken + 'ms';
}
const myFern2 = (args) => {
  const starttime = new Date().getTime();
  const reportDiv = args.reportDiv;
  const myCanvas = document.getElementById(args.canvas);
  const context = myCanvas.getContext('2d');
  const margin = 5;
  const width = 373;
  const height = 752;
  const xmid = Math.floor(width/2);
  const ymid = Math.floor(height/2);
  let imageData = new ImageData(width, height);
  const coordTransform1 = {
    x: {
      in: { left: -2.182, right: 2.6558 },
      out: { left: 0 + margin, right: xmid },
    },
    y: {
      in: { left: 0, right: 9.9983 },
      out: { left: ymid , right: 0 + margin },
    },
  };
  coordTransform1.scale = getScale(coordTransform1);
  const coordTransform2 = {
    x: {
      in: { left: -2.182, right: 2.6558 },
      out: { left: xmid, right: width - margin },
    },
    y: {
      in: { left: 0, right: 9.9983 },
      out: { left: ymid, right: 0 + margin },
    },
  };
  coordTransform2.scale = getScale(coordTransform2);
  const coordTransform3 = {
    x: {
      in: { left: -2.182, right: 2.6558 },
      out: { left: 0 + margin, right: xmid },
    },
    y: {
      in: { left: 0, right: 9.9983 },
      out: { left: height - margin, right: ymid },
    },
  };
  coordTransform3.scale = getScale(coordTransform3);
  const coordTransform4 = {
    x: {
      in: { left: -2.182, right: 2.6558 },
      out: { left: xmid, right: width - margin },
    },
    y: {
      in: { left: 0, right: 9.9983 },
      out: { left: height - margin, right: ymid },
    },
  };
  coordTransform4.scale = getScale(coordTransform4);

  var p1 = { x: 0, y: 0 };
  var p2 = { x: 0, y: 0 };
  var p3 = { x: 0, y: 0 };
  var p4 = { x: 0, y: 0 };
  const itterations = args.points;

  for (var i = 0; i < itterations; i++) {
    paintPixel(p1, coordTransform1, imageData);
    paintPixel(p2, coordTransform2, imageData);
    paintPixel(p3, coordTransform3, imageData);
    paintPixel(p4, coordTransform4, imageData);
    p1 = getNewPostion2({ point: p1, active: [false,true,true,true] });
    p2 = getNewPostion2({ point: p2, active: [true,false,true,true] });
    p3 = getNewPostion2({ point: p3, active: [true,true,false,true] });
    p4 = getNewPostion2({ point: p4, active: [true,true,true,false] });
  }
  context.putImageData(imageData,0,0);
  const timetaken = new Date().getTime() - starttime;
  document.getElementById(reportDiv).innerHTML =
    args.points * 4 + ' points plotted in ' + timetaken + 'ms';
}
