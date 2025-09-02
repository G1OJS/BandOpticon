
import {liveConnsData, analyseData, homeCalls, otherCalls_myCall1, otherCalls_Leader, otherCalls_All } from '../lib/conns-data.js';
import {myCall} from '../lib/store-cfg.js';


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
	
	let HTML = '<h2>Bands Overview</h2>';
	
	// column headings / buttons
	HTML+="<table><thead>";
	HTML+="<th></th>";
	for (const band of activeBands) {
		HTML += "<th title = 'Click for benchmarking.'><button class='button button--table' data-action = 'benchmark' data-band='"+band+"'>" + band + "</button></th>";
	}
	HTML+="</thead>"

	// body rows
	HTML+="<tbody>"
	HTML += getBodyRows('Tx', activeBands, details_level);
	HTML += getBodyRows('Rx', activeBands, details_level);
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

function getBodyRows(RxTx, activeBands, details_level){
	let rowClass = (RxTx=="Rx")? 'receive':'transmit';
	let otherCallType = (RxTx=="Rx")? 'Spotted':'Spotting';
	
	let bandstats = [];
	for (const band of activeBands) {
		let data = (RxTx=="Rx")? liveConnsData[band][mode]?.Rx : liveConnsData[band][mode]?.Tx;
		analyseData(data)
		bandstats.push({nHomeCalls:homeCalls.size, nOtherCalls_myCall1:otherCalls_myCall1.size, nOtherCalls_Leader:otherCalls_Leader.size, nOtherCalls_All:otherCalls_All.size});
	}
	
	let HTML="";
	
	HTML+="<tr class = '"+rowClass+"'><th>Home "+RxTx+" Calls</th>"; 
	for (const band in activeBands) {HTML += "<td>"+bandstats[band].nHomeCalls+"</td>";} 
	HTML+="</tr>";

	HTML+="<tr class = '"+rowClass+"'><th>"+otherCallType+" Calls</th>"; 
	for (const band in activeBands) {HTML += "<td>"+bandstats[band].nOtherCalls_All+"</td>";} 
	HTML+="</tr>";
	
	if(details_level>0){
		let myCall1 = myCall.split(",")[0].trim();
		let myCall2 = myCall.split(",")[1]?.trim();
		HTML+="<tr class = '"+rowClass+"'><th>Leader</th>"; 
		for (const band in activeBands) {HTML += "<td title='"+bandstats[band].leaderCall+"'>" +bandstats[band].nOtherCalls_Leader+" </td>";} HTML+="</tr>";
		HTML+="<tr class = '"+rowClass+"'><th>"+myCall1+"</th>";
		for (const band in activeBands) {HTML += "<td title='"+bandstats[band].leaderCall+"'>" +bandstats[band].nOtherCalls_myCall1+" </td>";} HTML+="</tr>";
	}	
	return HTML;
}


function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}


