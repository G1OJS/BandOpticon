

import {liveConnsData, tx_callsigns_info, rx_callsigns_info} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';


var DOMcontainer = null;
let band = null;
let getMode = () => null;
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

export function init(container, newband, opts = {}) {

	band = newband;
  	getMode = opts.getWatchedMode;
	mode = getMode();
  
  // heuristic to manage *initial* table size 
  let wl = parseInt(wavelength(band));
  console.log("Connectivity for band = ",band, "wl=",wl);
  if(wl>10 && wl<80){ entityTypeRemote = 'L2' ;}
  // -----------------------------------------
  DOMcontainer = container;

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
  
  refresh(); // first display

}

export function refresh(){

	const bandData = liveConnsData[band];
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
	console.log(band,mode);
	const bandModeData = liveConnsData[band][mode];
    if (!bandModeData) return "";

	// convert all active tx and rx calls to entities and add connectivity
	let tx_entities_info = {};
	let rx_entities_info = {};
	let entityConns = new Set();	

	for (const ctx in tx_callsigns_info){
		let etx = getEntity(ctx, tx_callsigns_info[ctx]);
		if(!tx_entities_info[etx.entity]) tx_entities_info[etx.entity] = {inHome:etx.inHome};
		for (const crx in rx_callsigns_info){
			let erx = getEntity(crx, rx_callsigns_info[crx]);
			if(!rx_entities_info[erx.entity]) rx_entities_info[erx.entity] = {inHome:erx.inHome};
			if(bandModeData.Tx[ctx]) {if( bandModeData.Tx[ctx][crx]) {entityConns.add(etx.entity+"-"+erx.entity);} }
			if(bandModeData.Rx[crx]) {if( bandModeData.Rx[crx][ctx]) {entityConns.add(etx.entity+"-"+erx.entity);} }
		}
	}

	//rx_entities_info = Object.entries(rx_entities_info).toSorted();                                              
	//tx_entities_info = Object.entries(tx_entities_info).toSorted(); 
	
	if(rx_entities_info.length < 1 || tx_entities_info.length < 1) {return ""};
  
	let HTML = "<div id='connectivityTableWrapper' class='table-wrapper'><table id='connectivityTable' class='scalingTable' >";
	// Column headers
	HTML += "<thead><th></th>";
	for (const etx of Object.keys(tx_entities_info)) { // (vertical text fussy on mobile so fake it)
		console.log(etx);
		let vt = [...etx].map(c => '<div>'+c+'</div>').join('');
		HTML += "<th class = 'transmit' >"+vt+"</th>";
	}
	HTML += "</thead>"
	
	HTML += "<tbody>";	
	for (const erx of Object.keys(rx_entities_info)) {
		let homeRow = rx_entities_info[erx].inHome;
		// Row Headers
		HTML += "<tr><th class = 'receive rhead' >"+erx+"</th>";
		// Cells 
		for (const etx of Object.keys(tx_entities_info)) {
			let homeColumn =  tx_entities_info[etx].inHome;
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

function getEntity(callsign, callsign_info){
  let entity = callsign;
  let inHome = callsign_info.inHome;
  let entityType = (inHome)? entityTypeHome:entityTypeRemote;

  if(entityType=="L2") {entity = callsign_info.sq.substring(0,2).toUpperCase()}
  if(entityType=="L4") {entity = callsign_info.sq.substring(0,4).toUpperCase()} 
  if(entityType=="L6") {entity = callsign_info.sq.substring(0,6).toUpperCase()} 
  
  return {entity:entity, inHome:inHome}
}
