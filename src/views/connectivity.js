
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
	if(table){
		const scale = wrapper.clientWidth / (table.scrollWidth + 50);
		const finalScale = Math.min(1, Math.max(0.1, scale));
		table.style.transform = `scale(${finalScale})`;	
	}
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
	const callsigns_info = CONNSDATA.callsigns_info;
    if (!bandModeData) return "";

	// list all active tx and rx calls
	let tx_callsSet = new Set();
	let rx_callsSet = new Set();
	for (const ctx in bandModeData.Tx){
		tx_callsSet.add(ctx);
		for (const crx in bandModeData.Tx[ctx]) {rx_callsSet.add(crx);}
	}
	for (const crx in bandModeData.Rx){
		rx_callsSet.add(crx);
		for (const ctx in bandModeData.Rx[crx]) {tx_callsSet.add(ctx);}
	}
	
// experimental "filter home calls to myCalls list" - not looking useful so far
	if(false){
	let myCalls = ['G1OJS','GE1OJS'];
		let todelete = new Set();
		for (const c of rx_callsSet){
			if(callsigns_info[c].inHome){
				if(!(myCalls.includes(c.trim()))) todelete.add(c);
			}
		}
		for (const c of todelete) rx_callsSet.delete(c);
		todelete.clear();
		for (const c of tx_callsSet){		
			if(callsigns_info[c].inHome){
				if(!(myCalls.includes(c.trim()))) todelete.add(c);
			}			
		}
		for (const c of todelete) tx_callsSet.delete(c);
	}
		
	// convert calls to entities and add connectivity
	let tx_entitiesSet = new Set();
	let rx_entitiesSet = new Set();
	let entityConns = new Set();	

	for (const ctx of tx_callsSet){
		let entityType = (callsigns_info[ctx].inHome)? entityTypeHome:entityTypeRemote;
		let etx = getEntity(ctx,entityType);
		tx_entitiesSet.add(etx);
		for (const crx of rx_callsSet){
			let entityType = (callsigns_info[crx].inHome)? entityTypeHome:entityTypeRemote;
			let erx = getEntity(crx,entityType);
			rx_entitiesSet.add(erx);
			if(bandModeData.Tx[ctx]) {if( bandModeData.Tx[ctx][crx]) {entityConns.add(etx+"-"+erx);} }
			if(bandModeData.Rx[crx]) {if( bandModeData.Rx[crx][ctx]) {entityConns.add(etx+"-"+erx);} }
		}
	}
	
	function sortfunc(a,b){
		const aInHome = entityInHome(a);
		const bInHome = entityInHome(b);
		if (aInHome !== bInHome) return aInHome ? -1 : 1;
		return a.localeCompare(b);
	}

	let rx_entities = Array.from(rx_entitiesSet).toSorted((a, b) => sortfunc(a, b));                                              
	let tx_entities = Array.from(tx_entitiesSet).toSorted((a, b) => sortfunc(a, b));                                
	
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
			txt = entityConns.has(etx+"-"+erx)? 'X':'';
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
