import {myCall, setMyCall, setSquaresList, colours} from './config.js';
import {GeoView} from './geoView.js';
import {getDataVignette} from './dataMgr.js';

const tileTrayGrid = document.querySelector('#tileTrayGrid');
const mainViewCanvasElement = document.getElementById('mainCanvas');
let geoViews = new Map();
let mainBandMode = null;
let mainView = null;

export function initialisePage(){
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
	
	document.getElementById('modeFilters').addEventListener('change', () => {
		redrawAllTiles();
	});	
	
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
	
	document.getElementById('tileTrayGrid').addEventListener('click', (e) => {
		console.log("tileTrayGrid.click");
		mainBandMode = e.target.closest('.tile').id;
		redrawMain();
	});	
	
	document.getElementById('mainCanvas').addEventListener('mousemove', (e) => updateHoveringOver(e));
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

function updateHoveringOver(e){
	if (mainView){
		mainView.updateHoveringOver(e);
		mainViewCanvasElement.title = mainView.currentHover? mainView.currentHover:'';
		redrawMain();
	}
}

function zoom(zoomAction, e){

}

function redrawAllTiles(){
	for (const tileElement of document.querySelectorAll('.tile')) {
		console.log("Update "+tileElement.id);
		updateTile(tileElement.id, true);
	}
}

export function updateTile(bandMode, full_draw_needed){
	let dataVignette = getDataVignette(bandMode);
	let callsignRecords = dataVignette.getCallsignRecords();
	let connectionStrings = dataVignette.getConnectionStrings(); 

	if (modeFilter(bandMode.split(' ')[1])) {
		let tileElement = tileTrayGrid.querySelector("[id='"+bandMode+"']");
		if (!tileElement) {
			console.log("Create tile "+bandMode);
			tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
			tileTrayGrid.append(tileElement);				
			tileElement.querySelector('.tileTitle').textContent = bandMode;  
			tileElement.id = bandMode;
			full_draw_needed = true;
		}
		const canvasElement = tileElement.querySelector('canvas');				
		tileElement.classList.remove('hidden');		
		_drawConnections(canvasElement, bandMode, callsignRecords, connectionStrings, full_draw_needed, myCall);
	}
}

function redrawMain(){
	let dataVignette = getDataVignette(mainBandMode);
	let callsignRecords = dataVignette.getCallsignRecords();
	let connectionStrings = dataVignette.getConnectionStrings(); 

	const mainViewTitleElement = document.getElementById('mainViewTitle');	
	const mainViewSubtitleElement = document.getElementById('mainViewSubtitle');	
	const viewName = mainBandMode+' main'
	mainViewTitleElement.innerText = mainBandMode;
	_drawConnections(mainViewCanvasElement, viewName, callsignRecords, connectionStrings, true, mainViewCanvasElement.title);	
}

function _drawConnections(canvasElement, viewName, callsignRecords, connectionStrings, full_draw_needed, highlightCall){
	let view = geoViews.get(viewName);
	if (!view) {
		view = new GeoView(canvasElement);
		geoViews.set(viewName, view);		
		full_draw_needed = true;
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

