
import {liveConnsData} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';


var DOMcontainer = null;
let getMode = () => null;
let mode = null;
let details_level = 0;

export function init(container, band, opts = {}) {
	DOMcontainer = container;
	getMode = opts.getWatchedMode;
	mode = getMode();
	

	refresh(); // first display
}

export function refresh(){
	mode = getMode();

	let HTML = '<h2>Bands Overview</h2>';
	HTML += html_forStatsForAllBands();
	let details_text = details_level ? "Hide benchmarking stats":"Show benchmarking stats";
	HTML += "<button id='details_toggle'>"+details_text+"</button>";
		
	DOMcontainer.innerHTML = HTML;
	
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

	const activeBands = Object.keys(liveConnsData).sort((a, b) => wavelength(b) - wavelength(a));
//	console.log("bandsOverview found active bands: "+ activeBands);
	var HTML = "";
 
    HTML = "<h3>Transmitting " + mode + "</h3>";
	HTML += "<p class = 'text-sm'>Click band buttons to show connectivity</p>";
    HTML += "<div class='outputContainer transmit'>";
    HTML += html_forStatsRowLabels();
    activeBands.forEach(band => HTML += html_forStatsForThisBand(band, mode, "Tx"));
    HTML += "</div>";
	
    HTML += "<h3>Receiving " + mode + "</h3>";
	HTML += "<p class = 'text-sm'>Click band buttons to show Rx benchmarking</p>";
    HTML += "<div class='outputContainer receive'>";
    HTML += html_forStatsRowLabels();
    activeBands.forEach(band => HTML += html_forStatsForThisBand(band, mode, "Rx"));
    HTML += "</div>";
	
	return HTML;
}

function html_forStatsRowLabels() {
	let HTML = "<div class = 'outputColumn'>"
    HTML +="<div class = 'firstColumn topRow' title = 'Band: click for band details views'>Band</div>";
    HTML +="<div class = 'firstColumn' title = 'Number of callsigns active in home squares. Click for details.'><button class='button button--table' data-action='callsActivity'>Home calls</button></div>";
    HTML +="<div class = 'firstColumn' title = 'Number of spots generated worldwide by all callsigns in home, as a group'>Total spots</div>";
	 if(details_level>0){
		HTML += "<div class = 'firstColumn' title = 'Number of spots generated worldwide by best performing callsign in home (hover over numbers for callsign)'>Leader spots</div>";
		for (const myCall of STORAGE.myCall.split(',')){
			if(myCall.trim() != "ALL_HOME"){
				HTML += "<div class = 'firstColumn' title = 'Number of spots generated worldwide by my callsign'>" + myCall.trim() + " spots</div>";
			}
		}
	 }
     HTML += "</div>";
	
	return HTML;
}

function html_forStatsForThisBand(band, mode, RxTx) {

    const bandData = liveConnsData[band];
    if (!bandData) return "";
	
//	console.log("Writing stats for " + band + " " + mode);
	let HTML = "";

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
        const otherSet = new Set();
        for (const otherCall in bandModeData[homeCall]) {
            otherSet.add(otherCall);
            otherEndCallsAggregate.add(otherCall);
        }
        const count = otherSet.size;
        if (count > 0)
            nActive++;
        if (count > nMax && homeCall != "ALL_HOME") {
            nMax = count;
            winner = homeCall;
        }
		if (homeCall.trim() in myCalls_counts){
			myCalls_counts[homeCall.trim()] = count;
        }
    }

    HTML += "<div><div class='outputColumn'>";
	if(RxTx == "Tx"){
		HTML += "<div class = 'topRowButtonContainer' title = 'Click for connectivity.'><button class='button button--table' data-action = 'connectivity' data-band='"+band+"'>" + band + "</button></div>";
	} else {
		HTML += "<div class = 'topRowButtonContainer' title = 'Click for Rx benchmarking.'><button class='button button--table' data-action = 'benchmarkRx' data-band='"+band+"' data-winner='"+winner+"'>" + band + "</button></div>";		
	}
    HTML += "<div>" + nActive + "</div>";
    HTML += "<div>" + otherEndCallsAggregate.size + "</div>";
	if(details_level>0){
		HTML += "<div title='" + winner + "'>" + nMax + "</div>";
		for (const myCall in myCalls_counts){
			if(myCall !="ALL_HOME"){
				HTML += "<div title='" + myCall + "'>" + myCalls_counts[myCall] + "</div>";
			}
		}
	}
    HTML += "</div></div>";

	return HTML;
}


