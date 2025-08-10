
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
	HTML += "This is a new view showing the latest report from each of 'My Callsigns' for each transmitting callsign heard. "
	HTML += "Note that pskreporter only re-issues a report for a spot if 20 minutes have elapesed from the previous spot. "
	HTML += "The view allows comparison of Rx performance with other callsigns, or between multiple receive configuratons providing seperate reports to pskreporter."
	HTML += "</div><br>";
	HTML += html_for_benchmarking(mode);
	DOMcontainer.innerHTML = HTML;

}

function html_for_benchmarking(mode){
	
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall;
	const callsigns_info = CONNSDATA.callsigns_info;
    if (!bandModeData) return "";
	
	let myCalls_rpts = {};
    let otherCalls = new Set();
	for (const mc of STORAGE.myCall.split(",")){
		let m = mc.trim();
		for (const band in bandModeData){
			if(bandModeData[band][mode]){
				if(bandModeData[band][mode].Rx[m]) {
					for (const otherCall in bandModeData[band][mode].Rx[m]) {
						let ocb = band+": "+otherCall;
						otherCalls.add(ocb);
						if(!myCalls_rpts[ocb]){myCalls_rpts[ocb]={}}
						if(!myCalls_rpts[ocb][m]) {myCalls_rpts[ocb][m]=-30}
						let rp = bandModeData[band][mode].Rx[m][otherCall].rp;
						let last = myCalls_rpts[ocb][m]
						myCalls_rpts[ocb][m] = (rp>last)? rp:last;
					}
				}
			}
		}
	}

	let HTML = "<div id='connectivityTableWrapper' class='table-wrapper'><table id='benchmarkTable' class='scalingTable' >";
	// Column headers
	HTML += "<thead><th></th>";
	for (const m of STORAGE.myCall.split(",")) {
		// (vertical text fussy on mobile so fake it)
		let vt = [...m].map(m => '<div>'+m+'</div>').join('').trim();
		HTML += "<th class = 'receive rhead' >"+vt+"</th>";
	}
	HTML += "</thead>"

	HTML += "<tbody>";	
	
	let otherCallsArr = Array.from(otherCalls).toSorted((a, b) => a.localeCompare(b))
	for (const ocb of otherCallsArr) {
		// Row Headers
		HTML += "<tr><th class = 'transmit rhead' >"+ocb+"</th>";
		// Cells 
		for (const mc of STORAGE.myCall.split(",")){
			let m = mc.trim();
			let txt = "";
			let rp = myCalls_rpts[ocb][m];
			if(rp){txt = rp}
			HTML += "<td>" +txt + "</td>";
		}
		HTML += "</tr>";
	}

	HTML += "</tbody></table></div>";

	return HTML;

}
