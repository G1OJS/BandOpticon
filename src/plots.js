import {myCall} from './config.js';
import {mhToLatLong} from './geo.js'
export const charts = new Map();
export const chartPoints = new Map();

const tileCanvases = Array.from(document.querySelectorAll('.bandCanvas'));
const freeCanvases = [...tileCanvases]; // mutable pool

const callLocations = new Map();  // call -> {x, y}

function getLocation(call, callSq){
	if(!callLocations.get(call)) {
		let ll = mhToLatLong(callSq);
		callLocations.set(call, {x:ll[1], y:ll[0]});
	}
	return callLocations.get(call);
}

function decideColour(spot){
		
	return 'green';
}

function updatePoint(band, mode, call, callSq, tx, rx, hl){

    if(!charts.get(band)) charts.set(band, createChart(band));
    const chart = charts.get(band);
	
	const pointKey = `${band}|${mode}|${call}`;	
    const pt = chartPoints.get(pointKey);
    if (pt) {
		pt.tx ||= tx; pt.rx ||= rx; pt.hl ||= hl;    
        pt.backgroundColor = decideColour(pt.attribs);
    } else {
		let newPt = getLocation(call, callSq);
		newPt.attribs = {tx:tx, rx:rx, hl:hl}		
		newPt.backgroundColor = decideColour(newPt.attribs);
        chart.data.datasets[0].data.push(newPt);
        chartPoints.set(pointKey, newPt);
    }

    chart.update();
}

export function addSpot(spot) {
	updatePoint(spot.b, spot.md, spot.sc, spot.sl, true, false, spot.sc == myCall)
	updatePoint(spot.b, spot.md, spot.rc, spot.rl, false, true, spot.rc == myCall)
}

function createChart(band) {
    if (freeCanvases.length === 0) {
        console.warn('No free canvas available!');
        return null;
    }

    const canvas = freeCanvases.shift(); // grab first free canvas
	canvas.parentElement.classList.remove('hidden');
	canvas.previousElementSibling.innerHTML = band;
	
    const ctx = canvas.getContext('2d');

	const ch = new Chart(ctx, 
		{ type:'scatter',
		  plugins: [countryOutlinePlugin],
		    data: { datasets: [ { data: [] } ] },
			options: {
			animation: false, 
			plugins: {	
						tooltip:{callbacks: {label: function(context) {return context.raw.cs;} }},
						legend: {display: false},             
						title: {display: false, align:'start', text: " "}},
			scales: {
				x: {display:false, title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom' , max:180, min:-180},
				y: {display:false, title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left' , max:90, min: -90}
				}
			}
		}
	);
	
    return ch;
}


function getAxisRanges(data, view){

	if(view == "Overview") return [[-180,180], [-90,90]]; 
	
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

	xrng = [Math.max(-180, x0-dx/2), Math.min(180, x0+dx/2)]		
	yrng = [Math.max(-90,y0-dy/2),   Math.min(y0+dy/2)]
	
	return [xrng, yrng];
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
 