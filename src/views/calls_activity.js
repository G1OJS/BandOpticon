
import * as CONNSDATA from '/src/lib/conns-data.js';
import * as STORAGE from '/src/lib/store-cfg.js';

var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
let registerActiveModes = () => {};  // fallback to no-op

var DOMcontainer = null;
let getMode = () => null;
let band = null;
let mode = null;

export function init(container, opts = {}) {
  DOMcontainer = container;
  band = opts.band || band;  // if opts.band is null, leave band alone
  console.log("Home callsigns activity = ",band);
  if (opts.getWatchedMode) {
    getMode = opts.getWatchedMode;
	mode = getMode();
  }
  if (opts.registerActiveModes) {
    registerActiveModes = opts.registerActiveModes;
  }
  
}

export function refresh(){
	// Update activeModes for all modes found on this band ONLY
	const bandData = CONNSDATA.connectivity_Band_Mode_HomeCall[band];
	for (const md in bandData) {
        activeModes.add(md);
	}
	registerActiveModes(activeModes);	
	mode = getMode();
	console.log("Home callsign activity ");
	let HTML = "";
	HTML += "<button data-action='home'>🏠 Home</button>"
	HTML += "<h2>Home callsign activity</h2>";
	HTML += html_for_callsActivity('Rx');
	DOMcontainer.innerHTML = HTML;
}

function html_for_callsActivity(RxTx){
//	  const data = CONNSDATA.connectivity_Band_Mode_HomeCall;
//    if (!data) return;
	const callsigns_info = CONNSDATA.callsigns_info;
    if (!callsigns_info) return;
	
	const sortedEntries = Object.entries(callsigns_info).sort(([a], [b]) => {
		return a.localeCompare(b); // sorts by the callsign string
	});
	
	let HTML = "<table>";
	HTML += "<thead><tr><th>Callsign</th><th>Last Band</th><th>Last Mode</th></thead>"
	for (const [cs, info] of sortedEntries) {
		if(info.inHome){
			HTML += `<tr><th class='receive'>${cs}</th><td>`+info.lastBand+'</td><td>'+info.lastMode+'</td></tr>';
		}
	}
	HTML += "</tbody></table>";

	return HTML;

}
