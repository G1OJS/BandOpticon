import {updatemyCall, updateSquaresList, colours, loadConfig} from './config.js';
import {geoChart} from './geoChart.js';
import {connectToFeed} from './mqtt.js';

const filters = document.querySelector('#filters');
const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid')
let tileInstances = new Map();

//document.getElementById('legendMarkerTx').style.background = colours.tx;
//document.getElementById('legendMarkerRx').style.background = colours.rx;
//document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

document.getElementById('homeSquaresInput').addEventListener('change', () => {
	updateSquaresList(); 
	connectToFeed();
});
document.getElementById('myCallInput').addEventListener('change', () => {
	updatemyCall(); 
	//refresh all tiles
});
filters.addEventListener('click', () => {
	updateTileVisibility();
}); 

setInterval(() => sortTiles(), 900);
setInterval(() => updateTileVisibility(), 900);

export function addSpot(spot, senderIsInHome, receiverIsInHome) {
	let bandMode = spot.b+" "+spot.md;
	let tileInstance = tileInstances.get(bandMode);
	if(!tileInstance) {
		tileInstance = new tile(bandMode);
		tileInstances.set(bandMode, tileInstance);
	}
	let sRecord = {call:spot.sc, p:null, sq:spot.sl, tx:true, rx:false, isInHome:senderIsInHome};
	let rRecord = {call:spot.rc, p:null, sq:spot.rl, tx:false, rx:true, isInHome:receiverIsInHome};
	tileInstance.geoChart.addConnection(sRecord, rRecord, false);
}

function updateTileVisibility(){
	for (const tileElement of tileTrayGrid.querySelectorAll('.tile')) {
		tileInstances.get(tileElement.dataset.name).setVisibility();
	};  
}

function sortTiles() {
	// needs rewrite (direct from DOM elements?) as this sorts the main view back into the tiles
    //const tileInstancesOrdered = Array.from(tileInstances).sort((a, b) => b[1].wavelength - a[1].wavelength);
    //for (const t of tileInstancesOrdered) {
	//	document.querySelector('#tileTrayGrid').append(t[1].tileElement);
	//}
}

function showMain(bandMode){
	let existingMainElement = mainView.querySelector('.tile');
	if (existingMainElement) {
		tileTrayGrid.moveBefore(existingMainElement, null);
	}
	let tileElement = document.getElementById(bandMode);
	mainView.moveBefore(tileElement, null);
}


class tile{
	constructor(tileTitleText) {
		// first few lines should be in add spot?
		console.log("Create tile "+tileTitleText);
		this.tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
		tileTrayGrid.append(this.tileElement);
		// to here?
		this.name = tileTitleText;
		this.tileElement.dataset.name = tileTitleText;
		this.tileElement.id = tileTitleText;
		this.tileTitleElement = this.tileElement.querySelector('.tileTitle');  
		this.tileTitleElement.textContent = tileTitleText;
		this.canvasElement = this.tileElement.querySelector('canvas');
		this.geoChart = new geoChart(this.canvasElement);
		let band = this.tileTitleElement.textContent.split(" ")[0];
		let wl = parseInt(band.split("m")[0]);
		if (band.search("cm") > 0) wl /= 100;
		this.wavelength = wl;
		this.tileElement.addEventListener("mousemove", e => {this.geoChart.onMouseMove(e, this.canvasElement)}); 
		this.tileElement.addEventListener("click", e => {showMain(tileTitleText)}); 
	}
	
	setVisibility(){
		let tileMode = this.name.split(" ")[1];
		let toHide = false;
		if(tileMode == 'FT8' && !document.getElementById('FT8').checked) toHide = true;
		if(tileMode == 'FT4' && !document.getElementById('FT4').checked) toHide = true;
		if(tileMode == 'WSPR' && !document.getElementById('WSPR').checked) toHide = true;
		if('FT8FT4WSPR'.search(tileMode) <0 && !document.getElementById('Other').checked) toHide = true;
		if(toHide) {
			this.tileElement.classList.add('hidden');
			if(this.btnElement) this.btnElement.classList.add('hidden');
		} else {
			this.tileElement.classList.remove('hidden');
			this.geoChart.redraw(document.getElementById('myCallInput').value); 
		}	
	}

}
