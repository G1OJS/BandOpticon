var tStart = Date.now(); // software start time

import * as STORAGE from './store-cfg.js';
import {countAllTimestamps} from './conns-data.js'

// ribbon HTML elements expected:
// clock, runningMins, connectionsIn, modeSelectBox
// myCallInput, homeSquaresInput, purgeMinutesInput

// functions needed in ui.js:
// onModeChange(), onConfigChange()


export default class Ribbon {
	
	constructor({ onModeChange, onConfigChange } = {}) {
		this.onModeChange = onModeChange || (() => {});
		this.onConfigChange = onConfigChange || (() => {});
		this.tStart = Date.now();
		this.watchedMode = "FT8";
		this.activeModes = new Set(this.watchedMode);
		this.attachInputHandlers();
		setInterval(() => this.updateClock(), 1000);
	}

	getWatchedMode() {
	  return this.watchedMode;
	}
	
	updateClock() {
		const t = new Date;
		const utc = ("0" + t.getUTCHours()).slice(-2) + ":" + ("0" + t.getUTCMinutes()).slice(-2) + ":" + ("0" + t.getUTCSeconds()).slice(-2);
		const runningmins = Math.trunc(((t - tStart) / 1000) / 60);
		document.getElementById("clock").innerHTML = utc + " UTC";
		document.getElementById("runningMins").innerHTML = runningmins;
		document.getElementById("connectionsIn").innerHTML = countAllTimestamps();
	}

	writeModeButtons() {
		const el = document.getElementById("modeSelectBox");
		el.innerHTML = "<legend>Mode</legend>"; 
		this.activeModes.forEach((md) => {
			const modeBtn = document.createElement("button");
			modeBtn.type = "button";
			modeBtn.className = "button--mode";
			modeBtn.id = md;
			modeBtn.textContent = md;
			modeBtn.addEventListener('click', () => this.setMode(md));
			el.appendChild(modeBtn);

			if (md === this.watchedMode) {
				modeBtn.classList.add('active');
			}
		});
	}

	setMode(mode) {
		this.watchedMode = mode;
		this.onModeChange(this.watchedMode);
		this.writeModeButtons();
	}

	registerActiveModes(modeList) {
		this.activeModes = new Set(modeList);
		this.writeModeButtons();
		//console.log("ribbon: register active modes",this.activeModes);
	}

	attachInputHandlers() {
		const myCallInput = document.getElementById('myCallInput');
		if (myCallInput) {
			myCallInput.addEventListener('change', () => {
				STORAGE.updateMyCall();
				this.onConfigChange();
			});
			console.log("Attached 'change' listener to myCallInput")
		} else {
			console.warn('myCallInput not found');
		}

		const homeSquaresInput = document.getElementById('homeSquaresInput');
		if (homeSquaresInput) {
			homeSquaresInput.addEventListener('change', () => {
				STORAGE.updateSquaresList();
				this.onConfigChange();
			});
			console.log("Attached 'change' listener to homeSquaresInput")
		} else {
			console.warn('homeSquaresInput not found');
		}

		const purgeMinutesInput = document.getElementById('purgeMinutesInput');
		if (purgeMinutesInput) {
			purgeMinutesInput.addEventListener('change', () => {
				STORAGE.updatePurgeMins();
				this.onConfigChange();
			});
			console.log("Attached 'change' listener to purgeMinutesInput")
		} else {
			console.warn('purgeMinutesInput not found');
		}
	}
}
