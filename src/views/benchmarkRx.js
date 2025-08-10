
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
  function getBand(MHz){
	let fMHz = parseFloat(MHz);
	let i = [1.8,3.5,5,7,10,14,17,21,24,28,50,70,144,430].findIndex(f => f > MHz);  
	return [false,"160m","80m","60m","40m","30m","20m","18m","15m","12m","10m","6m","4m","2m","70cm"][i];
  }
  
  function getEpoch(dt_str_utc){
	let d = dt_str_utc;
	let dt = new Date(Date.UTC("20"+d.slice(0,2),d.slice(2,4)-1,d.slice(4,6),d.slice(7,9),d.slice(9,11),d.slice(11,13)));
	let epoch_from_utc = dt.valueOf() / 1000
	return epoch_from_utc;  
  }
  
  function getSquare(sq){
	// get square from the last entry of the ALL.txt row (which is either an L4 square or RR73, RRR, 73 or R+nn or R-nn)  
	if(sq.length !=4 || sq == "RR73") {return false}
	if(sq[1]=="+" ||sq[1]=="-") {return false}
	return sq.trim()+"MM";  // make into L6 at centre of L4 square
  }

  function load_ALL_file(rr) {
		var lines = rr.split(/[\r\n]+/g);
		// receiver callsign
		const rc = STORAGE.myCall.split(",")[0];
		// get receiver L4 square from All file (needed for distance calcs if I put in analysis needing distance / bearing)
		// Rx-only stations / ALL files won't have this, so will need a setting for it
		let rl = ''
		for (const l of lines) {
			let s = l.trim().match(/\S+/g);
			if(s){
				if(s.length == 10){
					let Rx = s[2];
					if(Rx == "Tx" && s[9].trim() != "RR73"){
						rl = s[9].trim()+"MM"; // make into L6 at centre of L4 square
						break;
					}
				}
			}
		}
		let nSpots = 0;
		for (const l of lines) {
			let s = l.trim().match(/\S+/g);
			if(s){
				if(s.length == 10 && s[2] == "Rx"){
					let sc = s[8].trim().replace('<','').replace('>','');
					let sl = getSquare(s[9]);
					let rp = s[4].trim();
					let md = s[3].trim();
					let b = getBand(s[1]);
					let t = getEpoch(s[0]);
					if(sc!="" && sl && md!="" && b && t){	// ignore unknown bands etc (some caused by zero MHz in ALL.txt)
						const cutoff = Date.now() / 1000 - 60 * STORAGE.purgeMinutes;
						if(t > cutoff){
							let spot = {'sc':sc,'rc':rc,'sl':sl,'rl':rl,'rp':rp,'b':b,'md':md,'t':t};
							CONNSDATA.addSpotToConnectivityMap(spot);
							nSpots +=1;
						}
					}
				}
			}
		//	console.log(spot);
		}
	  console.log("Added "+nSpots+" spots from ALL.txt file with "+lines.length+" lines");
	}

function handleFileSelection(event){
	const fileList = event.target.files;
	const reader = new FileReader();
	reader.onload = () => {
		let rr = reader.result;
		load_ALL_file(rr);
	}
	console.log(fileList[0]);
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
	HTML += '<br><br>Experimental - import Rx spots from a WSJT-X ALL.txt file: '
	HTML += '<input type="file" id="allFileChooser" accept="*.txt" />'
	HTML += "<br>(Currently of limited use but may support future all file analysis.)"
	HTML += "</div><br>";
	HTML += html_for_benchmarking(mode);
	DOMcontainer.innerHTML = HTML;
	
	const inputElement = document.getElementById('allFileChooser');
    inputElement.addEventListener("change", handleFileSelection);
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
