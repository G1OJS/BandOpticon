import {updatemyCall, updateSquaresList, colours, loadConfig} from './config.js';
import {GeoChart} from './geoChart.js';
import {connectToFeed} from './mqtt.js';

const filters = document.querySelector('#filters');
const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid')
let geoCharts = new Map();

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
	curateTiles();
}); 

setInterval(() => curateTiles(), 900);

export function addSpot(spot, senderIsInHome, receiverIsInHome) {
	const sRecord = {call:spot.sc, p:null, sq:spot.sl, tx:true, rx:false, isInHome:senderIsInHome};
	const rRecord = {call:spot.rc, p:null, sq:spot.rl, tx:false, rx:true, isInHome:receiverIsInHome};

	const bandMode = spot.b+" "+spot.md;
	let geoChart = geoCharts.get(bandMode);
	if(!geoChart) {
		console.log("Create tile "+bandMode);
		const tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
		tileTrayGrid.append(tileElement);

		tileElement.querySelector('.tileTitle').textContent = bandMode;  
		tileElement.id = bandMode;

		const canvasElement = tileElement.querySelector('canvas');
		geoChart = new GeoChart(canvasElement);
		geoCharts.set(bandMode, geoChart);

		tileElement.addEventListener("click", e => {showMain(bandMode)}); 
		tileElement.addEventListener("mousemove", e => {geoChart.onMouseMove(e, canvasElement)}); 
	}

	geoChart.addConnection(sRecord, rRecord, false);
}

function tile_wavelength(tileTitleElement){
	let band = tileTitleElement.textContent.split(" ")[0];
	let wl = parseInt(band.split("m")[0]);
	if (band.search("cm") > 0) wl /= 100;
	return wl;
}

function curateTiles() {
	// sort tile tray by wavelength
	[...tileTrayGrid.children].sort((a, b) => tile_wavelength(b) - tile_wavelength(a)).forEach(node => tileTrayGrid.appendChild(node));
	
	// only show tiles for selected modes
	let tiles = tileTrayGrid.querySelectorAll('.tile');
	for (const tileElement of tiles) {
		let tileMode = tileElement.id.split(" ")[1];
		let toHide = false;
		if(tileMode == 'FT8' && !document.getElementById('FT8').checked) toHide = true;
		if(tileMode == 'FT4' && !document.getElementById('FT4').checked) toHide = true;
		if(tileMode == 'WSPR' && !document.getElementById('WSPR').checked) toHide = true;
		if('FT8FT4WSPR'.search(tileMode) <0 && !document.getElementById('Other').checked) toHide = true;
		if(toHide) {
			tileElement.classList.add('hidden');
		} else {
			tileElement.classList.remove('hidden');
		}	
	}
}

function showMain(bandMode){
	let existingMainElement = mainView.querySelector('.tile');
	if (existingMainElement) {
		tileTrayGrid.moveBefore(existingMainElement, null);
	}
	let tileElement = document.getElementById(bandMode);
	mainView.moveBefore(tileElement, null);
}

