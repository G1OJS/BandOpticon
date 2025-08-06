
import * as CONNSDATA from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';

var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
let registerActiveModes = () => {};  // fallback to no-op

var DOMcontainer = null;
let getMode = () => null;
let band = null;
let mode = null;
let entityType = 'L4';
let includeRemote = false;

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
  DOMcontainer.addEventListener('click', (e) => {
	  const v = e.target?.dataset?.value;
	  if (v && "CSL2L4L6".includes(v)) {
		entityType = v;
		refresh();
	  }
  });

}

export function refresh(){
	// Update activeModes for all modes found on this band ONLY
	const bandData = CONNSDATA.connectivity_Band_Mode_HomeCall[band];
	for (const md in bandData) {
        activeModes.add(md);
	}
	// need to add a mode sweep here
	registerActiveModes(activeModes);	
	mode = getMode();
//	includeRemote = (entityType == "L2")
	console.log("Connectivity for ",band, mode);
	let domain = includeRemote? '':'HOME ';
	let HTML = '<h2>'+domain+'Connectivity for ' + band + ' ' + mode +'</h2>';
	let reach = includeRemote? 'to/from/':' ';
	HTML += "Grid axes show active <span class = 'transmit'>transmitting</span>"
	HTML += " and <span class = 'receive'>receiving</span> entities, 'X' shows connectivity "+reach+"within HOME.<br>";
	HTML += "'⇦' = column to row, '⇧' = row to column, 'X' = both<br><br>";
	HTML += "<div style = 'width:fit-content;'>";
	HTML += "<fieldset id='connectivityEntitySelect' class='text-sm'>";
	HTML += "<legend>Entity type</legend>"
	HTML += "<button id='L2' data-value = 'L2' >L2sq</button>";
	HTML += "<button id='L4' data-value = 'L4' >L4sq</button>";
	HTML += "<button id='L6' data-value = 'L6' >L6sq</button>";
	HTML += "<button id='CS' data-value = 'CS' >Call</button>";
	HTML += "</fieldset>"
	HTML += "</div>";
	HTML += html_for_ModeConnectivity(mode)
	DOMcontainer.innerHTML = HTML;
	document.getElementById(entityType).classList.add('active');
	
	
}

function html_for_ModeConnectivity(mode){
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall[band][mode];
    if (!bandModeData) return "";


	let tx_entitiesSet = new Set();
	let rx_entitiesSet = new Set();
	for (const ctx in bandModeData.Tx){
		let etx = getEntity(ctx, entityType);
		tx_entitiesSet.add(etx);
		if(includeRemote){
			for (const rem in bandModeData.Tx[ctx]) {
				let rem_entity = getEntity(rem, entityType);
				rx_entitiesSet.add(rem_entity);
			}
		}
	}
	for (const crx in bandModeData.Rx){
		let erx = getEntity(crx, entityType);
		rx_entitiesSet.add(erx);
		if(includeRemote){
			for (const rem in bandModeData.Rx[crx]) {
				let rem_entity = getEntity(rem, entityType);
				tx_entitiesSet.add(rem_entity);
			}
		}
	}
	
    let rx_entities=Array.from(rx_entitiesSet).toSorted();
    let tx_entities=Array.from(tx_entitiesSet).toSorted();
	if(rx_entities.length < 1 || tx_entities.length < 1) {return ""};
  
  	let entityConns = {};
	for (const ctx in bandModeData.Tx){
		let etx = getEntity(ctx, entityType);
		for (const crx in bandModeData.Rx){
			if(bandModeData.Tx[ctx][crx]) {
				let erx = getEntity(crx, entityType);
				if(!entityConns[etx]) {entityConns[etx]={};}
				entityConns[etx][erx]=1;
			}
		}
	}
  
	let HTML = "<table id='connectivityTable' class='connectivityTable' >";
	// Column headers
	HTML += "<thead><tr><th></th>";
	for (const etx of tx_entities) { // (vertical text fussy on mobile so fake it)
		let vt = [...etx].map(c => '<div style = "margin:0px; padding:0px;">'+c+'</div>').join('');
		HTML += `<th class = 'transmit' style = 'vertical-align:bottom;'>${vt}</th>`;
	}
	HTML += "</tr></thead>"
	
	HTML += "<tbody>";	
	for (const erx of rx_entities) {
		// Row Headers
		HTML += `<tr><th class = 'receive' style = 'text-align:right;'>${erx}</th>`;
		// Cells 
		for (const etx of tx_entities) {
			let txt = '';
			if( entityConns[etx] ){
				txt = (entityConns[etx][erx])? 'X':'';
		    }
		    HTML += "<td class='cell'>"+txt+"</td>";
		}
		HTML += "</tr>";
	}

	HTML += "</tbody></table>";

	return HTML;

}


function getEntity(call,entityType){
  const callsigns_info = CONNSDATA.callsigns_info;
  if(entityType=="CS"){return call;}
  let square = callsigns_info[call].sq;
  if(entityType=="L2"){return square.substring(0,2).toUpperCase();}
  if(entityType=="L4"){return square.substring(0,4).toUpperCase();} 
  if(entityType=="L6"){return square.substring(0,6).toUpperCase();} 
}
