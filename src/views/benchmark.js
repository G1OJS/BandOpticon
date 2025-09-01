
import {liveConnsData, rx_callsigns_info, tx_callsigns_info, updateLeaderInfo} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';
import {snr_graph} from '../views/graphs.js';

let DOMcontainer = null;
let getMode = () => null;
let mode = null;
let band = null;
let winnerCall = null;
let connsData = null;
let callsigns_info = null;
let title_stub = null;
let myCall1 = null;
let myCall2 = null;
let viewName = null;

export function init(setviewName, container, setband, opts = {}) {
	viewName = setviewName;
    myCall1 = STORAGE.myCall.split(",")[0].trim();
    myCall2 = STORAGE.myCall.split(",")[1]?.trim();
    DOMcontainer = container;
  	getMode = opts.getWatchedMode;
	winnerCall = opts.winnerCall;
	mode = getMode();
	band = setband;
	title_stub = myCall1 + " " + ( (viewName=="benchmarkRx")? "receive" : "transmit" ) + " performance ";
    refresh(); // first display
}

export function refresh(){
	mode = getMode();
	connsData = (viewName=="benchmarkRx")? liveConnsData[band][mode]?.Rx : liveConnsData[band][mode]?.Tx;
	callsigns_info = (viewName=="benchmarkRx")? rx_callsigns_info : tx_callsigns_info;

	let leader_home = updateLeaderInfo(connsData, callsigns_info);
	console.log(leader_home);
	
	let HTML = ""
	let stub = (viewName=="benchmarkRx")? "Receive": "Transmit";
	HTML +=  '<h2>'+stub+' benchmarking for ' + band + ' ' + mode +'</h2>';
	HTML += "<p class = 'text-sm'>";
	HTML += "This view shows the snr of your spots compared with:";
	HTML += "<ul><li>All home callsigns as a group</li><li>The home callsign spoted by the greatest number of callsigns</li><li>The callsign specified afer your callsign in My Callsign(s) (comma separated)</li></ul>";
	HTML += "</p>";
	HTML += "<p class = 'text-sm'>";
	HTML += "This view is still being developed.";
	HTML += "</p>";
	
	HTML += "<p class = 'text-sm'>";
	HTML += "<div class = 'hidden'><h3>" + title_stub + "vs "+ myCall2+"</h3><canvas id='meVsOther' style='width:100%;max-width:700px'></canvas><br></div>";
	HTML += "<div class = 'hidden'><h3>" + title_stub + "vs home callsign with most spots (" + leader_home + ")</h3><canvas id='meVsBest' style='width:100%;max-width:700px'></canvas><br></div>";
	HTML += "<div class = 'hidden'><h3>" + title_stub + "vs home aggregate</h3><canvas id='meVsAll' style='width:100%;max-width:700px'></canvas><br></div>";
	
	DOMcontainer.innerHTML = HTML;
	
	snr_graph('meVsAll', connsData, myCall1, 'ALL_HOME' ,0, 1e30);	
	snr_graph('meVsBest', connsData, myCall1, 'LEADER_HOME' ,0, 1e30);
	if(myCall2){ snr_graph('meVsOther', connsData, myCall1, myCall2,0, 1e30); }

}
