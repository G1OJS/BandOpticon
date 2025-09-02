// ui-core.js

// import view definition APIs from various files (file names don't have to match view names, "as" and {} provides a mapping)
import * as bandsOverview from './views/bandsOverview.js'; 
import * as benchmark from './views/benchmark.js';
import {purgeLiveConnections} from './lib/conns-data.js';

// Ribbon scrapes for active modes, has getter for watched mode, and calls here with changes
import Ribbon from './lib/ribbon.js';

const ribbon = new Ribbon({
  onModeChange: refreshCurrentView,
  onConfigChange: refreshCurrentView,
});

setInterval(() => purgeLiveConnections(), 5000);
setInterval(() => ribbon.writeModeButtons(), 5000);
setInterval(() => refreshCurrentView(), 5000);

let currentView = null;
let band = null;

export function loadView(viewName, setband) {
	band = setband;
	
	// all views live in the 'mainView' div
	let DOMmainView = document.getElementById("mainView");

	// write common HTML for all views (home button and 'mainViewContent')
	let HTML = "";
	if(viewName != 'bandsOverview'){ 
		HTML += "<div> <button class='tab' data-action='bandsOverview'>🏠 Home</button> </div>";
	}
	HTML += "<div id='mainViewContent'></div>";
	DOMmainView.innerHTML = HTML;
	
	// clear 'mainViewContent' and load the view. DOMconatiner passed here incase new views
	// need a specific structure
	let DOMcontainer = document.getElementById("mainViewContent");
    DOMcontainer.innerHTML = ''; 
	
	ribbon.registerActiveModes(band); // just for visual loading the mode buttons
	
	const viewMap = { // is this map even necessary?
	  bandsOverview: bandsOverview,
	  benchmark: benchmark,
	};

	console.log("ui-core: Loading view ",viewName, "for band ", band);
	currentView = viewMap[viewName];
	currentView.init(DOMcontainer, band, {getWatchedMode: ribbon?.getWatchedMode.bind(ribbon)});

	refreshCurrentView(); // in case we arrived here from Home button click: content will have been erased above
}


export function refreshCurrentView() {
	ribbon.registerActiveModes(band);
	console.log("ui-core: RefreshCurrentView:");
    currentView.refresh();
}

// event listeners for buttons 
document.addEventListener('click', (e) => {
	const action = e.target.dataset.action;
	if (!action) return;
	loadView(action,  e.target.dataset.band);
//	console.log("ui-core: clicked with action "+e.target.dataset.action+" and band "+e.target.dataset.band);
});