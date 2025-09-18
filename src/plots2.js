import {myCall} from './config.js';
import {mhToLatLong} from './geo.js'
import {colours, view, setMainViewHeight, freeTiles} from './main.js'
import {startRibbon} from './ribbon.js'
import {countryOutlinePlugin} from './map.js'

export var charts = new Map();
export var activeModes = new Set();
export var callLocations = new Map();

export function toggleZoomToDataRange(canvas_el, zoomOut = false){
	let tile = canvas_el.closest('.bandTile');
	let chart = charts.get(tile.dataset.bandMode);

	let zoom = null;
	if(s.x.min > -180 || zoomOut){
		s.x.min = -180; s.x.max = 180; s.y.min = -90; s.y.max = 90;	
		zoom = 'out';
	} else {
		let rng = getAxisRanges(chart.data);
		s.x.min = rng.xmin; s.x.max = rng.xmax; s.y.min = rng.ymin; s.y.max = rng.ymax;		
		zoom = 'in';
	}

	return zoom;
}

export function resetData(){
	charts.forEach(chart => {chart.destroy()});
	for (const el of document.querySelectorAll('.bandTile')) el.classList.add('hidden');
	charts = new Map();
	activeModes = new Set();
	tileCanvases = Array.from(document.querySelectorAll('.bandCanvas'));
	freeCanvases = [...tileCanvases];
	callLocations = new Map(); 
	startRibbon();
}

export function hideUnwatchedModeLayers(mode) {
  charts.forEach(chart => {
    chart.data.datasets.forEach(ds => {
      chart.getDatasetMeta(chart.data.datasets.indexOf(ds)).hidden = ds.label.split("_")[0] != mode;
    });
  });
}

function getLocation(call, callSq){
	if(!callLocations.get(call)) {
		let ll = mhToLatLong(callSq);
		callLocations.set(call, {x:ll[1], y:ll[0]});
	}
	return callLocations.get(call);
}

export function addSpot(spot) {
	if(spot.md !="FT8") return;
	activeModes.add(spot.md);
	let tile = charts.get(spot.b+"-"+spot.md);
	if(!tile) tile = new BandModeTile(spot.b+"-"+spot.md)
	let isHl = (spot.sc == myCall || spot.rc == myCall);
	let s = {call:spot.sc, sq:spot.sl, txrx:'tx'};
	tile.updateCall(s, isHl);
	let r = {call:spot.rc, sq:spot.rl, txrx:'rx'};
	tile.updateCall(r, isHl);
	tile.updateConn(s,r, isHl);
}

function getAxisRanges(data){

	let xrng = [1000,-1000];
	let yrng = [1000,-1000];
	for (const ds of data.datasets){
		for (const di of ds.data) {
			xrng = [di.x<xrng[0]? di.x:xrng[0], di.x>xrng[1]? di.x:xrng[1]] ;
			yrng = [di.y<yrng[0]? di.y:yrng[0], di.y>yrng[1]? di.y:yrng[1]] ;
		}
	}

	function steprange(x){
		const ranges = [5,10,20,40,60,80,110,130,150,170,190,210,230,250,270,290,310,330,350,360];
		let idx=0;
		while (x>ranges[idx]) idx+=1;
		return ranges[idx];
	}

	let dx =xrng[1]-xrng[0]; 
	let dy =yrng[1]-yrng[0]; 
	let y0 = (yrng[0]+yrng[1])/2;
	let x0 = (xrng[0]+xrng[1])/2;
	
	if(dx > 2* dy){
		dy = steprange(dx/2);
		dx = dy * 2;
	} else {
		dx = steprange(dy*2);
		dy = dx / 2;
	}

	return {xmin:Math.max(-180, x0-dx/2), xmax: Math.min(180, x0+dx/2), ymin:Math.max(-90,y0-dy/2), ymax:  Math.min(y0+dy/2)};
	
}


class BandModeTile {
  constructor(bandMode) {
	this.bandTile = freeTiles.pop();
	this.canvas = this.bandTile.querySelector('canvas');   
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(2,2);
    this.bgCol = 'white';
    this.calls = new Map();
	if (view == "Home") this.bandTile.classList.remove('hidden');
	charts.set(bandMode, this);
	console.log("Ceated chart for "+bandMode);
  }
  px(ll){
    let x = (this.canvas.width*(ll[1]+180)/360)/2;
    let y = (this.canvas.height*(90-ll[0])/180)/2;
    return [x,y];
  }
  updateCall(s, isHl){
      let cInfo = this.calls.get(s.call);
      if (!cInfo) {
        cInfo = {p:this.px(mhToLatLong(s.sq)), sq:s.sq, tx:s.txrx=='tx',rx:s.txrx=='rx', isHl:s.isHl};
        this.calls.set(s.call, cInfo);
      }
      cInfo.tx ||= s.txrx=='tx';
      cInfo.rx ||= s.txrx=='rx';
      drawBlob(this.ctx,cInfo.p[0],cInfo.p[1],4,this.bgCol);
      let pcol = null;
      if(cInfo.isHl){
        pcol= (cInfo.tx && cInfo.rx)? colours.txrxhl: (cInfo.tx? colours.txhl: colours.rxhl);
      } else {
        pcol= (cInfo.tx && cInfo.rx)? colours.txrx: (cInfo.tx? colours.tx: colours.rx);
      }
      drawBlob(this.ctx,cInfo.p,4,pcol);
  }
  
  showHighlights(){
    for (const cl of this.calls.entries()) { if(cl[1].hl) this.updateCall({call:cl[1].call, sq:cl[1].sq, txrx:cl[1].txrx, hl:cl[1].hl})}   
  }
  
  updateConn(s,r, isHl){
     let sInfo = this.calls.get(s.call);
     let rInfo = this.calls.get(r.call);
     let col = (isHl)? colours.connhl:colours.conn;
     drawLine(this.ctx, sInfo.p, rInfo.p, col)
  }
  
}

function drawBlob(ctx,xy,sz,col){
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(xy[0],xy[1],sz/2,0,6.282);
  ctx.fill();
}

function drawLine(ctx,p0,p1,col){
    ctx.strokeStyle = col;
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(p0[0],p0[1]);
    ctx.lineTo(p1[0],p1[1]);
    ctx.stroke();
}
