var tStart = Date.now(); // software start time
var HTML = "";
var activeModes = new Set();
var watchedMode="FT8";

import * as CONNSDATA from '../../../src/live-data/conns-data.js';
import * as STORAGE from '../../../src/app/store-cfg.js';

let ribbon;
export function setRibbon(r) {
  ribbon = r;
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

export function writeStatsForAllBands() {

    const activeBands = Object.keys(CONNSDATA.connectivity_Band_Mode_HomeCall).sort((a, b) => wavelength(b) - wavelength(a));
 	const currentMode = ribbon ? ribbon.getWatchedMode() : "FT8";
 
    HTML = "<h3>Transmitting " + currentMode + "</h3><div class='outputContainer transmit'>";
    writeStatsRowLabels();
    activeBands.forEach(band => writeStatsForThisBand(band, currentMode, "Tx"));
    HTML += "</div>";
	
    HTML += "<h3>Receiving " + currentMode + "</h3><div class='outputContainer receive'>";
    writeStatsRowLabels();
    activeBands.forEach(band => writeStatsForThisBand(band, currentMode, "Rx"));
    HTML += "</div>";
	
    document.getElementById("mainContent").innerHTML = HTML;
	document.querySelectorAll("div").forEach(div => {
      if (div.innerText.trim() === "0") {
        div.classList.add("zero");
      }
    });
}

function writeStatsRowLabels() {
    HTML += "<div class = 'outputColumn'>"
     + "<div class = 'firstColumn topRow' title = 'Band'>Band</div>"
     + "<div class = 'firstColumn' title = 'Number of callsigns active in home squares'>Home calls</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by all callsigns in home, as a group'>Total spots</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by best performing callsign in home (hover over numbers for callsign)'>Leader spots</div>"
     + "<div class = 'firstColumn' title = 'Number of spots generated worldwide by my callsign'>" + STORAGE.myCall + " spots</div>"
     + "</div>";
}

export function writeStatsForThisBand(band, mode, RxTx) {
//	console.log("Writing stats for " + band + RxTx);
    const bandData = CONNSDATA.connectivity_Band_Mode_HomeCall[band];
    if (!bandData) return;

    // Update activeModes early for all modes found on this band
    for (const md in bandData) {
        activeModes.add(md);
    }
	ribbon.registerActiveModes(activeModes);

    // Access the relevant direction of the watched mode
    const bandModeData = bandData[mode]?.[RxTx];

    // Skip only if both directions are missing or empty
    if (!bandModeData || Object.keys(bandModeData).length === 0) {
        const otherDir = (RxTx === "Tx") ? "Rx" : "Tx";
        const otherData = bandData[mode]?.[otherDir];
        if (!otherData || Object.keys(otherData).length === 0) return;
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
     + "<div class='topRow'>" + band + "</div>"
     + "<div>" + nActive + "</div>"
     + "<div>" + otherEndCallsAggregate.size + "</div>"
     + "<div title='" + winner + "'>" + nMax + "</div>"
     + "<div title='" + STORAGE.myCall + "'>" + nMe + "</div>"
     + "</div></div>";
}


