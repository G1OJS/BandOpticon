// ui-core.js

import Ribbon from './lib/ribbon.js';

// import view definition APIs from various files (file names don't have to match view names, "as" and {} provides a mapping)
import * as Overview from './src/views/allbands.js'; 
import * as Connectivity from './src/views/connectivity.js';
import * as CallsActivity from './src/views/calls_activity.js';

const ribbon = new Ribbon({
  onModeChange: refreshCurrentView,
  onConfigChange: refreshCurrentView,
});

setInterval(() => ribbon.writeModeButtons(), 5000);
setInterval(() => refreshCurrentView(), 5000);

let currentView = null;
const DOMcontainer_flat = document.getElementById("overviewContainer")
const DOMcontainer_tabbed = document.getElementById("tabInterface");
let DOMcontainer = DOMcontainer_flat;

const VIEWS = [{v:'overview',s:'flat',l:'Home', i:'🏠'},{v:'connectivity',s:'tabbed', l:'Connectivity', i:''},{v:'callsactivity',s:'tabbed', l:'Callsign Activity', i:''}]

// flat views for all band views, click a band for a tabbed selection of single-band views 
export function loadView(viewName, options = {}) {

  let viewType = "flat";
  switch (viewName) {					// the name of the view e.g. passed by a click handler
	case 'overview':
	  currentView = Overview;			// the view API function name imported above
	  viewType = "flat";				// determines which bit of HTML is activated (display:block or none)
	  break;
	case 'connectivity':
		currentView = Connectivity;
		viewType = "tabbed";
	break;
	case 'callsactivity':
		currentView = CallsActivity;
		viewType = "flat";
	break;
	default:
	  console.warn(`Unknown view: ${viewName}`);
	  return;
  }
  
  // make either flat or tabbed (with tab buttons) HTML visible 
  // and tell the view what its DOM and ribbon references are:
  if(viewType == "flat"){
		DOMcontainer_flat.style.display = "block";
		DOMcontainer_tabbed.style.display = "none";
		DOMcontainer = DOMcontainer_flat;
		// identify the view's clickable band elements & attach method
		DOMcontainer_flat.addEventListener('click', (e) => {
		  const bandElem = e.target.closest('[data-band]');
		  if (bandElem) {
			const band = bandElem.dataset.band;
			loadView('connectivity', { band: band });
		  }
		});
  } else {
	  DOMcontainer_flat.style.display = "none";
	  DOMcontainer_tabbed.style.display = "block";
	  DOMcontainer_tabbed.innerHTML = "<div id='tabBar'> \
				<button class='tab' data-action='home'>🏠 Home</button> \
			</div> \
			<div id='tabContent'></div>";
	  DOMcontainer = document.getElementById("tabContent");
  }
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

// Tabbed view tab handlers - listen for button clicks and 
// just use the loader above to load the correct view
const tabButtons = document.querySelectorAll("#tabBar .tab");
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    loadView(view, { band: null }); // I think let's not pass band here, let ribbon hold band state alongside mode & then calls are simpler
    updateTabHighlight(view);
  });
});
function updateTabHighlight(activeView) {
  tabButtons.forEach(btn => {
    if (btn.dataset.view === activeView) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}


// for actions buttons including view tabs
document.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  if (action === 'connectivity') {
    loadView('connectivity');
  }
  if (action === 'home') {
    loadView('overview');
  }

  if (action === 'callsactivity') {
    loadView('callsactivity');
  }

});
