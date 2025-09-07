import {connectToFeed} from './mqtt.js';
import {liveConnsData, call_locs, purgeLiveConnections} from './conns-data.js';
import {loadConfig, myCall} from './store-cfg.js';
import {mhToLatLong} from './geo.js';
import Ribbon from './ribbon.js';

let getMode = () => null;
let getBands = () => null;
let mode = null;
let bands = null;
let displayMode = "Overview";

let myCall1 = null;
let myCall2 = null;
let charts={};
let	html ="";

const ribbon = new Ribbon({
  onModeChange: refreshMainView,
  onConfigChange: refreshMainView,
  onBandsChange: refreshMainView
 });
 
setInterval(() => purgeLiveConnections(), 5000);
setInterval(() => ribbon.writeModeButtons(), 5000);
setInterval(() => refreshMainView(), 5000);

loadConfig();
myCall1 = myCall.split(",")[0].trim();


const coloursList = ["#25CCF7","#FD7272","#54a0ff","#00d2d3","#1abc9c","#2ecc71","#3498db","#9b59b6","#34495e","#16a085","#27ae60","#2980b9","#8e44ad","#2c3e50",
					 "#f1c40f","#e67e22","#e74c3c","#ecf0f1","#95a5a6","#f39c12","#d35400","#c0392b","#bdc3c7","#7f8c8d","#55efc4","#81ecec","#74b9ff","#a29bfe","#dfe6e9",
					 "#00b894","#00cec9","#0984e3","#6c5ce7","#ffeaa7","#fab1a0","#ff7675","#fd79a8","#fdcb6e","#e17055","#d63031","#feca57","#5f27cd","#54a0ff","#01a3a4"]
const coloursForAggregates =   {myCall_tx:'rgba(255, 20, 20, 1)', leader_tx:'rgba(255, 99, 132, 0.4)', all_tx:'rgba(255, 99, 132, 0.1)',
								myCall_rx:'rgba(20, 20, 200, 1)', leader_rx:'rgba(54, 162, 200, 0.4)',all_rx:'rgba(54, 162, 200, 0.1)'};

html ="";
html +="<div class = 'legendItem'><b>Receive:</b> </div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.myCall_rx + "'></span>"+myCall1+"</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.leader_rx + "'></span>Band leader</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.all_rx + "'></span>All home  </div>";
html +="<div class = 'legendItem' style='width:50px;'>&nbsp </div>";
html +="<div class = 'legendItem'><b>Transmit:</b> </div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.myCall_tx + "'></span>"+myCall1+"</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.leader_tx + "'></span>Band leader</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.all_tx + "'></span>All home</div>";
html +="</div>";
let overviewLegendHTML = html;


html ="";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:'rgba(255,0,0,0.5)'></span>Transmitters</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:'rgba(0,0,255,0.5)'></span>Receivers</div>";
let detailLegendHTML = html;

write_mainViewContent();
connectToFeed();

function write_mainViewContent(){

	html ="";
	for (let i =0;i<15;i++){
		html += "<div id = 'bandTile_"+i+"' class = 'hidden' ><div id = 'bandTileTitle_"+i+"'></div>";
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
	
	refreshMainView();
}

function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}

function refreshMainView(newDisplayMode = null, newBands = null){
	ribbon.registerActiveBandsAndModes();
	mode = ribbon.getWatchedMode();
	if(newDisplayMode) {
		displayMode = newDisplayMode;
		write_mainViewContent(displayMode);
	}
	if(displayMode == "Overview"){
		document.getElementById("mainViewRibbon").innerHTML = overviewLegendHTML;
		document.getElementById("mainViewTitle").innerHTML="Bands Overview";
		bands = Array.from(ribbon.getActiveBands()).sort((a, b) => wavelength(b) - wavelength(a));
		drawBandTiles();
	} else {
		document.getElementById("mainViewRibbon").innerHTML = detailLegendHTML;
		document.getElementById("mainViewTitle").innerHTML="Band detail";	
		if(newBands) bands = newBands;
		drawSingle();
	}
}

function getCallsignLocation(data){
	const ocLocs = new Set();
	for (const oc in data) {
		let ll = call_locs[oc];
		ocLocs.add(ll); 
	}	
	return ocLocs;
}

function getAggregatedData(data){
	// data is subset of connectivity map e.g. data = connsData[band][mode].Tx
    let myCall1 = myCall.split(",")[0].trim();
	let homeCalls = new Set();
	let ocLocs_myCall1 = new Set();
	let ocLocs_Leader = new Set();
	let ocLocs_All = new Set();
	let leaderCall = '';
	
	for (const hc in data) {
		homeCalls.add(hc);
		let ocLocs = getCallsignLocation(data[hc]);
        for (const ocLoc in ocLocs) {
			ocLocs_All.add(ocLoc); 
		}
        if (ocLocs.size > ocLocs_Leader.size) {
			ocLocs_Leader = ocLocs;
            leaderCall = hc;
        }
		if(hc == myCall1){
			ocLocs_myCall1 = ocLocs;
		}
    }
	let dataset = {
		homeCalls:Array.from(homeCalls),
		myCall1:Array.from(ocLocs_myCall1),
		Leader:Array.from(ocLocs_Leader),
		All:Array.from(ocLocs_All),
		leaderCall:leaderCall
	}
	return dataset;
}

function drawBandTiles(){
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

	let rx_aggs =getAggregatedData(liveConnsData[band]?.[mode]?.['Rx']);
	let tx_aggs =getAggregatedData(liveConnsData[band]?.[mode]?.['Tx']);
	let bandInfo = "<b>"+band + "</b> " + rx_aggs.homeCalls.length + " Rx, " + tx_aggs.homeCalls.length + " Tx";
	title_el.innerHTML = "<div class = 'bandTileTitle'>" +bandInfo+ "</div>";
	
	const data = {
	  datasets: [	
				{	label:myCall1, 				data: rx_aggs.myCall1, 	backgroundColor: coloursForAggregates.myCall_rx, 	pointRadius:3	},
				{	label:myCall1, 				data: tx_aggs.myCall1, 	backgroundColor: coloursForAggregates.myCall_tx, 	pointRadius:3	},
				{	label:rx_aggs.leaderCall, 	data: rx_aggs.Leader, 	backgroundColor: coloursForAggregates.leader_rx, 	pointRadius:5	},
				{	label:tx_aggs.leaderCall, 	data: tx_aggs.Leader,	backgroundColor: coloursForAggregates.leader_tx, 	pointRadius:5	},
				{	label:'All', 				data: rx_aggs.All, 		backgroundColor: coloursForAggregates.leader_rx, 	pointRadius:9	},
				{	label:'All', 				data: tx_aggs.All, 		backgroundColor: coloursForAggregates.all_tx, 	pointRadius:9	}
				],
	};
	
	if(charts[canvas_id]?.['chart']){
		charts[canvas_id]['chart'].destroy()
	}
	
	let scales ={};
	scales = {
		x: {display:false, title: {display:false, text: 'Longitude'}, type: 'linear',position: 'bottom' , max:180, min:-180},
		y: {display:false, title: {display:false, text: 'Lattitude'}, type: 'linear',position: 'left', max:90, min: -90}
	};

	charts[canvas_id]={};
	charts[canvas_id]['chart'] = new Chart(
		document.getElementById(canvas_id),
		{type: 'scatter',data: data, options: {
			animation: false, 
			plugins: {	legend: {display:false},             
						title: {display: false, align:'start', text: " "+bandInfo}},
			scales: scales
			}
		}
	);	
	
	charts[canvas_id]['band']=band;

}

function drawSingle(){

	let band = bands[0];
	let canvas_id = "bandTileCanvas";
	document.getElementById('bandTile').classList.remove("hidden");
	document.getElementById(canvas_id).classList.remove("hidden");
	
	let rx_conns_data = liveConnsData[band]?.[mode]?.['Rx'];
	let tx_conns_data = liveConnsData[band]?.[mode]?.['Tx'];
	let rx_aggs =getAggregatedData(rx_conns_data);
	let tx_aggs =getAggregatedData(tx_conns_data);
	
	let callsignColours = {};
	let colIdx = 0;
	for (const hc in rx_conns_data){
		if(!(hc in callsignColours)) {colIdx += 1}
		callsignColours[hc] = coloursList[colIdx];
	}
	for (const hc in tx_conns_data){
		if(!(hc in callsignColours)) {colIdx += 1}
		callsignColours[hc] = coloursList[colIdx];
	}
	
	let datasets = [];
	for (const hc in rx_conns_data){ 
		let ocLocs = Array.from(getCallsignLocation(rx_conns_data[hc]));
		let hcLoc = call_locs[hc];
		let hcLines = []
		for (const l of ocLocs){
			hcLines.push(hcLoc)
			hcLines.push(l)
		}
		datasets.push({type: 'scatter', label: 'Line', data: hcLines, showLine: true, pointRadius:0, backgroundColor: callsignColours[hc], borderColor: callsignColours[hc] });
        datasets.push({type: 'scatter', label: 'Tx', data: ocLocs, pointRadius:4, backgroundColor:'rgba(255,0,0,0.5)'});
        datasets.push({type: 'scatter', label: 'Rx', data: [hcLoc], pointRadius:7, backgroundColor:'rgba(0,0,355,0.5)'});
	}
	for (const hc in tx_conns_data){ 
		let ocLocs = Array.from(getCallsignLocation(tx_conns_data[hc]));
		let hcLoc = call_locs[hc];
		let hcLines = []
		for (const l of ocLocs){
			hcLines.push(hcLoc)
			hcLines.push(l)
		}
		datasets.push({type: 'scatter', label: 'Line', data: hcLines, showLine: true, pointRadius:0, backgroundColor: callsignColours[hc], borderColor: callsignColours[hc] });
        datasets.push({type: 'scatter', label: 'Tx', data: [hcLoc], pointRadius:4, backgroundColor:'rgba(255,0,0,0.5)'});
        datasets.push({type: 'scatter', label: 'Rx', data: ocLocs, pointRadius:7, backgroundColor:'rgba(0,0,355,0.5)'});
	}

	let data = {datasets};
	
	document.getElementById('bandTileTitle').innerHTML = band + " " + rx_aggs.homeCalls.length + " Rx, leader: " + rx_aggs.leaderCall +"; " + tx_aggs.homeCalls.length + " Tx, leader: " + tx_aggs.leaderCall;	

	let scales ={};
	scales = {
		x: {display:true, title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom'},
		y: {display:true, title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left'}
	};
	
	if(charts[canvas_id]?.['chart']){
		charts[canvas_id]['chart'].destroy()
	}
	console.log(canvas_id);

	charts[canvas_id]={};
	charts[canvas_id]['chart'] = new Chart(
		document.getElementById(canvas_id),
		{data: data, options: {
			animation: false, 
			plugins: {	legend: {display: false},             
						title: {display: false, align:'start', text: " "}},
			scales: scales
			}
		}
	);	

}