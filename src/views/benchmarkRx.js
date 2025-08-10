
import * as CONNSDATA from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';


var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
let registerActiveModes = () => {};  // fallback to no-op

var DOMcontainer = null;
let getMode = () => null;
let mode = null;

export function init(container, opts = {}) {
  console.log("Connectivity for ", mode);

  DOMcontainer = container;
  if (opts.getWatchedMode) {
    getMode = opts.getWatchedMode;
	mode = getMode();
  }
  if (opts.registerActiveModes) {
    registerActiveModes = opts.registerActiveModes;
  }
  refresh();
}

export function refresh(){
	// Update activeModes for all modes found on this band ONLY
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall;
	if(!bandModeData){return}

	for (const band in bandModeData){
		for (const md in bandModeData[band]) {
			activeModes.add(md);
		}
	}
	registerActiveModes(activeModes);	
	mode = getMode();
	console.log("Rx Benchmarking for ", mode);
	let HTML = ""
	HTML +=  '<h2>Rx Benchmarking for ' + mode +'</h2>';
	HTML += "<div class = 'text-sm'>";
	HTML += "This is a new view (still being developed) showing the latest report from each of 'My Callsigns' for each transmitting callsign heard. "
	HTML += "Note that pskreporter only re-issues a report for a spot if 20 minutes have elapesed from the previous spot. "
	HTML += "The view allows comparison of Rx performance with other callsigns, or between multiple receive configuratons providing seperate reports to pskreporter."
	HTML += "</div><br>";
	HTML += "<canvas id='graph1' style='width:100%;max-width:700px'></canvas>"
//	HTML += html_for_benchmarking(mode);
	DOMcontainer.innerHTML = HTML;
	
	graph1(mode);

}


function graph1(mode){
	
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall;
	const callsigns_info = CONNSDATA.callsigns_info;
	if (!bandModeData) return "";

	const myCalls = STORAGE.myCall.split(",").map(s => s.trim());
	
	let otherCalls = new Set();
	let rxObj={};
	for (const band in bandModeData) {
		rxObj = bandModeData[band]?.[mode]?.Rx?.[myCalls[0]];
		if(rxObj){
			for (const otherCall in rxObj) {
				let bc = band +"-"+otherCall;
				otherCalls.add(bc);
			}
		}
		rxObj = bandModeData[band]?.[mode]?.Rx?.[myCalls[1]];
		if(rxObj){
			for (const otherCall in rxObj) {
				let bc = band +"-"+otherCall;
				otherCalls.add(bc);
			}
		}
	}

	otherCalls = Array.from(otherCalls);  

	let x =[]
	let rpts_a = [];
	let rpts_b = [];

	for (const idx in otherCalls){
		let b = otherCalls[idx].split("-")[0];
		let c = otherCalls[idx].split("-")[1];
		rpts_a.push(bandModeData[b]?.[mode]?.Rx?.[myCalls[0]]?.[c]?.rp ?? -30);
		rpts_b.push(bandModeData[b]?.[mode]?.Rx?.[myCalls[1]]?.[c]?.rp ?? -30);
		x.push(idx)
	}
	
	new Chart("graph1", {
	  type: "line",
	  data: {
		labels: x,
		datasets: [{
		  fill: false,
		  lineTension: 0,
		  backgroundColor: "rgba(0,0,255,1.0)",
		  borderColor: "rgba(0,0,255,0.1)",
		  data: rpts_a
		}, {
		  fill: false,
		  lineTension: 0,
		  backgroundColor: "rgba(0,200,100,1.0)",
		  borderColor: "rgba(0,0,255,0.1)",
		  data: rpts_b
		}]
	  },
	  options: {
		legend: {display: false},
		scales: {
		  yAxes: [{ticks: {min: -25, max:15}}],
		}
	  }
	});


}
	
