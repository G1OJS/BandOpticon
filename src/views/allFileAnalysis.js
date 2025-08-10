
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
  internal_refresh();
}

export function refresh(){

}

function internal_refresh(){
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
	let HTML = ""
	HTML +=  '<h2>WSJT-X ALL File Analysis for ' + mode +'</h2>';
	HTML += "<div class = 'text-sm'>";
	HTML += ""
	HTML += ""
	HTML += ""
	
	HTML += '<br><br>Experimental - import Rx spots from WSJT-X ALL.txt files: '
	for (const rc of STORAGE.myCall.split(",")){
		HTML += '<br>ALL file for '+rc+' <input type="file" id="allFileChooser_'+rc.trim()+'" accept="*.txt" />'
	}
	HTML += "<br>(Currently of limited use but may support future all file analysis including SNR data.)"
	HTML += "</div><br>";
	HTML += html_for_benchmarking(mode);
	DOMcontainer.innerHTML = HTML;
	
	for (const rc of STORAGE.myCall.split(",")){
		const inputElement = document.getElementById('allFileChooser_'+rc.trim());
		inputElement.addEventListener("change", handleFileSelection);
	}	
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
						console.log(rp);
						let last = myCalls_rpts[ocb][m]
						myCalls_rpts[ocb][m] = (rp>last)? rp:last;
					}
				}
			}
		}
	}

	let HTML = "";
	let otherCallsArr = Array.from(otherCalls).toSorted((a, b) => a.localeCompare(b))
	for (const ocb of otherCallsArr) {
		HTML += "<br>" + ocb+ " ";
		for (const mc of STORAGE.myCall.split(",")){
			let m = mc.trim();
			let rp = myCalls_rpts[ocb][m];
			HTML += " " + rp? rp: "n/a";
		}
	}

	return HTML;

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

  function load_ALL_file(rr, call) {
		var lines = rr.split(/[\r\n]+/g);
		// receiver callsign
		const rc = call;
		//******************************************need to change this next line to use storred params
		const rl = STORAGE.squaresList.split(",")[0]; // need user to make sure the first square is associated with the callsign
		
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
	  internal_refresh();
	}

function handleFileSelection(event){
	const fileList = event.target.files;
	const id = event.target.id;
	console.log(id);
	const reader = new FileReader();
	reader.onload = () => {
		let rr = reader.result;
		load_ALL_file(rr,id.split("_")[1]);
	}
	console.log(fileList[0]);
	reader.readAsText(fileList[0]);
}