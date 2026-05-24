import {myCall, setMyCall, setSquaresList, colours} from './config.js';
import {GeoView} from './geoView.js';

const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid');
const showInvolvingHomeTx = document.getElementById('homeTx');
const showInvolvingHomeRx = document.getElementById('homeRx');
let geoViews = new Map();

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

document.getElementById('homeSquaresInput').addEventListener('change', () => {
	setSquaresList(); 
});

document.getElementById('myCallInput').addEventListener('change', () => {
	let myCallNew = document.getElementById('myCallInput').value.toUpperCase();
	document.getElementById('myCallInput').value = myCallNew;
	setMyCall(myCallNew); 
});

function modeFilter(md){
	let vis = false;
	vis |= (md == 'FT8' && document.getElementById('FT8').checked);
	vis |= (md == 'FT4' && document.getElementById('FT4').checked);
	vis |= (md == 'FT2' && document.getElementById('FT2').checked);
	vis |= (md == 'WSPR' && document.getElementById('WSPR').checked);
	vis |= ('FT8FT4FT2WSPR'.search(md) <0 && document.getElementById('Other').checked);
	return vis;
}

export function manageViews() {
	

}

function drawFilteredConnections(view, callsignRecords, connectionString){
	let endpointCallsigns = connectionString.split('|');
	let endpointRecords = [callsignRecords.get(endpointCallsigns[0]), callsignRecords.get(endpointCallsigns[1])];
	if ( (endpointRecords[0].isInHome && showInvolvingHomeTx.checked) || (endpointRecords[1].isInHome && showInvolvingHomeRx.checked) ) {
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

export function updateViews(bandMode, callsignRecords, connectionStrings){
	if (modeFilter(bandMode.split(' ')[1])) {
		
		let full_draw_needed = false;

		let tileElement = tileTrayGrid.querySelector("[id='"+bandMode.replace(' ','')+"']");
		if (!tileElement) {
			console.log("Create tile "+bandMode);
			tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
			tileTrayGrid.append(tileElement);				
			tileElement.querySelector('.tileTitle').textContent = bandMode;  
			tileElement.id = bandMode.replace(' ','');
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

