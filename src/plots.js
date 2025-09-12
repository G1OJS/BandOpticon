import {myCall} from './config.js';
import {mhToLatLong} from './geo.js'
import {colours, view} from './main.js'
import {startRibbon} from './ribbon.js'
export var charts = new Map();
export var activeModes = new Set();
export var activeCanvases = new Map();
export var nCallsigns = 0;


var tileCanvases = Array.from(document.querySelectorAll('.bandCanvas'));
var freeCanvases = [...tileCanvases]; // mutable pool

var callLocations = new Map();  // call -> {x, y}

setInterval(() => sortBandTiles(), 1000);

function getLocation(call, callSq){
	if(!callLocations.get(call)) {
		let ll = mhToLatLong(callSq);
		callLocations.set(call, {x:ll[1], y:ll[0]});
	}
	return callLocations.get(call);
}

export function resetData(){
	charts.forEach(chart => {chart.destroy()});
	for (let idx =0;idx<20;idx++) document.getElementById('bandTile_'+idx).classList.add('hidden');
	charts = new Map();
	activeModes = new Set();
	activeCanvases = new Map();
	tileCanvases = Array.from(document.querySelectorAll('.bandCanvas'));
	freeCanvases = [...tileCanvases];
	callLocations = new Map(); 
	startRibbon();
}

export function filterAllCharts(mode) {
  charts.forEach(chart => {
    chart.data.datasets.forEach(ds => {
      chart.getDatasetMeta(chart.data.datasets.indexOf(ds)).hidden = ds.label.split("_")[0] != mode;
    });
    chart.update();
  });
}

function updatePoint(band, mode, call, callSq, tx, rx, hl) {
	
  // find or create the chart for this band
  if (!charts.get(band)) charts.set(band, createChart(band));
  const chart = charts.get(band);

  // find or create chart's dataset for this mode
  let ds = chart.data.datasets.find(d => d.label === mode);
  if (!ds) {
    ds = { label: mode, data: [], backgroundColor:[] , z:[], pointRadius:[]};
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
	ds.z[idx] = 10;
	ds.pointRadius[idx] = 4;
  } else {
	ds.backgroundColor[idx] = (a.tx && a.rx)? colours.txrx: (a.tx? colours.tx: colours.rx);
	ds.z[idx] = 0;
	ds.pointRadius[idx] = 6;
  }

  //chart.update();
}

function updateLine(band, mode, sc, rc) {
	
  const chart = charts.get(band);
  const label = mode + "_conns"
  let col = (sc==myCall || rc==myCall)? colours.connhl: colours.conn;

  // find or create chart's dataset for this mode
  let ds = chart.data.datasets.find(d => d.label === label);
  if (!ds) {
    ds = {label: label, data: [], showLine: true, spanGaps: false, borderColor: [col], pointRadius:0};
    chart.data.datasets.push(ds);
  }

  let lbl = sc+"|"+rc;
  if (!ds.data.includes(lbl)){
	let tx = callLocations.get(sc);
	let rx = callLocations.get(rc);  
	ds.data.push({x:tx.x, y:tx.y, call:rc}) // uses call to label tooltip for line with 'other end'
	ds.data.push({x:rx.x, y:rx.y, call:sc})
	ds.data.push(lbl);
	ds.borderColor.push(col);
  }

  chart.update();
}

function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}

function sortBandTiles(){
	nCallsigns = callLocations.size;
	const container = document.getElementById('bandsGrid');
	const orderedBands = Array.from(charts.keys()).sort(function(a, b){return wavelength(b) - wavelength(a)}); 
	for (const band of orderedBands){
		let idx = charts.get(band).canvas.id.split("_")[1];
		container.appendChild(document.getElementById('bandTile_'+idx));
	};
}

export function updateChartForView(tile_idx){
	let chart = activeCanvases.get(tile_idx);
	let s = chart.options.scales;
		
	if (view == "Overview"){
		s.x.min = -180; s.x.max = 180; s.y.min = -90; s.y.max = 90;	
	} else {
		let rng = getAxisRanges(chart.data);
		s.x.min = rng.xmin; s.x.max = rng.xmax; s.y.min = rng.ymin; s.y.max = rng.ymax;		
	}
	
	chart.update();
}

export function addSpot(spot) {
	activeModes.add(spot.md);
	updatePoint(spot.b, spot.md, spot.sc, spot.sl, true, false, (spot.sc == myCall)||(spot.rc == myCall))
	updatePoint(spot.b, spot.md, spot.rc, spot.rl, false, true, (spot.sc == myCall)||(spot.rc == myCall))
	updateLine(spot.b, spot.md, spot.sc, spot.rc);
}

function createChart(band) {
    if (freeCanvases.length === 0) {
        console.warn('No free canvas available!');
        return null;
    }

    const canvas = freeCanvases.shift(); // grab first free canvas
	if (view == "Overview") canvas.parentElement.classList.remove('hidden');
	canvas.previousElementSibling.innerHTML = band;
	
    const ctx = canvas.getContext('2d');

	const ch = new Chart(ctx, 
		{ type:'scatter',
		  plugins: [countryOutlinePlugin],
		    data: { datasets: [  ] },
			options: {
			animation: false, 
			plugins: {	
						tooltip:{callbacks: {label: function(context) {return context.raw.call;} }},
						legend: {display: false},             
						title: {display: false, align:'start', text: " "}},
			scales: {
				x: {display:false, max:180, min:-180},
				y: {display:false, max:90, min: -90}
				}
			}
		}
	);
	console.log("Ceated chart for "+band);
	activeCanvases.set(parseInt(canvas.id.split("_")[1]),ch);
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


let worldGeoJSON = null;

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson')
  .then(resp => resp.json())
  .then(data => {
	console.log("GeoJSON loaded:", data);
    worldGeoJSON = data;
  });


const countryOutlinePlugin = {
  id: 'countryOutline',
  beforeDatasetsDraw(chart, args, options) {
    const { ctx } = chart;
    ctx.save();
    ctx.strokeStyle = options.color || 'rgba(0,0,0,0.3)';
    ctx.lineWidth = options.lineWidth || 1;
    worldGeoJSON?.features.forEach(feature => {
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        drawPolygon(geom.coordinates, chart, ctx);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(polygon => drawPolygon(polygon, chart, ctx));
      }
    });

    ctx.restore();
  }
};
 

function drawPolygon(rings, chart, ctx) {
  rings.forEach(ring => {
    ctx.beginPath();
    ring.forEach(([lon, lat], i) => {
      const x = chart.scales.x.getPixelForValue(lon);
      const y = chart.scales.y.getPixelForValue(lat);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });
}
 