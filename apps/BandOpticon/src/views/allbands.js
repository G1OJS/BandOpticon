
import * as CONNSDATA from '/src/live-data/conns-data.js';
import * as STORAGE from '/src/app/store-cfg.js';

var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
var currentMode = null;
var DOMcontainer = null;
let registerActiveModes = () => {};  // fallback to no-op
let getMode = () => "FT8";
let refresh = () => null;

export const Overview = {
	init(container, opts = {}) {
		DOMcontainer = container;
		registerActiveModes = opts.registerActiveModes;
		getMode = opts.getWatchedMode;
		refresh();
	},

	refresh(){
		currentMode = getMode();
		let HTML = '<h2>Bands Overview</h2>';
		HTML += html_forStatsForAllBands();
		DOMcontainer.innerHTML = HTML;
		registerActiveModes(activeModes);	// updated in html_forStatsForAllBands and now passed back to ribbon
	}
};

export const Benchmark = {
	init(container, opts = {}) {
	  DOMcontainer = container;
	  if (opts.registerActiveModes) {
		registerActiveModes = opts.registerActiveModes;
	  }
	  if (opts.getWatchedMode) {
		getMode = opts.getWatchedMode;
	  }
	  refresh();
	},

	refresh(){
	  currentMode = getMode();
	  let HTML = '<h2>Benchmarking</h2>';
	  HTML += html_forStatsForAllBands();
	  DOMcontainer.innerHTML = HTML;
	  registerActiveModes(activeModes);	// updated in html_forStatsForAllBands and now passed back to ribbon
	}
};


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
	
    document.getElementById("mainContent").innerHTML = HTML;
	document.querySelectorAll("div").forEach(div => {
      if (div.innerText.trim() === "0") {
        div.classList.add("zero");
      }
    });
	
	return HTML;
}

function html_forStatsRowLabels() {
    return "<div class = 'outputColumn'>"
     + "<div class = 'firstColumn topRow' title = 'Band'>Band</div>"
     + "<div class = 'firstColumn' title = 'Number of callsigns active in home squares'>Home calls</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by all callsigns in home, as a group'>Total spots</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by best performing callsign in home (hover over numbers for callsign)'>Leader spots</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by my callsign'>" + STORAGE.myCall + " spots</div>"
     + "</div>";
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

    let nMe = 0,
    nMax = 0,
    winner = "";
    let nActive = 0;
    const otherEndCallsAggregate = new Set();

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

        if (homeCall === STORAGE.myCall) {
            nMe = count;
        }
    }

    HTML += "<div><div class='outputColumn'>"
     + "<div class='topRow' data-band='"+band+"'>" + band + "</div>"
     + "<div>" + nActive + "</div>"
     + "<div>" + otherEndCallsAggregate.size + "</div>"
     + "<div title='" + winner + "'>" + nMax + "</div>"
     + "<div title='" + STORAGE.myCall + "'>" + nMe + "</div>"
     + "</div></div>";
	 
	 return HTML;
}


