
import {liveConnsData, getBandStats } from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';


var DOMcontainer = null;
let getMode = () => null;
let mode = null;
let details_level = 0;

export function init(container, band, opts = {}) {
	DOMcontainer = container;
	getMode = opts.getWatchedMode;
	refresh(); // first display
}

export function refresh(){
	mode = getMode();
	const activeBands = Object.keys(liveConnsData).sort((a, b) => wavelength(b) - wavelength(a));
	let tx_bandstats = [];
	let rx_bandstats = [];
	for (const band of activeBands) {
		tx_bandstats.push(getBandStats(liveConnsData[band][mode]?.Tx));
		rx_bandstats.push(getBandStats(liveConnsData[band][mode]?.Rx));
	}

	let HTML = '<h2>Bands Overview</h2>';
	HTML+="<table><thead>";
	for (const band of activeBands) {
		HTML += "<th title = 'Click for benchmarking.'><button class='button button--table' data-action = 'benchmark' data-band='"+band+"'>" + band + "</button></th>";
	}
	HTML+="</thead>"
	
	HTML+="<tbody>"
	
	HTML+="<tr>";
	for (const band in activeBands) {HTML += "<td>"+tx_bandstats[band].nHomeCalls+"</td>";}
	HTML+="</tr>";
	
	HTML+="<tr>";
	for (const band in activeBands) {HTML += "<td>"+tx_bandstats[band].nOtherCalls+"</td>";}
	HTML+="</tr>";
	
	HTML+="<tr>";
	for (const band in activeBands) {HTML += "<td>"+rx_bandstats[band].nHomeCalls+"</td>";}
	HTML+="</tr>";
	
	HTML+="<tr>";
	for (const band in activeBands) {HTML += "<td>"+rx_bandstats[band].nOtherCalls+"</td>";}
	HTML+="</tr>";
	
	
//	if(details_level>0){
//		HTML += "<div title='" + winner + "'>" + nMax + "</div>";
//		for (const myCall in myCalls_counts){
//			if(myCall !="ALL_HOME"){
//				for (const band of activeBands) {
//					HTML += "<td title='" + myCall + "'>" + myCalls_counts[myCall] + "</td>";
//				}
//			}
//		}
//	}
    
	
	HTML+="</tbody>"
	HTML += "</table>";
		
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


