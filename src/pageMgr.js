import {myCall, setMyCall, setSquaresList, colours} from './config.js';
import {GeoView} from './geoView.js';
import {getDataVignette} from './dataMgr.js';

const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid');
let geoViews = new Map();

export function initialisePage(){
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
	
	document.getElementById('modeFilters').addEventListener('change', () => {
		for (const tileElement of document.querySelectorAll('.tile')) {
			if (modeFilter(tileElement.id.split(' ')[1])) {
				tileElement.classList.remove('hidden');
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

function drawFilteredConnections(view, callsignRecords, connectionString){
	let endpointCallsigns = connectionString.split('|');
	let endpointRecords = [callsignRecords.get(endpointCallsigns[0]), callsignRecords.get(endpointCallsigns[1])];
	if ( (endpointRecords[0].isInHome && document.getElementById('homeTx').checked) || (endpointRecords[1].isInHome && document.getElementById('homeRx').checked) ) {
		view.drawConnection(endpointCallsigns, endpointRecords, myCall);
	}
}

function zoom(zoomAction, e){
		if(zoomAction == 'zoomIn'){		
			let rect = this.canvasElement.getBoundingClientRect();
			let xnorm = (e.clientX - rect.left) / (rect.right-rect.left);
			let ynorm = (e.clientY - rect.top)/ (rect.bottom-rect.top);	
			this.zoomParams.lat0 = (-180*(ynorm-0.5) / this.zoomParams.scale) + this.zoomParams.lat0;
			this.zoomParams.lon0 = ( 360*(xnorm-0.5) / this.zoomParams.scale) + this.zoomParams.lon0;
			this.zoomParams.scale = this.zoomParams.scale *1.2;
		} else {
			this.set_zoom(zoomAction);
		}
		
		for (const cRecord of this.cRecords.values()) cRecord.p = this.px(cRecord.latlong);
}

function redrawAllTiles(){
	for (const tileElement of document.querySelectorAll('.tile')) {
		updateView(tileElement.id, true);
	}
}


export function updateView(bandMode, full_draw_needed){
	if (modeFilter(bandMode.split(' ')[1])) {

		let dataVignette = getDataVignette(bandMode);
		let callsignRecords = dataVignette.getCallsignRecords();
		let connectionStrings = dataVignette.getConnectionStrings(); 

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
		let tileButtons = tileElement.querySelectorAll('.windowBarButton');
		for (const b of tileButtons){b.classList.add('hidden');}
		tileElement.classList.remove('hidden');
		
		let view = geoViews.get(bandMode);
		if (!view) {
			view = new GeoView(canvasElement);
			geoViews.set(bandMode, view);		
			full_draw_needed = true;
		}

		if (document.getElementById('zoomTilesToActivity').checked){
			view.setZoom('zoomToData', null);
		} else {
			view.setZoom('zoomFullEarth', null);
		}	
		view.setMarkerSize(20);
		if (full_draw_needed){
			console.log("Full draw for " + bandMode);
			view.drawMap();
			for (const connectionString of connectionStrings){
				drawFilteredConnections(view, callsignRecords, connectionString);
			}
		} else {
			drawFilteredConnections(view, callsignRecords, connectionStrings.slice(-1)[0]);
		}
	}

}

