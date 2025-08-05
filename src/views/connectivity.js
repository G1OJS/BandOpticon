
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
	console.log("Connectivity for ",band, mode);
	let HTML = '<h2>HOME Connectivity for ' + band + ' ' + mode +'</h2>';
	HTML += "cr = column to row, rc = row to column, * = both<br><br>";
	HTML += "<button id='L2' data-value = 'L2' >L2</button>";
	HTML += "<button id='L4' data-value = 'L4' >L4</button>";
	HTML += "<button id='L6' data-value = 'L6' >L6</button>";
	HTML += "<button id='CS' data-value = 'CS' >CS</button>";
	HTML += "<br>";
	HTML += html_for_ModeConnectivity(mode)
	DOMcontainer.innerHTML = HTML;
	document.getElementById(entityType).classList.add('active');
}

function html_for_ModeConnectivity(mode){
	const bandModeData = CONNSDATA.connectivity_Band_Mode_HomeCall[band][mode];
    if (!bandModeData) return "";

	let entityConns = {};
	let entitiesSet = new Set();
	for (const ctx in bandModeData.Tx){
		let etx = getEntity(ctx, entityType);
		entitiesSet.add(etx);
		if(!entityConns[etx]) {entityConns[etx]={};}
		for (const crx in bandModeData.Rx) {
			let erx = getEntity(crx, entityType);
			entitiesSet.add(erx);
			if(crx in bandModeData.Tx[ctx]){
				entityConns[etx][erx]=1;  
			}
		}	
	}
	
	if (includeRemote) {
		for (const ctx in bandModeData.Tx){
			let etx = getEntity(ctx, entityType);
			for (const c in bandModeData.Tx[ctx]){
				let erx = getEntity(c, entityType);
				entitiesSet.add(erx);
				if(!entityConns[etx]) entityConns[etx]={};
				entityConns[etx][erx]=1; 
			}
		}	
		for (const crx in bandModeData.Rx){
			let erx = getEntity(crx, entityType);
			for (const c in bandModeData.Rx[crx]){
				let etx = getEntity(c, entityType);
				entitiesSet.add(etx);
				if(!entityConns[erx]) entityConns[erx]={};
				entityConns[erx][etx]=1; 
			}
		}	
	}
	
  
    let entities=Array.from(entitiesSet).toSorted();
	if(entities.length < 1) {return ""};
  
  
	let HTML = "<table id='connectivityTable' class='connectivityTable' >";
	// Column headers
	HTML += "<thead><tr><th></th>";
	for (const etx of entities) { // (vertical text fussy on mobile so fake it)
		let vt = [...etx].map(c => '<span>'+c+'<span>').join('<br>');
		HTML += `<th>${vt}</th>`;
	}
	HTML += "</tr></thead>"
	
	HTML += "<tbody>";	
	for (const er of entities) {
		// Row Headers
		HTML += `<tr><th>${er}</th>`;
		// Cells 
		for (const et of entities) {
		  let txt = "";
		  let f=0;
		  let r=0;
		  if( entityConns[et] ){
			f = entityConns[et][er];
		  }
		  if( entityConns[er] ){
			r = entityConns[er][et];
		  }
		  if(f && r){txt='*';}
		  if(f && !r){txt='cr';}
		  if(r && !f){txt='rc';}
		  HTML += "<td class = 'cell'>"+txt+"</td>";
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
  if(entityType=="L2"){return square.substring(0,2);}
  if(entityType=="L4"){return square.substring(0,4);} 
  if(entityType=="L6"){return square.substring(0,6);} 
}
