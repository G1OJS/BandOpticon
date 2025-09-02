
import {liveConnsData, callsigns_info, analyseData, homeCalls, leaderCall, otherCalls_myCall1, otherCalls_Leader, otherCalls_All} from '../lib/conns-data.js';
import {myCall} from '../lib/store-cfg.js';
import {mhToLatLong} from '../lib/geo.js';

let getMode = () => null;
let mode = null;
let band = null;
let winnerCall = null;
let connsData = null;
let myCall1 = null;
let myCall2 = null;
let RxTx = 0;
let chart = false;
let container = null;

export function init(setcontainer, setband, opts = {}) {
	container = setcontainer;
    myCall1 = myCall.split(",")[0].trim();
  	getMode = opts.getWatchedMode;
	mode = getMode();
	band = setband;
    refresh(); // first display
}

export function refresh(){
	mode = getMode();
	let connsData = (RxTx)? liveConnsData[band][mode]?.Rx : liveConnsData[band][mode]?.Tx;
	RxTx = 1 - RxTx;
	analyseData(connsData);

	let otherpos_myCall1 = Array.from(otherCalls_myCall1).map((e) => (mhToLatLong(callsigns_info[e].sq)));
	let otherpos_Leader = Array.from(otherCalls_Leader).map((e) => (mhToLatLong(callsigns_info[e].sq)));
	let otherpos_All = Array.from(otherCalls_All).map((e) => (mhToLatLong(callsigns_info[e].sq)));

	const data = {
	  datasets: [	{label: myCall1 + ": "+otherpos_myCall1.length+" spots", data: otherpos_myCall1.map(e => ({x:e.lon, y:e.lat})), backgroundColor: 'rgba(255, 99, 132, 1)', pointRadius:4},
					{label: leaderCall + ": "+otherpos_Leader.length+" spots", data: otherpos_Leader.map(e => ({x:e.lon, y:e.lat})), backgroundColor: 'rgba(54, 162, 235, 0.7)', pointRadius:6},
					{label: homeCalls.size +" Home Calls: "+otherpos_All.length+" spots", data: otherpos_All.map(e => ({x:e.lon, y:e.lat})), backgroundColor: 'rgba(200, 162, 235, 0.7)', pointRadius:10}],
	};
	
	if(chart) chart.destroy();
	container.innerHTML = "<h2> Detail for " + band + " " + mode +"</h2><canvas id='map' style='width:100%;max-width:700px'></canvas><br></div>";
	
	chart = new Chart(
	  document.getElementById('map'),
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
	