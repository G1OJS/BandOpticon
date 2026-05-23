import {updatemyCall, updateSquaresList, colours, loadConfig} from './config.js';
import {GeoChart} from './geoChart.js';
import {connectToFeed} from './mqtt.js';

const filters = document.querySelector('#filters');
const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid')
let geoCharts = new Map();

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

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

// need to add a titlebar with reset zoom in main window

function isInTray(tileElement){
	return (tileElement.parentElement.id == 'tileTrayGrid');
}

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

		tileElement.addEventListener("click", e => {
			if (isInTray(tileElement)){
				showMain(bandMode);
			}
		}); 
		tileElement.addEventListener("mousemove", e => {geoChart.onMouseMove(e, canvasElement)}); 

		const tileWindowBarElement = tileElement.querySelector('.tileWindowBar');
		tileWindowBarElement.addEventListener( "click", e => {geoChart.zoom(e.target.dataset.action, e)} ); 

		canvasElement.addEventListener("click", e => {
			if (!isInTray(tileElement)){
				geoChart.zoom('zoomIn', e);
			}
		}); 
	}

	geoChart.addConnection(sRecord, rRecord, false);
}

function tile_wavelength(tileTitleElement){
	let band = tileTitleElement.textContent.split(" ")[0];
	let wl = parseInt(band.split("m")[0]);
	if (band.search("cm") > 0) wl /= 100;
	return wl;
}

function modeFilter(md){
	let vis = false;
	vis |= (md == 'FT8' && document.getElementById('FT8').checked);
	vis |= (md == 'FT4' && document.getElementById('FT4').checked);
	vis |= (md == 'FT2' && document.getElementById('FT2').checked);
	vis |= (md == 'WSPR' && document.getElementById('WSPR').checked);
	vis |= ('FT8FT4FT2WSPR'.search(md) <0 && document.getElementById('Other').checked);
	return vis;
}

function curateTiles() {
	// sort tile tray by wavelength
	[...tileTrayGrid.children].sort((a, b) => tile_wavelength(b) - tile_wavelength(a)).forEach(node => tileTrayGrid.appendChild(node));
	
	// only show tiles for selected modes
	let tiles = tileTrayGrid.querySelectorAll('.tile');
	for (const tileElement of tiles) {
		let tileMode = tileElement.id.split(" ")[1];
		if(modeFilter(tileMode)) {
			let buttons = tileElement.querySelectorAll('.windowBarButton');
			for (const b of buttons){b.classList.add('hidden');}
			tileElement.classList.remove('hidden');
			let geoChart = geoCharts.get(tileElement.id)
			if (document.getElementById('zoomTilesToActivity').checked){
				geoChart.zoom('zoomToData', null);
			} else {
				geoChart.zoom('zoomFullEarth', null);
			}
		} else {
			tileElement.classList.add('hidden');
		}	
	}
	
	let mainElement = mainView.querySelector('.tile');
	if (mainElement) {
		let buttons = mainElement.querySelectorAll('.windowBarButton');
		for (const b of buttons){b.classList.remove('hidden');}
	}
	
	if (tiles.length && !mainElement) {
		document.getElementById('clickTileMessage').classList.remove('hidden');
	} 

}


function showMain(bandMode){ 
    document.getElementById('clickTileMessage').classList.add('hidden');

    const tileElement = document.getElementById(bandMode);
    const geoChart = geoCharts.get(bandMode);
    const existingMainElement = mainView.querySelector('.tile');

    if (existingMainElement) {
        tileTrayGrid.appendChild(existingMainElement);
    }

    mainView.appendChild(tileElement);
    requestAnimationFrame(() => {
        geoChart?.redraw();
    });
}

function showMain_(bandMode){
	document.getElementById('clickTileMessage').classList.add('hidden');
	let existingMainElement = mainView.querySelector('.tile');
	if (existingMainElement) {
		tileTrayGrid.moveBefore(existingMainElement, null);
	}
	let tileElement = document.getElementById(bandMode);
	let geoChart = geoCharts.get(tileElement.id)
	
	//tileTrayGrid.appendChild(existingMainElement);
	//mainView.appendChild(tileElement);
	
	mainView.moveBefore(tileElement, null);
	geoChart.redraw();
	
}

