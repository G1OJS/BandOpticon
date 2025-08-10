
import * as CONNSDATA from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';

var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
var currentMode = null;
var DOMcontainer = null;
let registerActiveModes = () => {};  // fallback to no-op
let getMode = () => null;
let details_level = 0;

export function init(container, opts = {}) {
	console.log("init home");
	DOMcontainer = container;
	registerActiveModes = opts.registerActiveModes;
	getMode = opts.getWatchedMode;
}

export function refresh(){
	console.log("refresh home");
	currentMode = getMode();
	let HTML = '<h2>Bands Overview</h2>';
	HTML += html_forStatsForAllBands();
	let details_text = details_level ? "Hide benchmarking stats":"Show benchmarking stats";
	HTML += "<button id='details_toggle'>"+details_text+"</button>";
	
	HTML += "<button id='btn_benchmarkingView' data-action = 'benchmarkRx'>Rx Benchmarking View</button>";
	HTML += "<button id='btn_allFileAnalysis' class = 'hideme' data-action = 'allFileAnalysis'>WSJT ALL analysis</button>";
	
	DOMcontainer.innerHTML = HTML;
	registerActiveModes(activeModes);	// updated in html_forStatsForAllBands and now passed back to ribbon
	const detailsButton = document.getElementById('details_toggle');
	detailsButton.addEventListener('click', () => {
		details_level = 1-details_level;
		refresh();
	});

}

function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}

function safePercentage(numerator, denominator) {
    if (denominator == 0)
        return "0%";
    return Math.round((numerator / denominator) * 100) + "%";
}

function html_forStatsForAllBands() {

	const activeBands = Object.keys(CONNSDATA.connectivity_Band_Mode_HomeCall).sort((a, b) => wavelength(b) - wavelength(a));
	
	var HTML = "";
 
    HTML = "<h3>Transmitting " + currentMode + "</h3><div class='outputContainer transmit'>";
    HTML += html_forStatsRowLabels();
    activeBands.forEach(band => HTML += html_forStatsForThisBand(band, currentMode, "Tx"));
    HTML += "</div>";
	
    HTML += "<h3>Receiving " + currentMode + "</h3><div class='outputContainer receive'>";
    HTML += html_forStatsRowLabels();
    activeBands.forEach(band => HTML += html_forStatsForThisBand(band, currentMode, "Rx"));
    HTML += "</div>";
	
	return HTML;
}

function html_forStatsRowLabels() {
	let HTML = "<div class = 'outputColumn'>"
    HTML +="<div class = 'firstColumn topRow' title = 'Band: click for band details views'>Band</div>";
    HTML +="<div class = 'firstColumn' title = 'Number of callsigns active in home squares. Click for details.'><button class='button button--table' data-action='callsactivity'>Home calls</button></div>";
    HTML +="<div class = 'firstColumn' title = 'Number of spots generated worldwide by all callsigns in home, as a group'>Total spots</div>";
	 if(details_level>0){
		HTML += "<div class = 'firstColumn' title = 'Number of spots generated worldwide by best performing callsign in home (hover over numbers for callsign)'>Leader spots</div>";
		for (const myCall of STORAGE.myCall.split(',')){
			HTML += "<div class = 'firstColumn' title = 'Number of spots generated worldwide by my callsign'>" + myCall.trim() + " spots</div>";
		}
	 }
     HTML += "</div>";
	
	return HTML;
}

function html_forStatsForThisBand(band, mode, RxTx) {
//	console.log("Writing stats for " + band + RxTx);

    const bandData = CONNSDATA.connectivity_Band_Mode_HomeCall[band];
    if (!bandData) return "";
	
	var HTML = "";

    // Update activeModes early for all modes found on this band
    for (const md in bandData) {
        activeModes.add(md);
    }

    // Access the relevant direction of the watched mode
    const bandModeData = bandData[mode]?.[RxTx];

    // Skip only if both directions are missing or empty 
	// Reason - if only one direction is empty, we need a column of zeros
	// to keep the tables aligned
    if (!bandModeData || Object.keys(bandModeData).length === 0) {
        const otherDir = (RxTx === "Tx") ? "Rx" : "Tx";
        const otherData = bandData[mode]?.[otherDir];
        if (!otherData || Object.keys(otherData).length === 0) return "";
    }
	
    let nMax = 0, winner = "", nActive = 0;
    const otherEndCallsAggregate = new Set();

	let myCalls_counts = {};
	for (const c of STORAGE.myCall.split(",")){
		myCalls_counts[c.trim()]=0;
	}
	
    for (const homeCall in bandModeData) {
        const peerMap = bandModeData[homeCall];
        const otherSet = new Set();

        for (const otherCall in peerMap) {
            otherSet.add(otherCall);
            otherEndCallsAggregate.add(otherCall);
        }

        const count = otherSet.size;
        if (count > 0)
            nActive++;

        if (count > nMax) {
            nMax = count;
            winner = homeCall;
        }

		if (homeCall.trim() in myCalls_counts){
			myCalls_counts[homeCall.trim()] = count;
        }
		
    }

    HTML += "<div><div class='outputColumn'>";
    HTML += "<div class = 'topRowButtonContainer' title = 'Click for connectivity.'><button class='button button--table' data-band='"+band+"'>" + band + "</button></div>";
    HTML += "<div>" + nActive + "</div>";
    HTML += "<div>" + otherEndCallsAggregate.size + "</div>";
	if(details_level>0){
		HTML += "<div title='" + winner + "'>" + nMax + "</div>";
		for (const myCall in myCalls_counts){
			HTML += "<div title='" + myCall + "'>" + myCalls_counts[myCall] + "</div>";
		}
	}
    HTML += "</div></div>";
	 
	 return HTML;
}


