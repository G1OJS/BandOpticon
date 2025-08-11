
import * as CONNSDATA from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';

var DOMcontainer = null;
let band = null;
let getMode = () => null;
let mode = null;

export function init(container, band, opts = {}) {
  DOMcontainer = container;
  getMode = opts.getWatchedMode;
  mode = getMode();
  refresh(); // first display
}

export function refresh(){

	const bandData = CONNSDATA.connsData[band];
	mode = getMode();

	let HTML = "";
	HTML += "<button data-action='home'>🏠 Home</button>"
	HTML += "<h2>Home callsign activity</h2>";
	HTML += "<h3>Transmitting Callsigns</h3>";
	HTML += html_for_callsActivity('Tx');
	HTML += "<h3>Receiving Callsigns</h3>";
	HTML += html_for_callsActivity('Rx');
	DOMcontainer.innerHTML = HTML;
}

function html_for_callsActivity(RxTx){
//	  const data = CONNSDATA.connsData;
//    if (!data) return;
	const callsigns_info = CONNSDATA.callsigns_info;
    if (!callsigns_info) return;
	
	const sortedEntries = Object.entries(callsigns_info).sort(([a], [b]) => {
		return a.localeCompare(b); // sorts by the callsign string
	});
	
	const classtxt = (RxTx == 'Rx')? "receive":"transmit";
	let HTML = "<table>";
	HTML += "<thead><tr><th>Callsign</th><th>Last Band</th><th>Last Mode</th></thead>"
	for (const [cs, info] of sortedEntries) {
		if(info.inHome && info.RxTx == RxTx){
			HTML += "<tr><th class='"+classtxt+"' style = 'text-align:right;'>"+cs+"</th>"
			HTML += "<td style = 'text-align:center;'>"+info.lastBand+"</td>"
			HTML += "<td style = 'text-align:center;'>"+info.lastMode+"</td></tr>";
		}
	}
	HTML += "</tbody></table>";

	return HTML;

}
