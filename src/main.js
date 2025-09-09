import {connectToFeed, connectToTest, connectionsMap, callLocations} from './mqtt.js';

import {loadConfig, myCalls} from './config.js';
import Ribbon from './ribbon.js';

let displayMode = null;
let charts={};
let	html ="";
loadConfig();
let myCall = myCalls.split(",")[0].trim();

const ribbon = new Ribbon({
  onModeChange: refreshMainView,
  onConfigChange: refreshMainView,
  onBandsChange: refreshMainView
 });
 
setInterval(() => refreshMainView(), 5000);

const c =   {blue:		'rgba(20, 20, 250, 1)',		red:		'rgba(250, 20, 20, 1)', 
			 lightblue:	'rgba(200, 200, 250, .6)',	lightred:	'rgba(250, 200, 200, .6)'};

const myColours =   {heardMe:	c.blue,			heardbyMe:	c.red, 
					 heardHome:	c.lightblue,	heardbyHome:c.lightred,
					 meRx:		c.blue,			meTx:		c.red,
					 homeRx:	c.lightblue,	homeTx:		c.lightred};

html ="";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  myColours.heardMe + "'></span>Heard "+myCall+"</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  myColours.heardHome + "'></span>Heard any home call</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  myColours.heardbyMe + "'></span>Heard by "+myCall+"</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  myColours.heardbyHome + "'></span>Heard by any home call</div>";
html +="</div>";
let overviewLegendHTML = html;

html ="";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" + myColours.meRx +"'></span>"+myCall+" Rx</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" + myColours.homeRx +"'></span>All home Rx</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" + myColours.meTx +"'></span>"+myCall+" Tx</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" + myColours.homeTx +"'></span>All home Tx</div>";
let detailLegendHTML = html;

connectToFeed();
//connectToTest();
refreshMainView("Overview");


function refreshMainView(newDisplayMode = null, band = null){

	if(newDisplayMode) {
		displayMode = newDisplayMode;
		html ="";
		for (let i =0;i<15;i++){
			html += "<div id = 'bandTile_"+i+"' class = 'bandTile hidden' ><div id = 'bandTileTitle_"+i+"'></div>";
			html += "<canvas id='bandTileCanvas_"+i+"' style='background-image:url(\"./map/map1.png\");' class='hidden' ></canvas>";
			html += "</div>";	
		}
		document.getElementById("bandsGrid").innerHTML = html;
		for (let i =0;i<15;i++){
			document.getElementById("bandTileCanvas_"+i).addEventListener("click", function (e) {refreshMainView("Single",[charts["bandTileCanvas_"+i]['band']])});
		}	
		html = "";
		html += "<div id='bandTile'  class = 'hidden' ><div id = 'bandTileTitle'></div>";
		html += "<canvas  id='bandTileCanvas'  class = 'hidden' '></canvas>";
		html += "</div>";
		document.getElementById("bandPane").innerHTML = html;
		document.getElementById("bandTileCanvas").addEventListener("click", function (e) {refreshMainView("Overview")});
	}
	
	if(displayMode == "Overview"){
		document.getElementById("mainViewRibbon").innerHTML = overviewLegendHTML;
		document.getElementById("mainViewTitle").innerHTML="Bands Overview";
		ribbon.setWatchedBands();
		drawBandTiles();
	} else {
		document.getElementById("mainViewRibbon").innerHTML = detailLegendHTML;
		document.getElementById("mainViewTitle").innerHTML="Band detail";	
		if(band) ribbon.setWatchedBands(band);
		drawSingle();
	}
}

function drawBandTiles(){
	let bands = ribbon.getWatchedBands();
	if(!bands) return;
	
	for (let bandIdx =0;bandIdx<15;bandIdx++){
		let canvas_id = 'bandTileCanvas_'+bandIdx;
		if(charts[canvas_id]?.['chart']){
			charts[canvas_id]['chart'].destroy()
		}
		if(bandIdx in bands){
			document.getElementById('bandTile_'+bandIdx).classList.remove("hidden");			
			document.getElementById(canvas_id).classList.remove("hidden");						
			drawBandTile(canvas_id,document.getElementById('bandTileTitle_'+bandIdx),bands[bandIdx]);
		}
	}
}

function drawBandTile(canvas_id, title_el, band){

	let mode = ribbon.getWatchedMode();
	title_el.innerHTML = "<div class = 'bandTileTitle'>" +band+ "</div>";
	let conns = connectionsMap[band][mode];
	
	let heardbyHome  = {label:'All', data:[], backgroundColor: myColours.heardbyHome, pointRadius:5} ;
	let hearingHome  = {label:'All', data:[], backgroundColor: myColours.heardHome, pointRadius:5} ;
	let heardbyMe    = {label:myCall, data:[], backgroundColor: myColours.heardbyMe, pointRadius:3} ;
	let hearingMe    = {label:myCall, data:[], backgroundColor: myColours.heardMe, pointRadius:3} ;
	
	function check_add(dataToCheck, call){
		if(!dataToCheck[call]) dataToCheck.push({x:callLocations[call].x, y:callLocations[call].y});
	}
	
	for (const hc in conns){
		for (const oc in conns[hc].heard_by) {
			check_add(hearingHome.data, oc);
			if(hc == myCall) check_add(hearingMe.data, oc); 
		}
		for (const oc in conns[hc].heard) {
			check_add(heardbyHome.data, oc);
			if(hc == myCall) check_add(heardbyMe.data, oc); 
		}		
	}
		
	const data = { datasets: [	heardbyMe, hearingMe, heardbyHome, hearingHome ]};
	
	if(charts[canvas_id]?.['chart']) {charts[canvas_id]['chart'].destroy()}
	charts[canvas_id]={};
	charts[canvas_id]['chart'] = new Chart(
		document.getElementById(canvas_id),
		{type: 'scatter',data: data, options: {
			animation: false, 
			plugins: {
				tooltip:{callbacks: {label: function(context) {let label = context.dataset.label || ''; return label;} }},
				legend: {display:false},             
						title: {display: false, align:'start', text: " "+band}},
			scales: {
				x: {display:false, title: {display:false, text: 'Longitude'}, type: 'linear',position: 'bottom' , max:180, min:-180},
				y: {display:false, title: {display:false, text: 'Lattitude'}, type: 'linear',position: 'left', max:90, min: -90}
				}
			}
		}
	);	
	
	charts[canvas_id]['band']=band;
}

function drawSingle(){
	let band = ribbon.getWatchedBands()[0];
	let mode = ribbon.getWatchedMode();
	let conns = connectionsMap[band][mode];
	
	let canvas_id = "bandTileCanvas";
	document.getElementById('bandTile').classList.remove("hidden");
	document.getElementById(canvas_id).classList.remove("hidden");
	document.getElementById("mainViewTitle").innerHTML="Band detail for "+ band + " " + mode;	
	
	let tx_lines_me = [];
	let rx_lines_me = [];
	let tx_lines_home = [];
	let rx_lines_home = [];
	
	for (const hc in conns){
		for (const oc in conns[hc].heard_by) {
			if(hc == myCall){
				tx_lines_me.push({x:callLocations[hc].x, y:callLocations[hc].y})
				tx_lines_me.push({x:callLocations[oc].x, y:callLocations[oc].y})				
			} else {
				tx_lines_home.push({x:callLocations[hc].x, y:callLocations[hc].y})
				tx_lines_home.push({x:callLocations[oc].x, y:callLocations[oc].y})
			}
		}
		for (const oc in conns[hc].heard) {
			if(hc == myCall){
				rx_lines_me.push({x:callLocations[hc].x, y:callLocations[hc].y})
				rx_lines_me.push({x:callLocations[oc].x, y:callLocations[oc].y})				
			} else {
				rx_lines_home.push({x:callLocations[hc].x, y:callLocations[hc].y})
				rx_lines_home.push({x:callLocations[oc].x, y:callLocations[oc].y})
			}
		}		
	}
	
	let data = { datasets: [
						{type: 'scatter', label: 'Tx', data: tx_lines_me, showLine: true, pointRadius:0, borderColor: myColours.meTx},
						{type: 'scatter', label: 'Rx', data: rx_lines_me, showLine: true, pointRadius:0, borderColor: myColours.meRx },
						{type: 'scatter', label: 'Tx', data: tx_lines_home, showLine: true, pointRadius:0, borderColor: myColours.homeTx},
						{type: 'scatter', label: 'Rx', data: rx_lines_home, showLine: true, pointRadius:0, borderColor: myColours.homeRx}
					]
				};

	if(charts[canvas_id]?.['chart']){charts[canvas_id]['chart'].destroy()}
	charts[canvas_id]={};
	charts[canvas_id]['chart'] = new Chart(
		document.getElementById(canvas_id),
		{data: data, options: {
			animation: false, 
			plugins: {	
						tooltip:{callbacks: {label: function(context) {let label = context.dataset.label || ''; return label;} }},
						legend: {display: false},             
						title: {display: false, align:'start', text: " "}},
			scales: {
				x: {display:true, title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom'},
				y: {display:true, title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left'}
				}
			}
		}
	);	

}