/* image variable:
 * this variable will contain the imagedata object
 * The imagedata object has three parts:
 * an array of clamped uint8s (array of integer values
 * between 0 and 255), and the height and width.
 * the imagedata requires four unint8s
 * to describe each pixel (red value, green value,
 * blue and alpha) That means that the arry should
 * have length 4*width*height - so if the width
 * is 50 and the height is 100, the length of
 * the clamped uint8 array should be 20,000
 */
var image; 
var xsize;

function fern() {
  var N = 500000; // number of itterations (points to plot)
  var ysize = 752; // canvas height
  var margin = 5; // add border for aesthetic reasons

  /* 
   * 
   * the bounds on the generated image are:
   *
   * ---------------------------
   * | -2.1820 <= x <= 2.6558  |
   * |       0 <= y <= 9.9983  |
   * ---------------------------
   *
   * hence the use of these values when scaling output points
   * to plot on the grid (note that 2.6558 + 2.1820 = 4.8378)
   */

  // we can calculate the scale by working out the ratio
  // between the number of pixels of height the resulting image
  // should have vs. the height of the image in the fern's coord-
  // -inate space, ie;
  var scale = (ysize - 2 * margin) / 9.9983;
  // once the scale is calculated we apply it to find out the width
  // in pixels of the output
  xsize = Math.floor(scale * 4.8378) + 2 * margin;

  var jamesonCanvas = document.getElementById('jamesonCanvas');
  jamesonCanvas.width = xsize;
  jamesonCanvas.height = ysize;
  var context = jamesonCanvas.getContext('2d');
  var imagedata = context.createImageData(xsize, ysize); // NOT ON ALL BROWSERS?
  image = imagedata.data; // data is the clamped uint8 part of the imagedata

  var starttime = new Date().getTime();

  // the _pixel_ coordinates of the origin point in the fern's
  // coordinate system
  var ox = margin + Math.floor(2.182 * scale);
  var oy = ysize - 1 - margin; 

  // the coordiates of the start point (fern coordinates)
  var x = 0.0;
  var y = 0.0;

  for (var n = 1; n <= N; n++) {
    PlotPixel(ox + Math.floor(x * scale), oy - Math.floor(y * scale));

    var r = Math.floor(Math.random() * 100);
    var oldx = x;
    if (r == 0) {
      x = 0.0;
      y *= 0.16;
    } else if (r <= 85) {
      // tip of fern is the x,y which is invariant under this transformation i.e. x=640/241, y=2400/241
      x = 0.85 * oldx + 0.04 * y;
      y = -0.04 * oldx + 0.85 * y + 1.6;
    } else if (r <= 92) {
      x = 0.2 * oldx - 0.26 * y;
      y = 0.23 * oldx + 0.22 * y + 1.6;
    } else {
      x = -0.15 * oldx + 0.28 * y;
      y = 0.26 * oldx + 0.24 * y + 0.44;
    }
  }

console.log('second script loaded succesfully')
  context.putImageData(imagedata, 0, 0);

  var timetaken = new Date().getTime() - starttime;
  document.getElementById('jamesonReport').innerHTML =
    N + ' points plotted in ' + timetaken + 'ms';
}

function PlotPixel(x, y) {
  var index = 4 * (y * xsize + x);
  image[index] = 0; // r
  image[index + 1] = 0xc0; // g
  image[index + 2] = 0; // b
  image[index + 3] = 255; // alpha
}

// call function
fern();
