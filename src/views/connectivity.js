
import * as CONNSDATA from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';

var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
let registerActiveModes = () => {};  // fallback to no-op

var DOMcontainer = null;
let getMode = () => null;
let band = null;
let mode = null;
let entityType = 'L4';

// duplicated from allbands.js but should not be needed when separate entity types available for home/remote
function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}

export function init(container, opts = {}) {
  band = opts.band || band;  // if opts.band is null, leave band alone
  

  // heuristic to manage *initial* table size until separate entity types available for home/remote
  let wl = parseInt(wavelength(band));
  console.log("Connectivity for band = ",band, "wl=",wl);
  if(wl>10 && wl<80){ entityType = 'L2' ;}
  // -----------------------------------------
  DOMcontainer = container;
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
	console.log("Connectivity for ",band, mode);
	let HTML = '<h2>Connectivity for ' + band + ' ' + mode +'</h2>';
	HTML += "<div class = 'text-sm'>";
	HTML += "Grid axes show active <span class = 'transmit'>transmitting</span>"
	HTML += " and <span class = 'receive'>receiving</span> entities, 'X' shows connectivity. "
	HTML += "Dotted borders surround cells where at least one *entity* is in HOME (BandOpticon does not gather data unless this is true). ";
	HTML += "Cells are coloured grey if *both* row and column *entities* are in HOME.<br><b>NOTE</b>: this view is being developed. Next steps include potentially "
	HTML += "allowing different entity types for HOME and remote. Large tables can result for fine-grained entities!<br>";
	HTML += "</div><br><div style = 'width:fit-content;'>";
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
	let includeRemote = true;

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
		for (const crx in bandModeData.Tx[ctx]) {
			let erx = getEntity(crx, entityType);
			if(!entityConns[etx]) {entityConns[etx]={};}
			entityConns[etx][erx]=1;
		}
	}
	for (const crx in bandModeData.Rx){
		let erx = getEntity(crx, entityType);
		for (const ctx in bandModeData.Rx[crx]) {
			let etx = getEntity(ctx, entityType);
			if(!entityConns[etx]) {entityConns[etx]={};}
			entityConns[etx][erx]=1;
		}
	}

	let HTML = "<table id='connectivityTable' class='connectivityTable' >";
	// Column headers
	HTML += "<thead><tr><th></th>";
	for (const etx of tx_entities) { // (vertical text fussy on mobile so fake it)
		let vt = [...etx].map(c => '<div>'+c+'</div>').join('');
		HTML += "<th class = 'transmit' >"+vt+"</th>";
	}
	HTML += "</tr></thead>"
	
	HTML += "<tbody>";	
	for (const erx of rx_entities) {
		let homeRow = entityInHome(erx);
		// Row Headers
		HTML += "<tr><th class = 'receive' >"+erx+"</th>";
		// Cells 
		for (const etx of tx_entities) {
			let homeColumn =  entityInHome(etx);
			let txt = '';
			let cellStyle = (homeRow && homeColumn)? "background-color: lightgrey;": "";
			cellStyle += (homeRow || homeColumn)? " border: 1px dotted gray; ": "";
			if( entityConns[etx] ){
				txt = (entityConns[etx][erx])? 'X':'';
		    }
		    HTML += "<td style='" + cellStyle + "'>" + txt + "</td>" ;
		}
		HTML += "</tr>";
	}

	HTML += "</tbody></table>";

	return HTML;

}

function entityInHome(entity){
	if(entityType == "CS"){
		const callsigns_info = CONNSDATA.callsigns_info;
		return callsigns_info[entity].inHome;
	} else {
		return squareIsInHome(entity);
	}
}

function getEntity(call,entityType){
  const callsigns_info = CONNSDATA.callsigns_info;
  if(entityType=="CS"){return call;}
  let square = callsigns_info[call].sq;
  if(entityType=="L2"){return square.substring(0,2).toUpperCase();}
  if(entityType=="L4"){return square.substring(0,4).toUpperCase();} 
  if(entityType=="L6"){return square.substring(0,6).toUpperCase();} 
}
