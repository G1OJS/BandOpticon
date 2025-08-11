
import {liveConnsData, callsigns_info} from '../lib/conns-data.js';
import * as STORAGE from '../lib/store-cfg.js';
import {squareIsInHome} from '../lib/geo.js';
import {graph1} from '../views/common.js';

var DOMcontainer = null;
let getMode = () => null;
let mode = null;

export function init(container, band, opts = {}) {
    DOMcontainer = container;
  	getMode = opts.getWatchedMode;
	mode = getMode();
	mode = getMode();
	
	let HTML = ""
	HTML +=  '<h2>Rx Benchmarking for ' + mode +'</h2>';
	HTML += "<div class = 'text-sm'>";
	HTML += "This is a new view (still being developed) showing the latest report from each of 'My Callsigns' for each transmitting callsign heard. "
	HTML += "Note that pskreporter only re-issues a report for a spot if 20 minutes have elapesed from the previous spot. "
	HTML += "The view allows comparison of Rx performance with other callsigns, or between multiple receive configuratons providing seperate reports to pskreporter."
	HTML += "</div><br>";
	
	HTML += "<canvas id='graph1' style='width:100%;max-width:700px'></canvas>"
	DOMcontainer.innerHTML = HTML;
	

	
    refresh(); // first display
}

export function refresh(){

	graph1('graph1', liveConnsData, mode, STORAGE.myCall.split(",").map(s => s.trim()));

}

