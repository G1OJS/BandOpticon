import {connectToFeed} from './mqtt.js';
import {liveConnsData, call_locs, purgeLiveConnections} from './conns-data.js';
import {loadConfig, myCall} from './store-cfg.js';
import {mhToLatLong} from './geo.js';
import Ribbon from './ribbon.js';


const colors = {myCall_tx:'rgba(255, 20, 20, 1)', leader_tx:'rgba(255, 99, 132, 0.4)', all_tx:'rgba(255, 99, 132, 0.1)',
				myCall_rx:'rgba(20, 20, 200, 1)', leader_rx:'rgba(54, 162, 200, 0.4)',all_rx:'rgba(54, 162, 200, 0.1)'};
				
//'4000m','2200m','600m',
//'160m','80m','60m','40m','30m','20m','17m','15m','12m','11m','10m',
//'8m','6m','5m','4m','2m','1.25m',
//'70cm','33cm','23cm',
//'2.4Ghz','3.4Ghz','5.8Ghz','10Ghz','24Ghz','47Ghz','76Ghz'

const ribbon = new Ribbon({
  onModeChange: refreshAll,
  onConfigChange: refreshAll,
  onBandsChange: refreshAll
 });

let getMode = () => null;
let getBands = () => null;
let mode = null;
let bands = null;

let myCall1 = null;
let myCall2 = null;
let charts={};

setInterval(() => purgeLiveConnections(), 5000);
setInterval(() => ribbon.writeModeButtons(), 5000);
setInterval(() => refreshBands(), 1000);
setInterval(() => refreshAll(), 5000);

loadConfig();
myCall1 = myCall.split(",")[0].trim();
write_mainView();
connectToFeed();

function write_mainView(){
	let html = "<h3>Bands Overview</h3>";

	html +="<div class = 'mainViewLegend'>";
	html +="<div class = 'mainViewLegendItem'><b>Receive:</b> </div>";
	html +="<div class = 'mainViewLegendItem'><span class = 'legendMarker' style='background:" +  colors.myCall_rx + "'></span>"+myCall1+"</div>";
	html +="<div class = 'mainViewLegendItem'><span class = 'legendMarker' style='background:" +  colors.leader_rx + "'></span>Band leader</div>";
	html +="<div class = 'mainViewLegendItem'><span class = 'legendMarker' style='background:" +  colors.all_rx + "'></span>All home  </div>";
	html +="<div class = 'mainViewLegendItem' style='width:50px;'>&nbsp </div>";
	html +="<div class = 'mainViewLegendItem'><b>Transmit:</b> </div>";
	html +="<div class = 'mainViewLegendItem'><span class = 'legendMarker' style='background:" +  colors.myCall_tx + "'></span>"+myCall1+"</div>";
	html +="<div class = 'mainViewLegendItem'><span class = 'legendMarker' style='background:" +  colors.leader_tx + "'></span>Band leader</div>";
	html +="<div class = 'mainViewLegendItem'><span class = 'legendMarker' style='background:" +  colors.all_tx + "'></span>All home</div>";
	html +="</div>";

	html +="<div id='canvasSpace'>";
 	for (let i =0;i<15;i++){
		html += "<div class = 'canvasHolder hidden' id = 'div_"+i+"'><div id = 'title_"+i+"'></div>";
		html += "<canvas class='hidden' id='canvas_"+i+"'></canvas>";
		html += "</div>";	
	}	
	html +="</div>";
	
	document.getElementById("mainView").innerHTML = html;
}

function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}

function refreshAll(){
	ribbon.registerActiveBandsAndModes();
	mode = ribbon.getWatchedMode();
	bands = Array.from(ribbon.getActiveBands()).sort((a, b) => wavelength(b) - wavelength(a));
	refreshBands();
}

function analyseData(data){
	// data is subset of connectivity map e.g. data = connsData[band][mode].Tx
    let myCall1 = myCall.split(",")[0].trim();
	let homeCalls = new Set();
	let ocs_myCall1 = new Set();
	let ocs_Leader = new Set();
	let ocs_All = new Set();
	let leaderCall = '';
	
	for (const hc in data) {
		homeCalls.add(hc);
        const ocs = new Set();
        for (const oc in data[hc]) {
			let ll = call_locs[oc];
			ocs.add(ll); ocs_All.add(ll); 
		}
        if (ocs.size > ocs_Leader.size) {
			ocs_Leader = ocs;
            leaderCall = hc;
        }
		if(hc == myCall1){
			ocs_myCall1 = ocs;
		}
    }
	let dataset = {
	homeCalls:Array.from(homeCalls),
	myCall1:Array.from(ocs_myCall1),
	Leader:Array.from(ocs_Leader),
	All:Array.from(ocs_All),
	leaderCall:leaderCall
	}
	return dataset;
}

function refreshBands(){
	if(!bands) return;
	for (let bandIdx =0;bandIdx<15;bandIdx++){
		let div = 'div_'+bandIdx;
		let canvas = 'canvas_'+bandIdx;
		if(charts[canvas]){
			charts[canvas].destroy()
		}
		if(bandIdx in bands){
			document.getElementById('div_'+bandIdx).classList.remove("hidden");			
			let canvas = 'canvas_'+bandIdx;
			let canvas_el = document.getElementById(canvas)
			canvas_el.classList.remove("hidden");						
			let band = bands[bandIdx];
			let title_el = document.getElementById('title_'+bandIdx);
			refreshBand(canvas,title_el,band);
		}
	}
}

function refreshBand(canvas, title_el, band){

	let rx_data =analyseData(liveConnsData[band]?.[mode]?.['Rx']);
	let tx_data =analyseData(liveConnsData[band]?.[mode]?.['Tx']);
	
//	let bandInfo = band + " " + rx_data.homeCalls.length + " Rx, leader: " + rx_data.leaderCall +"; " + tx_data.homeCalls.length + " Tx, leader: " + tx_data.leaderCall;
	let bandInfo = "<b>"+band + "</b> " + rx_data.homeCalls.length + " Rx, " + tx_data.homeCalls.length + " Tx";
	
	title_el.innerHTML = "<div class = 'bandTileTitle'>" +bandInfo+ "</div>";
	
	const data = {
	  datasets: [	
				{	label:myCall1, 				data: rx_data.myCall1, 	backgroundColor: colors.myCall_rx, 	pointRadius:3	},
				{	label:myCall1, 				data: tx_data.myCall1, 	backgroundColor: colors.myCall_tx, 	pointRadius:3	},
				{	label:rx_data.leaderCall, 	data: rx_data.Leader, 	backgroundColor: colors.leader_rx, 	pointRadius:5	},
				{	label:tx_data.leaderCall, 	data: tx_data.Leader,	backgroundColor: colors.leader_tx, 	pointRadius:5	},
				{	label:'All', 				data: rx_data.All, 		backgroundColor: colors.leader_rx, 	pointRadius:9	},
				{	label:'All', 				data: tx_data.All, 		backgroundColor: colors.all_tx, 	pointRadius:9	}
				],
	};
	
	if(charts[canvas]){
		charts[canvas].destroy()
	}
	
	
	
	charts[canvas] = new Chart(
			document.getElementById(canvas),
			{type: 'scatter',data: data, options: {
				animation: false, 
				plugins: {	legend: {display:false},             
							title: {display: false, align:'start', text: " "+bandInfo}},
				scales: {
					x: {display:false, title: {display:false, text: 'Longitude'}, type: 'linear',position: 'bottom' , max:180, min:-180},
					y: {display:false, title: {display:false, text: 'Lattitude'}, type: 'linear',position: 'left', max:90, min: -90}
				}
			}
		}
	);	

}