import {connectToFeed, connectToTest, connectionsMap, callLocations} from './mqtt.js';

import {loadConfig, myCall} from './config.js';
import Ribbon from './ribbon.js';
let worldGeoJSON = null;

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson')
  .then(resp => resp.json())
  .then(data => {
	console.log("GeoJSON loaded:", data);
    worldGeoJSON = data;
  });

let charts={};
let bands = null;
let mode = null;
let	html ="";
let view = "Overview";
loadConfig();

const ribbon = new Ribbon({
  onModeChange: refreshMainView,
  onConfigChange: refreshMainView,
  onBandsChange: refreshMainView
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
 
setInterval(() => refreshMainView(), 5000);


const colours =   {tx:'rgba(250, 20, 20, .3)', 	rx:		'rgba(20, 250, 20, .3)',		txrx:'rgba(20, 20, 250, .3)',
					conn:'rgba(150, 150, 250, .2)' , connMe: 'red'
					};

html ="";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  colours.tx + "'></span>Tx</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  colours.rx + "'></span>Rx</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  colours.txrx + "'></span>TxRx</div>";
//html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  colours.txStrong + "'></span>Tx ("+myCall+")</div>";
//html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  colours.rxStrong + "'></span>Rx ("+myCall+")</div>";
//html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  colours.txrxStrong + "'></span>TxRx ("+myCall+")</div>";

html +="</div>";

document.getElementById('mainViewRibbon').innerHTML = html;

let overviewLegendHTML = html;

html ="";
for (let bandIdx =0;bandIdx<15;bandIdx++){
	let canvas_id = 'bandTileCanvas_'+bandIdx;
	html += "<div id = 'bandTile_"+bandIdx+"' class = 'bandTile hidden' ><div id = 'bandTileTitle_"+bandIdx+"'></div>";
	html += "<canvas id='"+canvas_id+"'></canvas>";
	html += "</div>";	
}
document.getElementById("bandsGrid").innerHTML = html;
for (let bandIdx =0;bandIdx<15;bandIdx++){
	let canvas_id = 'bandTileCanvas_'+bandIdx;
	document.getElementById(canvas_id).addEventListener("click", function (e) {refreshMainView(canvas_id)});
}

connectToFeed();
//connectToTest();
refreshMainView();


function refreshMainView( canvas_id_clicked = null ){
	
	if(canvas_id_clicked){
		for (let bandIdx =0;bandIdx<15;bandIdx++){
			document.getElementById('bandTile_'+bandIdx).classList.add("hidden");
		}
		view = (view == "Overview")? "Single":"Overview";
		if (view == "Single") {
			ribbon.setWatchedBands(charts[canvas_id_clicked]['band']);
			bands = ribbon.getWatchedBands();
		}
	}
	
	mode = ribbon.getWatchedMode();
	
	if(view == "Overview"){
		ribbon.setWatchedBands();
		bands = ribbon.getWatchedBands();
		document.getElementById("bandsGrid").style = "grid-template-columns:1fr 1fr 1fr;"
		document.getElementById("mainViewTitle").innerHTML="Bands Overview";
		for (let bandIdx =0;bandIdx<15;bandIdx++) drawBandTile(bandIdx);
	} else {
		document.getElementById("bandsGrid").style = "grid-template-columns:1fr"
		document.getElementById("mainViewTitle").innerHTML="Band detail";	
		drawBandTile(0)
	}

	
}


function drawBandTile(bandIdx){

	if(!bands[bandIdx]) return; 
	let band = bands[bandIdx];

	let canvas_id = 'bandTileCanvas_'+bandIdx;
	document.getElementById('bandTile_'+bandIdx).classList.remove("hidden");
	document.getElementById('bandTileTitle_'+bandIdx).innerHTML = "<div class = 'bandTileTitle'>" +band+ "</div>";

	let conns = connectionsMap[band][mode];	
	let tileCalls = {};
	let tileConns = [];
	let tilePoints  = {data:[], backgroundColor:[], pointRadius:[]} ;

	function check_add(call, tx, rx, hl){
		if(!tileCalls[call]) {	
			tileCalls[call]={tx:tx, rx:rx, hl:hl};
			let d = callLocations[call]
			d.cs = call;
			tilePoints.data.push(d);
		} else {
			tileCalls[call].tx |= tx;
			tileCalls[call].rx |= rx;
			tileCalls[call].hl |= hl;
		}
	}

	for (const hc in conns){
		for (const oc in conns[hc].heard_by) {
			check_add(hc, true, null, (hc==myCall));
			check_add(oc, null, true, (hc==myCall));
			let conn = hc+"-"+oc;
			if(!tileConns.includes(conn)) tileConns.push(conn);
		}
		for (const oc in conns[hc].heard) {
			check_add(hc, null, true, (hc==myCall));
			check_add(oc, true, null, (hc==myCall));
			let conn = hc+"-"+oc;
			if(!tileConns.includes(conn)) tileConns.push(conn);
		}
	}
	
	for (const i in tilePoints.data){
		let c = tileCalls[tilePoints.data[i].cs];
		tilePoints.backgroundColor.push( (c.tx && c.rx)? colours.txrx: (c.tx? colours.tx: colours.rx) );			
		tilePoints.pointRadius.push(5);
	}

	let data = { datasets: [tilePoints]};
	
	let [xrng, yrng] = getAxisRanges(data, view);
	
//	if (view=="Single" ) {
		for (const cl of tileConns){
			let c = cl.split("-");
			if(callLocations[c[0]] && callLocations[c[1]]){
				data.datasets.push({data:[callLocations[c[0]],callLocations[c[1]]], borderColor: ((c[0] == myCall)? colours.connMe:colours.conn), borderWidth: 2,
					pointRadius: ((c[0] == myCall)? 6:0), backgroundColor:(c.tx && c.rx)? colours.txrx: (c.tx? colours.tx: colours.rx) , showLine: true, pointHitRadius: 0, pointHoverRadius: 0});
			}
		}
//	}


    charts[canvas_id]?.['chart'].destroy();
	charts[canvas_id]={};
	charts[canvas_id]['chart'] = new Chart(
		document.getElementById(canvas_id),
		{ type:'scatter',
		  plugins: [countryOutlinePlugin],
			data: data, options: {
			animation: false, 
			plugins: {	
						tooltip:{callbacks: {label: function(context) {return context.raw.cs;} }},
						legend: {display: false},             
						title: {display: false, align:'start', text: " "}},
			scales: {
				x: {display:false, title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom' , max:xrng[1], min:xrng[0]},
				y: {display:false, title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left' , max:yrng[1], min: yrng[0]}
				}
			}
		}
	);		
	charts[canvas_id]['band'] = band;
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