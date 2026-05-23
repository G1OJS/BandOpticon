import {myCall, setMyCall, setSquaresList, colours, loadConfig} from './config.js';
import {GeoChart} from './geoChart.js';
import {connectToFeed} from './mqtt.js';

const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid')
let geoCharts = new Map();

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

document.getElementById('homeSquaresInput').addEventListener('change', () => {
	setSquaresList(); 
	connectToFeed();
});
document.getElementById('myCallInput').addEventListener('change', () => {
	let myCallNew = document.getElementById('myCallInput').value.toUpperCase();
	document.getElementById('myCallInput').value = myCallNew;
	setMyCall(myCallNew); 
	for (const geoChart of geoCharts.values()){
		geoChart.setMyCall(myCall);
	}
	redraw_geoCharts();
});

function redraw_geoCharts(){
	console.log('redraw');
	for (const geoChart of geoCharts.values()){
		geoChart.redraw(myCall);
	}
}

document.querySelector('#zoomTilesToActivity').addEventListener('change', () => {
	curateTiles();
	redraw_geoCharts();
});

document.querySelector('#filters').addEventListener('change', () => {
	for (const geoChart of geoCharts.values()){
		geoChart.setFilters(document.getElementById('homeTx').checked, document.getElementById('homeRx').checked);
	}
	curateTiles();
	redraw_geoCharts();
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
		geoChart.setView('tile');
		geoChart.setMyCall(myCall);
		geoChart.setFilters(document.getElementById('homeTx').value, document.getElementById('homeTx').value);
		geoCharts.set(bandMode, geoChart);

		tileElement.addEventListener("click", e => {showMain(bandMode);}); 
		tileElement.addEventListener("mousemove", e => {geoChart.onMouseMove(e, canvasElement)}); 

		const tileWindowBarElement = tileElement.querySelector('.tileWindowBar');
		tileWindowBarElement.addEventListener( "click", e => {geoChart.zoom(e.target.dataset.action, e)} ); 

		mainView.addEventListener("click", e => {
			if (e.target.nodeName =='CANVAS') {geoChart.zoom('zoomIn', e);}
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
			geoChart.setView('tile');
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
	
	geoChart.setView('main');
	
    if (existingMainElement) {
        tileTrayGrid.appendChild(existingMainElement);
    }
    
	mainView.appendChild(tileElement);
    requestAnimationFrame(() => {
        geoChart?.redraw();
    });
}
