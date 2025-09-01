
import {liveConnsData, tx_callsigns_info, rx_callsigns_info} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';

var DOMcontainer = null;
let band = null;
let getMode = () => null;
let mode = null;
let viewName = null;

export function init(setviewName, container, band, opts = {}) {
	viewName = setviewName;
	DOMcontainer = container;
	getMode = opts.getWatchedMode;
	mode = getMode();
	refresh(); // first display
}

export function refresh(){

	const bandData = liveConnsData[band];
	mode = getMode();

	let HTML = "";
	HTML += "<h2>Home callsign activity</h2>";
	if(viewName == "RxCallsActivity"){
		HTML += "<h3>Receiving Callsigns</h3>";
		HTML += html_for_callsActivity('Rx');
	} else {
		HTML += "<h3>Transmitting Callsigns</h3>";
		HTML += html_for_callsActivity('Tx');
	}
	DOMcontainer.innerHTML = HTML;
}

function html_for_callsActivity(RxTx){
	
	let callsigns_info = (RxTx=="Rx")? rx_callsigns_info: tx_callsigns_info;

    if (!callsigns_info) return;
	
	const sortedEntries = Object.entries(callsigns_info).sort(([a], [b]) => {
		return a.localeCompare(b); // sorts by the callsign string
	});
	
	const classtxt = (RxTx == 'Rx')? "receive":"transmit";
	let HTML = "<table>";
	HTML += "<thead><tr><th>Callsign</th><th>Last Band</th><th>Last Mode</th></thead>"
	for (const [cs, info] of sortedEntries) {
		if(info.inHome){
			HTML += "<tr><th class='"+classtxt+"' style = 'text-align:right;'>"+cs+"</th>"
			HTML += "<td style = 'text-align:center;'>"+info.lastBand+"</td>"
			HTML += "<td style = 'text-align:center;'>"+info.lastMode+"</td></tr>";
		}
	}
	HTML += "</tbody></table>";

	return HTML;

}
