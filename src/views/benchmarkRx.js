
import {liveConnsData, callsigns_info} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';
import {graph} from '../views/graphs.js';

var DOMcontainer = null;
let getMode = () => null;
let mode = null;

export function init(container, band, opts = {}) {
    DOMcontainer = container;
  	getMode = opts.getWatchedMode;
	mode = getMode();
	
    refresh(); // first display
}

export function refresh(){
	mode = getMode();
		
	let HTML = ""
	
	HTML +=  '<h2>Rx Benchmarking for ' + mode +'</h2>';
	HTML += "<p class = 'text-sm'>";
	HTML += "This view allows comparison of Rx performance with other callsigns, or between multiple receive configuratons of your own providing";
	HTML += " that they are sending seperate reports to pskreporter (i.e. using different callsigns). ";
	HTML += "</p>";

	HTML += "<p class = 'text-sm'>";
	HTML += "To see comparisons, ensure there is a second callsign in the 'My Callsign(s)' box; either another station's, or your callsign for a secondary Rx. ";
	HTML += "You can also use the special callsign 'ALL_HOME' to see the range of reports for all HOME callsigns.";
	HTML += "</p>";

	HTML += "<p class = 'text-sm'>";
	HTML += "The chart shows all bands for the selected mode where the second callsign is active, but limited to those bands where you're receiving. ";
	HTML += "</p>";

	HTML += "<p class = 'text-sm'>";
	HTML += "This view is still being developed.";
	HTML += "</p>";
	
	HTML += "<p class = 'text-sm'>";	


	
	HTML += "<canvas id='benchmarkGraph' style='width:100%;max-width:700px'></canvas>";
	
	DOMcontainer.innerHTML = HTML;
	
	graph('benchmarkGraph', liveConnsData, getMode(), STORAGE.myCall.split(",").map(s => s.trim()),0,1e30);

}
