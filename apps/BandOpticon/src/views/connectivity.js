
import * as CONNSDATA from '/src/live-data/conns-data.js';
import * as STORAGE from '/src/app/store-cfg.js';

var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
let registerActiveModes = () => {};  // fallback to no-op

var DOMcontainer = null;
let getMode = () => null;
let band = null;
let mode = null;

export function init(container, opts = {}) {
  DOMcontainer = container;
  band = opts.band;
  console.log("Connectivity for band = ",band);
  if (opts.getWatchedMode) {
    getMode = opts.getWatchedMode;
	mode = getMode();
  }
  if (opts.registerActiveModes) {
    registerActiveModes = opts.registerActiveModes;
  }

  refresh();
}

export function refresh(){

	// Update activeModes for all modes found on this band ONLY
	const bandData = CONNSDATA.connectivity_Band_Mode_HomeCall[band];
	for (const md in bandData) {
        activeModes.add(md);
	}
	registerActiveModes(activeModes);	// updated in html_forStatsForAllBands and now passed back to ribbon

	mode = getMode();
	let HTML = '<h2>*HOME* Connectivity for ' + band + ' ' + mode +'</h2>';
	HTML += html_for_ModeConnectivity(mode)
	DOMcontainer.innerHTML = HTML;
}

function html_for_ModeConnectivity(mode){
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall[band][mode];
    if (!bandModeData) return;
	
	let homeCalls = new Set();
	if(bandModeData.Tx){
		for (const key in bandModeData.Tx){
			homeCalls.add(key);
		}
	}
	if(bandModeData.Rx){
		for (const key in bandModeData.Rx){
			homeCalls.add(key);
		}
	}
	homeCalls = Array.from(homeCalls)

	let HTML = "<table id='connectivityTable' class='connectivityTable' >";
	// Column headers
	HTML += "<thead><tr><th></th>";
	for (const colCall of homeCalls) {
		HTML += `<th class = 'transmit'>${colCall}</th>`;
	}
	HTML += "</tr></thead><tbody>";
	
	// Row Headers
	for (const rowCall of homeCalls) {
		HTML += `<tr><th class='receive'>${rowCall}</th>`;
		// Cells 
		for (const colCall of homeCalls) {
			var txt = "";
			if(bandModeData.Rx[rowCall]){
				if(bandModeData.Rx[rowCall][colCall]){
					//console.log("'"+rowCall+"-"+colCall+"'");
					txt = 'X';
				}
			}
			HTML += "<td class = 'cell'>"+txt+"</td>";
		}
		HTML += "</tr>";
	}
	HTML += "</tbody></table>";

	return HTML;

}

