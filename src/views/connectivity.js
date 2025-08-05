
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
  console.log("Connectivity for band = ",band);
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
	console.log("Connectivity for ",band, mode);
	let HTML = '<h2>*HOME* Connectivity for ' + band + ' ' + mode +'</h2>';
	HTML += html_for_ModeConnectivity(mode)
	DOMcontainer.innerHTML = HTML;
}

function html_for_ModeConnectivity(mode){
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall[band][mode];
    if (!bandModeData) return;
	
	let entityType = 'L4';
	let entityConns = {};
	let entities = new Set();
	for (const ctx in bandModeData.Tx){
		let etx = getEntity(ctx, entityType);
		entities.add(etx);
		if(!entityConns[etx]) {entityConns[etx]={};}
		for (const crx in bandModeData.Rx) {
			let erx = getEntity(crx, entityType);
			if(crx in bandModeData.Tx[ctx]){
				entityConns[etx][erx]=1;  
			}
		}	
	}

	console.log(entityConns);

	let HTML = "<table id='connectivityTable' class='connectivityTable' >";
	// Column headers
	HTML += "<thead><tr><th></th>";
	for (const etx of entities) {
		HTML += `<th class = 'transmit'>${etx}</th>`;
	}
	HTML += "</tr></thead><tbody>";
	
	// need to build the structure first and then do the table ...
	
	// Row Headers
	for (const erx of entities) {
		HTML += `<tr><th class='receive'>${erx}</th>`;
		// Cells 
		let txt = "";
		for (const etx of entities) {
			if(entityConns[etx][erx]){
				txt = "x"; 
			}
			HTML += "<td class = 'cell'>"+txt+"</td>";
		}
		HTML += "</tr>";
	}

	HTML += "</tbody></table>";

	return HTML;

}

function getEntity(call,entityType){
  const callsigns_info = CONNSDATA.callsigns_info;
  if(entityType=="Call"){return call}
//  if (!callsigns_info){
//	let square = 'xxxxxxxx';
//  } else {
	let square = callsigns_info[call].sq;
//  }
  if(entityType=="L2"){return square.substring(0,2)}
  if(entityType=="L4"){return square.substring(0,4)} 
}
