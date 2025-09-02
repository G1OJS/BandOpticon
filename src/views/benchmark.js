
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
let container = null;

export function init(setcontainer, setband, opts = {}) {
	container = setcontainer;
  	getMode = opts.getWatchedMode;
	band = setband;
    refresh(); // first display
}

export function refresh(){
    myCall1 = myCall.split(",")[0].trim();
	mode = getMode();
//	console.log("benchmark: refresh with mode = "+ mode);
	let html = "<h2> Detail for " + band + " " + mode +"</h2>";
	html += "<div style = 'display:grid; grid-template-columns:1fr 1fr;'><div><h4>Receive</h4></div><div><h4>Transmit</h4></div><div><canvas id='map1'></canvas></div><div><canvas id='map2'></canvas></div></div>";
	container.innerHTML=html;
	
	doChart('map1', liveConnsData[band][mode]?.Rx);
	doChart('map2', liveConnsData[band][mode]?.Tx);
}
		
function doChart(canvas, connsData){
	mode = getMode();
	analyseData(connsData);
	let otherpos_myCall1 = Array.from(otherCalls_myCall1).map((e) => (mhToLatLong(callsigns_info[e].sq)));
	let otherpos_Leader = Array.from(otherCalls_Leader).map((e) => (mhToLatLong(callsigns_info[e].sq)));
	let otherpos_All = Array.from(otherCalls_All).map((e) => (mhToLatLong(callsigns_info[e].sq)));
	const data = {
	  datasets: [	{label: myCall1 + ": "+otherpos_myCall1.length+" spots", data: otherpos_myCall1.map(e => ({x:e.lon, y:e.lat})), backgroundColor: 'rgba(255, 99, 132, 1)', pointRadius:4},
					{label: leaderCall + ": "+otherpos_Leader.length+" spots", data: otherpos_Leader.map(e => ({x:e.lon, y:e.lat})), backgroundColor: 'rgba(54, 162, 235, 0.7)', pointRadius:6},
					{label: homeCalls.size +" Home Calls: "+otherpos_All.length+" spots", data: otherpos_All.map(e => ({x:e.lon, y:e.lat})), backgroundColor: 'rgba(200, 162, 235, 0.7)', pointRadius:10}],
	};
	new Chart(
	  document.getElementById(canvas),
		{type: 'scatter',data: data, options: {
			    animation: false, 
				plugins: {legend: {position:'top', labels:{boxWidth:10, padding:10}}},
				    scales: {
						x: {title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom', max:180, min:-180},
						y: {title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left', max:80, min:-80}
					}
			}
		}
	);	
}