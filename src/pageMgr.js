import {myCall, setMyCall, setSquaresList, colours} from './config.js';
import {GeoView} from './geoView.js';
import {getDataVignette} from './dataMgr.js';
import {mqttStatus} from './mqtt.js';

const tileTrayGrid = document.querySelector('#tileTrayGrid');
const mainViewCanvasElement = document.getElementById('mainCanvas');
const fullEarth = {'latmin':-90, 'latmax':90, 'lonmin':-180, 'lonmax':180};
const europeTest = {'latmin':45, 'latmax':55, 'lonmin':-5, 'lonmax':5};

let geoViews = new Map();
let mainBandMode = null;
let mainView = null;
let highlightCall = null;


export function onDataUpdate(bandMode){
	updateTile(bandMode, false);
	if (bandMode == mainBandMode){
		updateMain(false);
	}
}

async function waitForMqtt(){
	while (mqttStatus != 'receiving') {
		document.getElementById('mqttStatus').innerText = mqttStatus;
		await new Promise(r => setTimeout(r, 250));
	}
	document.getElementById('mqttStatus').innerText ='';	
}

export function initialisePage(){
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
		
	document.getElementById('myCallInput').addEventListener('change', () => {
		let myCallNew = document.getElementById('myCallInput').value.toUpperCase();
		document.getElementById('myCallInput').value = myCallNew;
		setMyCall(myCallNew); 
		redrawAllTiles();
	});

	document.getElementById('homeSquaresInput').addEventListener('change', () => {
		setSquaresList(); 
		redrawAllTiles();
	});	

	document.getElementById('homeCallFilters').addEventListener('change', () => {
		console.log("homeCallFilters.change");
		redrawAllTiles();
	});	

	document.getElementById('modeFilters').addEventListener('change', () => {
		redrawAllTiles();
	});	

	document.getElementById('zoomTilesToData').addEventListener('change', () => {
		console.log("zoomTilesToData.change");
		redrawAllTiles();
	});	
	
	document.getElementById('tileTrayGrid').addEventListener('click', (e) => {
		console.log("tileTrayGrid.click");
		mainBandMode = e.target.closest('.tile').id;
		updateMain(true);
	});	
	
	document.getElementById('mainViewWindowBar').addEventListener('click', (e) => {
		if (mainView){
			document.getElementById('zoomMainToData').checked = false;
			if (e.target.dataset.action == 'zoomFullEarth') {mainView.zoomToBox(fullEarth, 1.0);}
			if (e.target.dataset.action == 'zoomToData') {mainView.zoomToBox(getDataVignette(mainBandMode).geoRange, 0.8);}
			if (e.target.dataset.action == 'zoomOut') {mainView.setZoom(1.0/1.2);}
			updateMain(true);
		}
	});
	
	document.getElementById('zoomMainToData').addEventListener('change', (e) => {
		if (mainView){updateMain(true);}
	});

	document.getElementById('mainCanvas').addEventListener('mousemove', (e) => {
		if (mainView) {
			mainView.updateHoveringOver(e);
			highlightCall = mainView.currentHover? mainView.currentHover: myCall;
			mainViewCanvasElement.title = mainView.currentHover? mainView.currentHover:'';
			updateMain(true);
		}
	});
	document.getElementById('mainCanvas').addEventListener('click', (e) => {
		if (mainView) {
			let ll = mainView.getPointerLatLon(e);
			mainView.setCentre(ll);
			mainView.setZoom(1.2);
			updateMain(true);
		}
	});

	waitForMqtt();
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

function redrawAllTiles(){
	for (const tileElement of document.querySelectorAll('.tile')) {
		updateTile(tileElement.id, true);
	}
	updateMain(true);
}

function create_tile(bandMode){
	console.log("Create tile "+bandMode);
	const wavelength = getDataVignette(bandMode).wavelength;
	let insert = null;
	for (const tile of document.querySelectorAll('.tile')){
		if (wavelength > tile.dataset.value) {
			insert = tile;
			break;
		}
	}
	const tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
	tileElement.dataset.value = wavelength;
	tileTrayGrid.insertBefore(tileElement, insert);
	
	tileElement.querySelector('.tileTitle').textContent = bandMode;  
	tileElement.id = bandMode;
	return tileElement;
}

function updateTile(bandMode, full_draw_needed){
	let tileElement = tileTrayGrid.querySelector("[id='"+bandMode+"']");
	if (modeFilter(bandMode.split(' ')[1])) {
		if (!tileElement) {
			tileElement = create_tile(bandMode);
			full_draw_needed = true;
		}			
		tileElement.classList.remove('hidden');	
		let zoomToData = document.getElementById('zoomTilesToData').checked;	
		_drawConnections(tileElement.querySelector('canvas'), bandMode, false, zoomToData, full_draw_needed, '');
	} else {
		tileElement?.classList.add('hidden');
	}
}

function updateMain(full_draw_needed){
	const mainViewTitleElement = document.getElementById('mainViewTitle');	
	const mainViewSubtitleElement = document.getElementById('mainViewSubtitle');	
	if (modeFilter(mainBandMode?.split(' ')[1])) {
		mainViewTitleElement.innerText = mainBandMode;
		let zoomToData = document.getElementById('zoomMainToData').checked;	
		_drawConnections(mainViewCanvasElement, mainBandMode, true, zoomToData, full_draw_needed, highlightCall);	
	} else {
		mainViewTitleElement.innerText = '';
		mainView?.rebase();
	}
}

function _drawConnections(canvasElement, bandMode, isMain, zoomToData, full_draw_needed, highlightCall){
	let dataVignette = getDataVignette(bandMode);
	let callsignRecords = dataVignette.getCallsignRecords();
	let connectionStrings = dataVignette.getConnectionStrings(); 

	let viewName = isMain? bandMode+'main': bandMode;
	let view = geoViews.get(viewName);
	
	if (!view) {
		view = new GeoView(canvasElement);
		geoViews.set(viewName, view);		
		full_draw_needed = true;
	}
	if (zoomToData) {
		view.zoomToBox(dataVignette.geoRange, 0.8);
		full_draw_needed = true;
	}
	if (!zoomToData && canvasElement != mainViewCanvasElement){
		view.zoomToBox(fullEarth, 1.0);
	}
	if (canvasElement == mainViewCanvasElement) {
		mainView = view;
	}
	let connsToDraw = connectionStrings.slice(-1);
	if (full_draw_needed){
		console.log("Full draw for " + viewName);
		view.rebase();
		connsToDraw = connectionStrings;
	}
	for (const connectionString of connsToDraw){
		let vis = false;
		let endpointCallsigns = connectionString.split('|');
		let endpointRecords = [callsignRecords.get(endpointCallsigns[0]), callsignRecords.get(endpointCallsigns[1])];
		vis |= (endpointRecords[0].isInHome && document.getElementById('homeTx').checked); 
		vis |= (endpointRecords[1].isInHome && document.getElementById('homeRx').checked);
		if (vis){	
			view.drawConnection(endpointCallsigns, endpointRecords, highlightCall);
		}
	}
}

