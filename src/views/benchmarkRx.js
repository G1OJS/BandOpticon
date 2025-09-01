
import {liveConnsData, rx_callsigns_info, updateLeaderInfo} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';
import {snr_graph} from '../views/graphs.js';

var DOMcontainer = null;
let getMode = () => null;
let mode = null;
let band = null;
let winnerCall = null;

export function init(container, setband, opts = {}) {
    DOMcontainer = container;
  	getMode = opts.getWatchedMode;
	winnerCall = opts.winnerCall;
	
	mode = getMode();
	band = setband;
	
    refresh(); // first display
}

export function refresh(){
	mode = getMode();
	let myCall = STORAGE.myCall.split(",")[0].trim();
	let myCall2 = STORAGE.myCall.split(",")[1]?.trim();
	let leader_home = updateLeaderInfo(liveConnsData[band][mode].Rx, rx_callsigns_info);
		
	let HTML = ""
	
	HTML +=  '<h2>Rx Benchmarking for ' + band + ' ' + mode +'</h2>';
	HTML += "<p class = 'text-sm'>";
	HTML += "This view shows the snr of your Rx spots compared with:";
	HTML += "<ul><li>All home callsigns as an aggregate receiver</li><li>The home callsign with the most Rx spots</li><li>The callsign specified afer your callsign in My Callsign(s) (comma separated)</li></ul>";
	HTML += "</p>";
	HTML += "<p class = 'text-sm'>";
	HTML += "This view is still being developed.";
	HTML += "</p>";
	
	HTML += "<p class = 'text-sm'>";		
	HTML += "<div class = 'hidden'><h3>Benchmarking vs specified callsign</h3><canvas id='meVsOther' style='width:100%;max-width:700px'></canvas><br></div>";
	HTML += "<div class = 'hidden'><h3>Benchmarking vs home callsign with most spots (" + leader_home + ")</h3><canvas id='meVsBest' style='width:100%;max-width:700px'></canvas><br></div>";
	HTML += "<div class = 'hidden'><h3>Benchmarking vs home aggregate</h3><canvas id='meVsAll' style='width:100%;max-width:700px'></canvas><br></div>";
	
	DOMcontainer.innerHTML = HTML;
	
	snr_graph('meVsAll', liveConnsData, band, mode, myCall, 'ALL_HOME' ,0,1e30);	
	snr_graph('meVsBest', liveConnsData, band, mode, myCall, 'LEADER_HOME' ,0,1e30);
	if(myCall2){ snr_graph('meVsOther', liveConnsData, band, mode, myCall, myCall2 ,0,1e30); }

}
