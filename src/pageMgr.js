import {myCall, setMyCall, setSquaresList, colours} from './config.js';
import {GeoView} from './geoView.js';
import {getDataVignette} from './dataMgr.js';

const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid');
let geoViews = new Map();
let detailBandMode = null;

export function initialisePage(){
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
	
	document.getElementById('modeFilters').addEventListener('change', () => {
		for (const tileElement of document.querySelectorAll('.tile')) {
			if (modeFilter(tileElement.id.split(' ')[1])) {
				tileElement.classList.remove('hidden');
				updateView(tileElement.id, true);
			} else {
				tileElement.classList.add('hidden');
			}
		}
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
		detailBandMode = e.target.closest('.tile').id;
		updateView(detailBandMode, true);
		updateMain(detailBandMode, true);
	});	
	
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

function zoom(zoomAction, e){

}

function redrawAllTiles(){
	for (const tileElement of document.querySelectorAll('.tile')) {
		updateView(tileElement.id, true);
	}
}

export function updateView(bandMode, full_draw_needed){
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
		let view = geoViews.get(bandMode);
		if (!view) {
			view = new GeoView(canvasElement);
			geoViews.set(bandMode, view);		
			full_draw_needed = true;
		}

		let connsToDraw = connectionStrings.slice(-1);
		if (full_draw_needed){
			console.log("Full draw for " + bandMode);
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
				view.drawConnection(endpointCallsigns, endpointRecords, myCall);
			}
		}
	}
	
}

function updateMain(bandMode, full_draw_needed){
	let dataVignette = getDataVignette(bandMode);
	let callsignRecords = dataVignette.getCallsignRecords();
	let connectionStrings = dataVignette.getConnectionStrings(); 

	const canvasElement = document.getElementById('mainCanvas');	
	const viewName = bandMode+' main'
	let view = geoViews.get(viewName);
	if (!view) {
		view = new GeoView(canvasElement);
		geoViews.set(viewName, view);		
		full_draw_needed = true;
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
			view.drawConnection(endpointCallsigns, endpointRecords, myCall);
		}
	}
}

