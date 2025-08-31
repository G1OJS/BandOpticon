
import {liveConnsData} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';
import {snr_graph} from '../views/graphs.js';

var DOMcontainer = null;
let getMode = () => null;
let mode = null;
let band = null;

export function init(container, setband, opts = {}) {
    DOMcontainer = container;
  	getMode = opts.getWatchedMode;
	mode = getMode();
	band = setband;
	
    refresh(); // first display
}

export function refresh(){
	mode = getMode();
		
	let HTML = ""
	
	HTML +=  '<h2>Rx Benchmarking for ' + band + ' ' + mode +'</h2>';
	HTML += "<p class = 'text-sm'>";
	HTML += "This view shows the snr of your Rx spots and the range of snrs of the Rx spots of the other receivers in HOME";
	HTML += "";
	HTML += "</p>";

	HTML += "<p class = 'text-sm'>";
	HTML += "";
	HTML += "";
	HTML += "</p>";

	HTML += "<p class = 'text-sm'>";
	HTML += "This view is still being developed.";
	HTML += "</p>";
	
	HTML += "<p class = 'text-sm'>";		
	HTML += "<canvas class = 'hidden' id='meVsOther' style='width:100%;max-width:700px'></canvas><BR><BR>";
	HTML += "<canvas class = 'hidden' id='meVsBest' style='width:100%;max-width:700px'></canvas><BR><BR>";
	HTML += "<canvas class = 'hidden' id='meVsAll' style='width:100%;max-width:700px'></canvas><BR><BR>";
	
	DOMcontainer.innerHTML = HTML;
	
	let myCall = STORAGE.myCall.split(",")[0].trim();
	snr_graph('meVsAll', liveConnsData, band, mode, myCall, 'ALL_HOME' ,0,1e30);

	if(STORAGE.myCall.split(",")[1]){
		let otherCall = STORAGE.myCall.split(",")[1].trim();
		snr_graph('meVsOther', liveConnsData, band, mode, myCall, otherCall ,0,1e30);	
	}

}
