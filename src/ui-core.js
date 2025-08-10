// ui-core.js

import Ribbon from './lib/ribbon.js';

// import view definition APIs from various files (file names don't have to match view names, "as" and {} provides a mapping)
import * as Overview from './views/allbands.js'; 
import * as Connectivity from './views/connectivity.js';
import * as CallsActivity from './views/calls_activity.js';
import * as BenchmarkRx from './views/benchmarkRx.js';
import * as AllFileAnalysis from './views/allFileAnalysis.js';

const ribbon = new Ribbon({
  onModeChange: refreshCurrentView,
  onConfigChange: refreshCurrentView,
});

setInterval(() => ribbon.writeModeButtons(), 5000);
setInterval(() => refreshCurrentView(), 5000);

let currentView = null;

// VIEWS is not currently used
const VIEWS = [{v:'overview',s:'flat',l:'Home', i:'🏠'},{v:'connectivity',s:'tabbed', l:'Connectivity', i:''},{v:'callsactivity',s:'tabbed', l:'Callsign Activity', i:''}]


export function loadView(viewName, options = {}) {
	
	const viewMap = {
	  overview: Overview,
	  connectivity: Connectivity,
	  callsactivity: CallsActivity,
	  benchmarkRx: BenchmarkRx,
	  allFileAnalysis: AllFileAnalysis
	};

	const viewFn = viewMap[viewName];
	if (viewFn) {
	  currentView = viewFn;
	} else {
	  console.warn(`Unknown view: ${viewName}`);
	  return;
	}

	let DOMmainView = document.getElementById("mainView");

	// identify the view's clickable band elements & attach method
	DOMmainView.addEventListener('click', (e) => {
	  const bandElem = e.target.closest('[data-band]');
	  if (bandElem) {
		const band = bandElem.dataset.band;
		loadView('connectivity', { band: band });
	  }
	});

	 DOMmainView.innerHTML = "<div id='tabBar'> \
			<button class='tab' data-action='overview'>🏠 Home</button> \
			</div> \
			<div id='mainViewContent'></div>";
	 let DOMcontainer = document.getElementById("mainViewContent");
  
  DOMcontainer.innerHTML = ''; 
  currentView.init(DOMcontainer, {
	  registerActiveModes: ribbon?.registerActiveModes.bind(ribbon),
	  getWatchedMode: ribbon?.getWatchedMode.bind(ribbon),
	  ...options
  });
  
	refreshCurrentView();
}

export function refreshCurrentView() {
  if (currentView && currentView.refresh) {
    currentView.refresh();
  }
}

// for view select buttons 
document.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  loadView(action);
});
