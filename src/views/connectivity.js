
import * as CONNSDATA from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';

var activeModes = new Set(); // updated to be relevant to the current view and then passed back to ribbon
let registerActiveModes = () => {};  // fallback to no-op

var DOMcontainer = null;
let getMode = () => null;
let band = null;
let mode = null;
let entityTypeHome = 'L4';
let entityTypeRemote = 'L4';

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
  if(wl>10 && wl<80){ entityTypeRemote = 'L2' ;}
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
	  const id = e.target.id;
	  let grp = id.split('.')[0];
	  let val = id.split('.')[1];
	  if (val && "CSL2L4L6".includes(val)) {
		if(grp == "Home_Entity_Type"){entityTypeHome = val;}
		if(grp == "Remote_Entity_Type"){entityTypeRemote = val;}
		console.log(entityTypeHome, entityTypeRemote);
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
	HTML += "Table headings show active <span class = 'transmit'>transmitting</span>"
	HTML += " and <span class = 'receive'>receiving</span> entities, 'X' shows connectivity. "
	HTML += "Dotted borders surround cells where at least one entity is in HOME (BandOpticon does not gather data unless this is true). ";
	HTML += "Cells are coloured grey if *both* row and column entities are in HOME."
	HTML += "<br><br><b>NOTE</b>: Large tables can result for fine-grained entities!<br>";
	HTML += "</div><br><div style = 'width:max-content;'>";
	HTML += html_buttonGroup('Home Entity Type','float_left',['L2','L4','L6','CS'],['L2sq','L4sq','L6sq','Call']);
	HTML += html_buttonGroup('Remote Entity Type','',['L2','L4','L6','CS'],['L2sq','L4sq','L6sq','Call']);
	HTML += "</div>";
	HTML += html_for_ModeConnectivity(mode);
	DOMcontainer.innerHTML = HTML;
	document.getElementById("Home_Entity_Type."+entityTypeHome).classList.add('active');
	document.getElementById("Remote_Entity_Type."+entityTypeRemote).classList.add('active');
	 
	const table = document.getElementById('connectivityTable');
    const wrapper = document.getElementById('connectivityTableWrapper');
	const scale = wrapper.clientWidth / table.scrollWidth;
    const finalScale = Math.min(1, Math.max(0.1, scale));
    table.style.transform = `scale(${finalScale})`;
		
}

function html_buttonGroup(legend_text, fieldset_class, button_ids, button_text = button_ids, 
	fieldset_id = legend_text.replaceAll(' ','_')){
	let HTML = "";
	HTML += "<fieldset id='"+fieldset_id+"' class='"+fieldset_class+"'>";
	HTML += "<legend>"+legend_text+"</legend>"
	for (const idx in button_ids) {
		HTML += "<button id='"+fieldset_id+"."+button_ids[idx].replaceAll(' ','_')+"' >"+button_text[idx]+"</button>";
	}
	HTML += "</fieldset>"	
	return HTML
}


function html_for_ModeConnectivity(mode){
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall[band][mode];
    if (!bandModeData) return "";

	let tx_entitiesSet = new Set();
	let rx_entitiesSet = new Set();
	let entityConns = {};
	// add home tx and rx
	for (const ctx in bandModeData.Tx){
		let etx = getEntity(ctx, entityTypeHome);
		tx_entitiesSet.add(etx);
	}
	for (const crx in bandModeData.Rx){
		let erx = getEntity(crx, entityTypeHome);
		rx_entitiesSet.add(erx);
	}
	
	// add non-Home tx and rx, checking first if the entity 
	// is already represented using the entityTypeHome bucket. However,
	// this filter isn't preventing spots appearing under both home and remote buckets - not sure if that matters ..
	for (const ctx in bandModeData.Tx){
		let etx = getEntity(ctx, entityTypeHome);
		if(!tx_entitiesSet[etx]){
			for (const rem in bandModeData.Tx[ctx]) {
				let rem_entity = getEntity(rem, entityTypeRemote);
				rx_entitiesSet.add(rem_entity);
				if(!entityConns[etx]) {entityConns[etx]={};}
				entityConns[etx][rem_entity]=1;
			}
		}
	}
	for (const crx in bandModeData.Rx){
		let erx = getEntity(crx, entityTypeHome);
		if(!rx_entitiesSet[erx]){
			for (const rem in bandModeData.Rx[crx]) {
				let rem_entity = getEntity(rem, entityTypeRemote);
				tx_entitiesSet.add(rem_entity);
				if(!entityConns[rem_entity]) {entityConns[rem_entity]={};}
				entityConns[rem_entity][erx]=1;
			}
		}
	}
	
    let rx_entities=Array.from(rx_entitiesSet).toSorted();
    let tx_entities=Array.from(tx_entitiesSet).toSorted();
	if(rx_entities.length < 1 || tx_entities.length < 1) {return ""};
  
	let HTML = "<div id='connectivityTableWrapper' class='table-wrapper'><table id='connectivityTable' class='scalingTable' >";
	// Column headers
	HTML += "<thead><th></th>";
	for (const etx of tx_entities) { // (vertical text fussy on mobile so fake it)
		let vt = [...etx].map(c => '<div>'+c+'</div>').join('');
		HTML += "<th class = 'transmit' >"+vt+"</th>";
	}
	HTML += "</thead>"
	
	HTML += "<tbody>";	
	for (const erx of rx_entities) {
		let homeRow = entityInHome(erx);
		// Row Headers
		HTML += "<tr><th class = 'receive rhead' >"+erx+"</th>";
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

	HTML += "</tbody></table></div>";

	return HTML;

}

function entityInHome(entity){
	// entity is either a square (string) or a callsign_info record with a .inHome flag 
	const callsigns_info = CONNSDATA.callsigns_info;
	let inHome = false;

	if(callsigns_info[entity]) {
		inHome = inHome || callsigns_info[entity].inHome;
	}
	inHome = inHome || squareIsInHome(entity);
	
	return inHome
}

function getEntity(call,entityType){
  const callsigns_info = CONNSDATA.callsigns_info;
  if(entityType=="CS"){return call;}
  let square = callsigns_info[call].sq;
  if(entityType=="L2"){return square.substring(0,2).toUpperCase();}
  if(entityType=="L4"){return square.substring(0,4).toUpperCase();} 
  if(entityType=="L6"){return square.substring(0,6).toUpperCase();} 
}
