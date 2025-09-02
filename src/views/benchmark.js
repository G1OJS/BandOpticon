
import {liveConnsData, callsigns_info, getBandStats} from '../lib/conns-data.js';
import {myCall} from '../lib/store-cfg.js';
import {mhToLatLong} from '../lib/geo.js';

let DOMcontainer = null;
let getMode = () => null;
let mode = null;
let band = null;
let winnerCall = null;
let connsData = null;
let myCall1 = null;
let myCall2 = null;

export function init(container, setband, opts = {}) {
    myCall1 = myCall.split(",")[0].trim();
    myCall2 = myCall.split(",")[1]?.trim();
    DOMcontainer = container;
  	getMode = opts.getWatchedMode;
	winnerCall = opts.winnerCall;
	mode = getMode();
	band = setband;
    refresh(); // first display
}

export function refresh(){
	mode = getMode();
	let rx_data = liveConnsData[band][mode]?.Rx;
	let tx_data = liveConnsData[band][mode]?.Tx;

	let HTML = ""
	HTML +=  '<h2> Detail for ' + band + ' ' + mode +'</h2>';
	HTML += "<p class = 'text-sm'>";
	HTML += "This view is still being developed.";
	HTML += "</p>";

	let rx_leaderCall = getBandStats(rx_data).leaderCall;
	HTML += "<div class = 'hidden'><h3>" + myCall1 + " receive vs home leader (" + rx_leaderCall + ") and all home calls</h3><canvas id='meVsCombo_map_rx' style='width:100%;max-width:700px'></canvas><br></div>";

	let tx_leaderCall = getBandStats(tx_data).leaderCall;
	HTML += "<div class = 'hidden'><h3>" + myCall1 + " transmit vs home leader (" + tx_leaderCall + ") and all home calls</h3><canvas id='meVsCombo_map_tx' style='width:100%;max-width:700px'></canvas><br></div>";

	DOMcontainer.innerHTML = HTML;

	geo_graph('meVsCombo_map_rx', rx_data, callsigns_info, myCall1, rx_leaderCall, 'ALL_HOME');	
	geo_graph('meVsCombo_map_tx', tx_data, callsigns_info, myCall1, tx_leaderCall, 'ALL_HOME');	

}

function geo_graph(canvas, connsData, callsigns_info, callA, callB, callC){
	
	if(!connsData){return}
	
	document.getElementById(canvas).parentElement.classList.remove('hidden');
	
	let nhc=0;
	for (const hc in connsData) {
		nhc +=1;
	}
	
	let llA = get_otherCalls_LatLon(connsData, callsigns_info, callA);
	let llB = get_otherCalls_LatLon(connsData, callsigns_info, callB);
	let llC = get_otherCalls_LatLon(connsData, callsigns_info, callC);
	let colA = 'rgba(255, 99, 132, 1)';
	let colB = 'rgba(54, 162, 235, 0.7)';
	let colC = 'rgba(200, 162, 235, 0.7)';
	
	const data = {
	  datasets: [	{label: callA + ":"+llA.length, data: llA.map(e => ({x:e.lon, y:e.lat})), backgroundColor: colA, pointRadius:4},
					{label: callB + ":"+llB.length, data: llB.map(e => ({x:e.lon, y:e.lat})), backgroundColor: colB, pointRadius:6},
					{label: "All Home Calls  ("+nhc+"):"+llC.length, data: llC.map(e => ({x:e.lon, y:e.lat})), backgroundColor: colC, pointRadius:10}],
	};
	
	new Chart(
	  document.getElementById(canvas),
		{type: 'scatter',data: data, options: {
			    animation: false, 
				    scales: {
						x: {title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom'},
						y: {title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left'}
					}
			}
		}
	);
	
}
	
function get_otherCalls_LatLon(connsData, callsigns_info, call){
	let ll=[];
	if(connsData[call]){
		for (const oc in connsData[call]) {
			let sq = callsigns_info[oc]?.sq;
			ll.push(mhToLatLong(sq));
		}
	}
	return ll;
}