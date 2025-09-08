import {connectToFeed, connectToTest} from './mqtt.js';
import {connsData, callsData, purgeLiveConnections} from './conns-data.js';
import {loadConfig, myCalls} from './store-cfg.js';
import Ribbon from './ribbon.js';

let getMode = () => null;
let getBands = () => null;
let mode = null;
let bands = null;
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
 
setInterval(() => purgeLiveConnections(), 5000);
setInterval(() => ribbon.writeModeButtons(), 5000);
setInterval(() => refreshMainView(), 5000);

const coloursList = ["#25CCF7","#FD7272","#54a0ff","#00d2d3","#1abc9c","#2ecc71","#3498db","#9b59b6","#34495e","#16a085","#27ae60","#2980b9","#8e44ad","#2c3e50",
					 "#f1c40f","#e67e22","#e74c3c","#ecf0f1","#95a5a6","#f39c12","#d35400","#c0392b","#bdc3c7","#7f8c8d","#55efc4","#81ecec","#74b9ff","#a29bfe","#dfe6e9",
					 "#00b894","#00cec9","#0984e3","#6c5ce7","#ffeaa7","#fab1a0","#ff7675","#fd79a8","#fdcb6e","#e17055","#d63031","#feca57","#5f27cd","#54a0ff","#01a3a4"]
const coloursForAggregates =   {myCall_tx:'rgba(255, 20, 20, 1)', leader_tx:'rgba(255, 99, 132, 0.4)', all_tx:'rgba(255, 99, 132, 0.1)',
								myCall_rx:'rgba(20, 20, 200, 1)', leader_rx:'rgba(54, 162, 200, 0.4)',all_rx:'rgba(54, 162, 200, 0.1)'};

html ="";
html +="<div class = 'legendItem'><b>Receiver:</b> </div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.myCall_rx + "'></span>"+myCall+"</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.leader_rx + "'></span>Band leader</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.all_rx + "'></span>All home  </div>";
html +="<div class = 'legendItem' style='width:50px;'>&nbsp </div>";
html +="<div class = 'legendItem'><b>Transmitter:</b> </div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.myCall_tx + "'></span>"+myCall+"</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.leader_tx + "'></span>Band leader</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:" +  coloursForAggregates.all_tx + "'></span>All home</div>";
html +="</div>";
let overviewLegendHTML = html;


html ="";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:rgba(255,0,0,0.5)'></span>Transmitters</div>";
html +="<div class = 'legendItem'><span class = 'legendMarker' style='background:rgba(0,0,255,0.5)'></span>Receivers</div>";
let detailLegendHTML = html;


connectToFeed();
//connectToTest();
refreshMainView("Overview");


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
		bands = Array.from(ribbon.getActiveBands()).sort((a, b) => wavelength(b) - wavelength(a));
		drawBandTiles();
	} else {
		document.getElementById("mainViewRibbon").innerHTML = detailLegendHTML;
		document.getElementById("mainViewTitle").innerHTML="Band detail";	
		if(newBands) bands = newBands;
		drawSingle();
	}
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

function check_add(call, addTo){
	if(!addTo[call]) {addTo.push({x:callsData[call].x, y:callsData[call].y})}
}

function drawBandTile(canvas_id, title_el, band){

	title_el.innerHTML = "<div class = 'bandTileTitle'>" +band+ "</div>";
	let conns = connsData[band][mode];
	
	let heardbyHome  = {label:'All', data:[], backgroundColor: coloursForAggregates.all_rx, pointRadius:6} ;
	let hearingHome  = {label:'All', data:[], backgroundColor: coloursForAggregates.all_tx, pointRadius:6} ;
	let heardbyMe  = {label:myCall, data:[], backgroundColor: coloursForAggregates.myCall_rx, pointRadius:3} ;
	let hearingMe  = {label:myCall, data:[], backgroundColor: coloursForAggregates.myCall_tx, pointRadius:3} ;

	for (const sc in conns){
		for (const rc in conns[sc]) {
			if(callsData[sc].inHome) check_add(rc, hearingHome.data);
			if(sc == myCall) check_add(rc, hearingMe.data); 
			if(callsData[rc].inHome) check_add(sc, heardbyHome.data);
			if(rc == myCall) check_add(sc, hearingMe.data); 
		}
	}

	const data = { datasets: [	hearingHome, heardbyHome, hearingMe, heardbyMe ]};
	
	if(charts[canvas_id]?.['chart']) {charts[canvas_id]['chart'].destroy()}
	
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
			plugins: {
				tooltip:{callbacks: {label: function(context) {let label = context.dataset.label || ''; return label;} }},
				legend: {display:false},             
						title: {display: false, align:'start', text: " "+band}},
			scales: scales
			}
		}
	);	
	
	charts[canvas_id]['band']=band;

}

function hex2rgba(hex){
      let red = parseInt(hex.substring(1, 3), 16);
      let green = parseInt(hex.substring(3, 5), 16);
      let blue = parseInt(hex.substring(5, 7), 16);	
	  let opacity = 0.5;
	  return ` rgba(${red}, ${green}, ${blue}, ${opacity})`
}

function drawSingle(){

	let band = bands[0];
	let canvas_id = "bandTileCanvas";
	document.getElementById('bandTile').classList.remove("hidden");
	document.getElementById(canvas_id).classList.remove("hidden");
	
	let rx_conns_data = liveConnsData[band]?.[mode]?.['Rx'];
	let tx_conns_data = liveConnsData[band]?.[mode]?.['Tx'];
	let rx_aggs =getAggregatedCallLists(rx_conns_data);
	let tx_aggs =getAggregatedCallLists(tx_conns_data);
	
	let callsignColours = {};
	let colIdx = 0;
	for (const hc in rx_conns_data){
		if(!(hc in callsignColours)) {colIdx += 1}
		callsignColours[hc] = hex2rgba(coloursList[colIdx]);
	}
	for (const hc in tx_conns_data){
		if(!(hc in callsignColours)) {colIdx += 1}
		callsignColours[hc] = hex2rgba(coloursList[colIdx]);
	}
	
	let datasets = [];
	for (const hc in rx_conns_data){ 
		let ocLocs = [];
		let hcLoc = call_locs[hc];
		let hcLines = []
		let oCalls =[];
		for (const oc in rx_conns_data[hc]){
			hcLines.push(hcLoc)
			hcLines.push(call_locs[oc])
			ocLocs.push(call_locs[oc])
			oCalls.push("TX:"+oc);
		}
		datasets.push({type: 'scatter', label: '', data: hcLines, showLine: true, pointRadius:0,  borderColor: callsignColours[hc] });
        datasets.push({type: 'scatter', label: 'tx', data: ocLocs, pointRadius:4, backgroundColor:'rgba(255,0,0,0.6)'});
        datasets.push({type: 'scatter', label: hc+'(rx)', data: [hcLoc], pointRadius:7, backgroundColor:'rgba(0,0,355,0.3)'});
	}
	for (const hc in tx_conns_data){ 
		let ocLocs = [];
		let hcLoc = call_locs[hc];
		let hcLines = [];
		let oCalls =[];
		for (const oc in tx_conns_data[hc]){
			hcLines.push(hcLoc)
			hcLines.push(call_locs[oc])
			ocLocs.push(call_locs[oc])
			oCalls.push("RX:"+oc);
		}
		datasets.push({type: 'scatter', label: '', data: hcLines, showLine: true, pointRadius:0, borderColor: callsignColours[hc] });
        datasets.push({type: 'scatter', label: hc+'(tx)', data: [hcLoc], pointRadius:4, backgroundColor:'rgba(255,0,0,0.6)'});
        datasets.push({type: 'scatter', label: 'rx', data: ocLocs, pointRadius:7, backgroundColor:'rgba(0,0,355,0.3)'});
	}

	let data = {datasets};
	
	document.getElementById('bandTileTitle').innerHTML = prettyInfo(band, rx_aggs, tx_aggs)

	let scales ={};
	scales = {
		x: {display:true, title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom'},
		y: {display:true, title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left'}
	};
	
	if(charts[canvas_id]?.['chart']){
		charts[canvas_id]['chart'].destroy()
	}

	charts[canvas_id]={};
	charts[canvas_id]['chart'] = new Chart(
		document.getElementById(canvas_id),
		{data: data, options: {
			animation: false, 
			plugins: {	
						tooltip:{callbacks: {label: function(context) {let label = context.dataset.label || ''; return label;} }},
						legend: {display: false},             
						title: {display: false, align:'start', text: " "}},
			scales: scales
			}
		}
	);	

}