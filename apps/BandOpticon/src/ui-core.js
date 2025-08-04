// ui-core.js

import Ribbon from '/src/app/ribbon.js';

import * as Benchmark from './views/benchmark.js';
import * as Connectivity from './views/connectivity.js';


const ribbon = new Ribbon({
  onModeChange: refreshCurrentView,
  onConfigChange: refreshCurrentView,
  onViewSelect: loadView
});

setInterval(() => ribbon.writeModeButtons(), 5000);
setInterval(() => refreshCurrentView(), 5000);

let currentView = null;
let currentViewName = null;
const viewHistory = [];

export function loadView(viewName, options = {}) {
  if (currentViewName) {
    viewHistory.push(currentViewName);
  }

  switch (viewName) {
    case 'benchmark':
      currentView = Benchmark;
      currentViewName = viewName;
      break;
	case 'connectivity':
		currentView = Connectivity;
		currentViewName = viewName;
    break;
    default:
      console.warn(`Unknown view: ${viewName}`);
      return;
  }
  
  // tell the view what its DOM and ribbon references are:
  const DOMcontainer = document.getElementById('mainContent'); 
  DOMcontainer.innerHTML = '';  // Clear existing DOMcontainer
  currentView.init(DOMcontainer, {
      registerActiveModes: ribbon?.registerActiveModes.bind(ribbon),
      getWatchedMode: ribbon?.getWatchedMode.bind(ribbon),
	  ...options
    });
	
  updateBackButton();
}

export function refreshCurrentView() {
  if (currentView && currentView.refresh) {
    currentView.refresh();
  }
}

export function goBack() {
  const previous = viewHistory.pop();
  if (previous) loadView(previous);
}

// identify the view's clickable band elements & attach method
document.getElementById('mainContent').addEventListener('click', (e) => {
  const bandElem = e.target.closest('[data-band]');
  if (bandElem) {
    const band = bandElem.dataset.band;
    loadView('connectivity', { band: band });
  }
});


// view back button handler
const backButton = document.getElementById('backButton');
console.log('backButton:', backButton);
function updateBackButton() {
  backButton.disabled = viewHistory.length === 0;
  console.log("View history", viewHistory);
}
backButton.addEventListener('click', () => {
  goBack();
  updateBackButton();
});
