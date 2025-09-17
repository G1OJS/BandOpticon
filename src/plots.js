import {myCall} from './config.js';
import {mhToLatLong} from './geo.js'
import {colours, view, setMainViewHeight, freeTiles} from './main.js'
import {startRibbon} from './ribbon.js'
import {countryOutlinePlugin} from './map.js'

export var charts = new Map();
export var activeModes = new Set();
export var callLocations = new Map();


export function addSpot(spot) {
	activeModes.add(spot.md);
	updatePoint(spot.b, spot.md, spot.sc, spot.sl, true, false, (spot.sc == myCall)||(spot.rc == myCall))
	updatePoint(spot.b, spot.md, spot.rc, spot.rl, false, true, (spot.sc == myCall)||(spot.rc == myCall))
	updateLine(spot.b, spot.md, spot.sc, spot.rc, (spot.sc == myCall)||(spot.rc == myCall));
}
export function toggleZoomToDataRange(canvas_el, zoomOut = false){
	let tile = canvas_el.closest('.bandTile');
	let chart = charts.get(tile.dataset.band);
	let s = chart.options.scales;
	let zoom = null;
	if(s.x.min > -180 || zoomOut){
		s.x.min = -180; s.x.max = 180; s.y.min = -90; s.y.max = 90;	
		zoom = 'out';
	} else {
		let rng = getAxisRanges(chart.data);
		s.x.min = rng.xmin; s.x.max = rng.xmax; s.y.min = rng.ymin; s.y.max = rng.ymax;		
		zoom = 'in';
	}
	chart.update('none');
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

function updatePoint(band, mode, call, callSq, tx, rx, hl) {
	
  // find or create the chart for this band
  if (!charts.get(band)) charts.set(band, createChart(band));
  const chart = charts.get(band);

  // find or create chart's dataset for this mode
  let label = mode +"_"+hl; // highlight gets its own layer so we can  use order to push it to the front
  let ds = chart.data.datasets.find(d => d.label === label);
  if (!ds) {
    ds = { label: label, data: [], backgroundColor:[] , pointRadius: hl? 4:6, order:(hl? -100:10)};
    chart.data.datasets.push(ds);
  }

  // find or create the point 
  //(needs optimisation - use a set or map to test if call exists on this band and mode (can't use call location as that's all bands and modes)
  let pt = ds.data.find(p => p.call === call);
  if (!pt) {
	pt = getLocation(call, callSq);
	pt.attribs = {tx:tx, rx:rx, hl:hl}	
    pt.call = call;	
	pt.pointRadius = 6;
	pt.z = 0;
	ds.data.push(pt);
  }
  pt.attribs.tx ||= tx; pt.attribs.rx ||= rx; pt.attribs.hl ||= hl;
  let idx = ds.data.indexOf(pt)
  let a = pt.attribs;
  if(hl){
	ds.backgroundColor[idx] = (a.tx && a.rx)? colours.txrxhl: (a.tx? colours.txhl: colours.rxhl);
  } else {
	ds.backgroundColor[idx] = (a.tx && a.rx)? colours.txrx: (a.tx? colours.tx: colours.rx);
  }

}

function updateLine(band, mode, sc, rc, hl) {
	
  const chart = charts.get(band);
  const label = mode + "_conns"+"_"+hl;  // highlight gets its own layer so we can  use order to push it to the front

  // find or create chart's dataset for this layer
  let ds = chart.data.datasets.find(d => d.label === label);
  if (!ds) {
    ds = {label: label, data: [], showLine: true, spanGaps: false, 
			borderColor: (hl)? colours.connhl: colours.conn, pointRadius:0, hitRadius:0, order:hl? -100:100};
    chart.data.datasets.push(ds);
  }

  let lbl = sc+"|"+rc;
  if (!ds.data.includes(lbl)){
	let tx = callLocations.get(sc);
	let rx = callLocations.get(rc);  
	ds.data.push({x:tx.x, y:tx.y, call:rc}) // uses call to label tooltip for line with 'other end'
	ds.data.push({x:rx.x, y:rx.y, call:sc})
	ds.data.push(lbl);
  }

}

function createChart(band) {
	const tile = freeTiles.pop();   

	tile.dataset.band = band;          
	tile.querySelector('.bandTileTitle').textContent = band;
	const canvas = tile.querySelector('canvas');
	if (view == "Overview") canvas.closest('.bandTile').classList.remove('hidden');
	
    const ctx = canvas.getContext('2d');
	const ch = new Chart(ctx, 
		{ 	type:'scatter',
			plugins: [countryOutlinePlugin],
			data: { datasets: [  ] },
			options: {
				animation: false, 
				plugins: {	
							tooltip:{callbacks: {label: function(context) {return context.raw.call;} }},
							legend: {display: false}
						 },
				scales: {
					x: {display:false, max:180, min:-180},
					y: {display:false, max:90, min: -90}
					}
			}
		}
	);

	console.log("Ceated chart for "+band);
    return ch;
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

