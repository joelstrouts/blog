var image;
var xsize;

function fern()
{
 var N=500000;
 var ysize=752;
 var margin=5;

 var scale=(ysize-2*margin)/9.9983;
 xsize=Math.floor(scale*4.8378+2*margin);

 var mycanvas=document.getElementById('mycanvas');
 mycanvas.width=xsize;
 mycanvas.height=ysize;
 var context=mycanvas.getContext('2d');
 var imagedata=context.createImageData(xsize,ysize);	// NOT ON ALL BROWSERS?
 image=imagedata.data;

 var starttime=new Date().getTime();

 var ox=margin+Math.floor(2.1820*scale);
 var oy=ysize-1-margin;

 var x=0.0;
 var y=0.0;

 for(var n=1;n<=N;n++)
 {
  PlotPixel(ox+Math.floor(x*scale),oy-Math.floor(y*scale));

  var r=Math.floor(Math.random()*100)
  var oldx=x;
  if(r==0)
  {
   x=0.0;
   y*=0.16;
  }
  else if(r<=85)
  {
   // tip of fern is the x,y which is invariant under this transformation i.e. x=640/241, y=2400/241
   x=0.85*oldx+0.04*y;
   y=-0.04*oldx+0.85*y+1.6;
  }
  else if(r<=92)
  {
   x=0.2*oldx-0.26*y;
   y=0.23*oldx+0.22*y+1.6;
  }
  else
  {
   x=-0.15*oldx+0.28*y;
   y=0.26*oldx+0.24*y+0.44;
  }
 }
 context.putImageData(imagedata,0,0);

 var timetaken=new Date().getTime()-starttime;
 document.getElementById('report').innerHTML=N+" points plotted in "+timetaken+"ms";
}

function PlotPixel(x,y)
{
 var index=4*(y*xsize+x);
 image[index]=0;	// r
 image[index+1]=0xc0;	// g
 image[index+2]=0;	// b
 image[index+3]=255;	// alpha
}

// call function
fern();
