
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
	mode = getMode();
	
    refresh(); // first display
}

export function refresh(){
	let HTML = ""
	HTML +=  '<h2>Rx Benchmarking for ' + mode +'</h2>';
	HTML += "<div class = 'text-sm'>";
	HTML += "This is a new view (still being developed) showing the best recent report from each of 'My Callsigns' for each transmitting callsign heard. ";
	HTML += "Note that pskreporter only re-issues a report for a spot if 20 minutes have elapesed from the previous spot. ";
	HTML += "The view allows comparison of Rx performance with other callsigns, or between multiple receive configuratons providing seperate reports to pskreporter. ";
	HTML += "<br><strong>To see comparisons, enter additional callsigns in the 'My Callsign(s)' box above - either another station's, or your callsign for a secondary Rx.</strong>";
	HTML += "</div><br>";
	
	HTML += "<canvas id='benchmarkGraph' style='width:100%;max-width:700px'></canvas>";
	
		HTML += "<br><h3>To Do:</h3><ul>";
		HTML += "<li>Add distance / bearing / options</li>";
		HTML += "</ul>";
	
	DOMcontainer.innerHTML = HTML;
	
	graph('benchmarkGraph', liveConnsData, getMode(), STORAGE.myCall.split(",").map(s => s.trim()),0,1e30);

}
