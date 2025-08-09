
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

  function handleFiles() {
    const fileList = document.getElementById('allFileChooser').files;
	console.log(fileList[0]);
	  // Read the file and add spots
	  const reader = new FileReader();
	  reader.onload = () => {
		let rr = reader.result;
		var lines = rr.split(/[\r\n]+/g);
		const m = STORAGE.myCall.split(",")[0];
		for (const l of lines) {
			let s = l.trim().split(" ");
//			console.log("8",s[8], "15",s[15]);
			let spot = {'sc':s[15],'rc':m,'sl':s[16],'rl':'IO90JU','b':'20m','md':s[6],'t':1000000000000};
//			let spot = {'sc':s[8],'rc':m,'sl':s[9],'rl':'IO90JU','b':'20m','md':s[3],'t':1000000000000};
			CONNSDATA.addSpotToConnectivityMap(spot);
		//	console.log(spot);
		}
	  };
	  reader.onerror = () => {
		showMessage("Error reading the file. Please try again.", "error");
	  };
	  reader.readAsText(fileList[0]);
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
	HTML += "This is a new view showing the number of times a pskreporter report was made for each transmitting callsign. "
	HTML += "Note that pskreporter only re-issues a report for a spot if 20 minutes have elapesed from the previous spot."
	HTML += '<br><label class = "allFileChooser">Import ALL.txt </label><input type="file" class = "button allFileChooser" id="allFileChooser" accept="*.txt" />'
	HTML += "</div><br>";
	HTML += html_for_benchmarking(mode);
	DOMcontainer.innerHTML = HTML;
	
	const inputElement = document.getElementById('allFileChooser');
    inputElement.addEventListener("change", handleFiles, false);
}

function html_for_benchmarking(mode){
	
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall;
	const callsigns_info = CONNSDATA.callsigns_info;
    if (!bandModeData) return "";
	
	let myCalls_counts = {};
    let otherCalls = new Set();
	for (const mc of STORAGE.myCall.split(",")){
		let m = mc.trim();
		for (const band in bandModeData){
			if(bandModeData[band][mode]){
				if(bandModeData[band][mode].Rx[m]) {
					for (const otherCall in bandModeData[band][mode].Rx[m]) {
						let ocb = band+": "+otherCall;
						otherCalls.add(ocb);
						if(!myCalls_counts[ocb]) { myCalls_counts[ocb]={} }
						if(!myCalls_counts[ocb][m]) {myCalls_counts[ocb][m] = 1} else {myCalls_counts[ocb][m] += 1} 
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
		let txt =""
		if(myCalls_counts[ocb]){
			for (const mc of STORAGE.myCall.split(",")){
				let m = mc.trim();
				let cnt = myCalls_counts[ocb][m];
				if(cnt) {txt=cnt} else {txt = ""}
				HTML += "<td >" + txt + "</td>" ;
			}
		}
		HTML += "</tr>";
	}

	HTML += "</tbody></table></div>";

	return HTML;

}
