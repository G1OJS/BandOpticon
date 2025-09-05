var tStart = Date.now(); // software start time

import {updateMyCall, updateSquaresList, updatePurgeMins} from './store-cfg.js';
import {liveConnsData, countAllConnections} from './conns-data.js';

// ribbon HTML elements expected:
// clock, runningMins, connectionsIn, modeSelectBox
// myCallInput, homeSquaresInput, purgeMinutesInput

// functions needed in ui.js:
// onModeChange(), onConfigChange()

export default class Ribbon {
	
	constructor({onBandsChange, onModeChange, onConfigChange } = {}) {
		this.onBandsChange = onBandsChange || (() => {});
		this.onModeChange = onModeChange || (() => {});
		this.onConfigChange = onConfigChange || (() => {});
		this.tStart = Date.now();
		this.activeBands = new Set(["20m"]);
		this.watchedBands = new Set(["20m"]);
		this.activeModes = new Set();
		this.watchedMode = "FT8";
		this.attachInputHandlers();
		setInterval(() => this.updateClock(), 1000);
	}
	
	updateClock() {
		const t = new Date;
		const utc = ("0" + t.getUTCHours()).slice(-2) + ":" + ("0" + t.getUTCMinutes()).slice(-2) + ":" + ("0" + t.getUTCSeconds()).slice(-2);
		const runningmins = Math.trunc(((t - tStart) / 1000) / 60);
		document.getElementById("clock").innerHTML = utc + " UTC";
		document.getElementById("runningMins").innerHTML = runningmins;
		document.getElementById("connectionsIn").innerHTML = countAllConnections();
	}

	setMode(mode) {
		this.watchedMode = mode;
		this.onModeChange(this.watchedMode);
		this.writeModeButtons();
	}
	
	toggleBand(band) {
		console.log(this.watchedBands);
		if (this.watchedBands.has(band)){
			if(this.watchedBands.size > 1) this.watchedBands.delete(band);
		} else {
			this.watchedBands.add(band);
		}
		this.onBandsChange(this.watchedBands);
		this.writeModeButtons();
	}
	
	getWatchedMode() {
	  return this.watchedMode;
	}
	
	getActiveBands() {
	  return this.activeBands;
	}
	
	getWatchedBands() {
	  return this.watchedBands;
	}	
	registerActiveBandsAndModes() {
		if(!liveConnsData){return}
		
		this.activeBands = new Set();
		for (const band in liveConnsData){
			this.activeBands.add(band);
		}
	//	this.writeBandButtons();
		
		this.activeModes = new Set()
		for (const band of this.watchedBands) {
			for (const md in liveConnsData[band]) {
				this.activeModes.add(md);
			}
		}
		this.writeModeButtons();
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
	
	writeBandButtons() {
		const el = document.getElementById("bandsSelectBox");
		el.innerHTML = "<legend>Bands</legend>"; 
		this.activeBands.forEach((b) => {
			const bandBtn = document.createElement("button");
			bandBtn.type = "button";
			bandBtn.className = "button--band";
			bandBtn.id = b;
			bandBtn.textContent = b;
			bandBtn.addEventListener('click', () => this.toggleBand(b));
			el.appendChild(bandBtn);

			if (this.watchedBands.has(b)) {
				bandBtn.classList.add('active');
			}
		});
	}

	attachInputHandlers() {
		const myCallInput = document.getElementById('myCallInput');
		if (myCallInput) {
			myCallInput.addEventListener('change', () => {
				updateMyCall();
				this.onConfigChange();
			});
			console.log("Attached 'change' listener to myCallInput")
		} else {
			console.warn('myCallInput not found');
		}

		const homeSquaresInput = document.getElementById('homeSquaresInput');
		if (homeSquaresInput) {
			homeSquaresInput.addEventListener('change', () => {
				updateSquaresList();
				this.onConfigChange();
			});
			console.log("Attached 'change' listener to homeSquaresInput")
		} else {
			console.warn('homeSquaresInput not found');
		}

		const purgeMinutesInput = document.getElementById('purgeMinutesInput');
		if (purgeMinutesInput) {
			purgeMinutesInput.addEventListener('change', () => {
				updatePurgeMins();
				this.onConfigChange();
			});
			console.log("Attached 'change' listener to purgeMinutesInput")
		} else {
			console.warn('purgeMinutesInput not found');
		}
	}
}
