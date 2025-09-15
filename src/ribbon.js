var tStart = Date.now(); // software start time

import {updateMyCall, updateSquaresList} from './config.js';
import {activeModes, hideUnwatchedModeLayers, resetData, callLocations} from './plots.js';
let watchedMode = '';

export var tStart = Date.now();

export function startRibbon(){
	attachInputHandlers();
	setWatchedMode('FT8');
	setInterval(() => updateClock(), 1000);
	setInterval(() => writeModeButtons(), 5000);
}
	
function updateClock() {
	const t = new Date;
	const utc = ("0" + t.getUTCHours()).slice(-2) + ":" + ("0" + t.getUTCMinutes()).slice(-2) + ":" + ("0" + t.getUTCSeconds()).slice(-2);
	const runningmins = Math.trunc(((t - tStart) / 1000) / 60);
	document.getElementById("clock").innerHTML = utc + " UTC";
	document.getElementById("runningMins").innerHTML = runningmins;
	document.getElementById("callsignsInDB").innerHTML = callLocations.size;;
}

function setWatchedMode(mode){
	watchedMode = mode;
	writeModeButtons();
	hideUnwatchedModeLayers(mode);
}
			
function writeModeButtons() {			
	const el = document.getElementById("modeSelectBox");
	el.innerHTML = "<legend>Mode</legend>"; 
	activeModes.forEach((md) => {
		const modeBtn = document.createElement("button");
		modeBtn.type = "button";
		modeBtn.className = "button--mode";
		modeBtn.id = md;
		modeBtn.textContent = md;
		modeBtn.addEventListener('click', () => setWatchedMode(md));
		el.appendChild(modeBtn);
		if (md === watchedMode) {
			modeBtn.classList.add('active');
		}
	});
}
	
function attachInputHandlers() {
	const myCallInput = document.getElementById('myCallInput');
	if (myCallInput) {
		myCallInput.addEventListener('change', () => {
			updateMyCall();
			resetData();
		});
		console.log("Attached 'change' listener to myCallInput")
	} else {
		console.warn('myCallInput not found');
	}

	const homeSquaresInput = document.getElementById('homeSquaresInput');
	if (homeSquaresInput) {
		homeSquaresInput.addEventListener('change', () => {
			updateSquaresList();
			resetData();
		});
		console.log("Attached 'change' listener to homeSquaresInput")
	} else {
		console.warn('homeSquaresInput not found');
	}
}

