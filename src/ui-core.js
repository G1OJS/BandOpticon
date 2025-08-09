// ui-core.js

import Ribbon from './lib/ribbon.js';

// import view definition APIs from various files (file names don't have to match view names, "as" and {} provides a mapping)
import * as Overview from './views/allbands.js'; 
import * as Connectivity from './views/connectivity.js';
import * as CallsActivity from './views/calls_activity.js';
import * as BenchmarkRx from './views/benchmarkRx.js';

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

  switch (viewName) {					// the name of the view e.g. passed by a click handler
	case 'overview':
	  currentView = Overview;			// the view API function name imported above
	  break;
	case 'connectivity':
		currentView = Connectivity;
	break;
	case 'callsactivity':
		currentView = CallsActivity;
	break;
	case 'benchmarkRx':
		currentView = BenchmarkRx;
	break;
	default:
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
			<button class='tab' data-action='home'>🏠 Home</button> \
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

// for actions buttons 
document.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  if (action === 'home') {
    loadView('overview');
  }
  if (action === 'connectivity') {
    loadView('connectivity');
  }
  if (action === 'benchmarkRx') {
    loadView('benchmarkRx');
  }
  if (action === 'callsactivity') {
    loadView('callsactivity');
  }

});
