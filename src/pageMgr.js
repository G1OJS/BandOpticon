
import {parseSquares} from './geoFuncs.js';
import {GeoView} from './geoView.js';
import {getDataVignette} from './dataMgr.js';
import {mqttStatus} from './mqtt.js';

const tileTrayGrid = document.querySelector('#tileTrayGrid');
const mainViewCanvasElement = document.getElementById('mainCanvas');
const fullEarth = {'latmin':-90, 'latmax':90, 'lonmin':-180, 'lonmax':180};
const europeTest = {'latmin':45, 'latmax':55, 'lonmin':-5, 'lonmax':5};

let views = new Map();
let mainBandMode = null;

export function onDataUpdate(bandMode){
	let vis = setTileVisibility(bandMode);
	if (vis) views.get(bandMode).invalidate();
	if (bandMode == mainBandMode) views.get('main').invalidate();
}

function invalidateAllVisible(){
	for (const tileElement of tileTrayGrid.querySelectorAll('.tile')){ 
		onDataUpdate(tileElement.id);
	}
}
function setTileVisibility(bandMode){
	const md = bandMode.split(' ')[1];
	let vis = false;
	vis |= (md == 'FT8' && document.getElementById('FT8').checked);
	vis |= (md == 'FT4' && document.getElementById('FT4').checked);
	vis |= (md == 'FT2' && document.getElementById('FT2').checked);
	vis |= (md == 'WSPR' && document.getElementById('WSPR').checked);
	vis |= ('FT8FT4FT2WSPR'.search(md) <0 && document.getElementById('Other').checked);	
	
	if (vis) {
		let tileElement = tileTrayGrid.querySelector("[id='"+bandMode+"']");
		if (!tileElement) tileElement = _createTileElement(bandMode);
		tileElement.classList.remove('hidden');
	} else {
		tileTrayGrid.querySelector("[id='"+bandMode+"']")?.classList.add('hidden');
	}
	
	return vis;
}

function _createTileElement(bandMode){
	console.log("Create tile "+bandMode);
	const dataVignette = getDataVignette(bandMode);
	const wavelength = dataVignette.wavelength;
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
	const canvasElement = tileElement.querySelector('canvas');
	views.set(tileElement.id, new GeoView(dataVignette, canvasElement, 110));	
	return tileElement;
}

function setMainView(bandMode){
	document.getElementById('mainViewTitle').innerText = bandMode;
	const canvasElement = document.getElementById('mainCanvas');
	const dataVignette = getDataVignette(bandMode);
	views.set('main', new GeoView(dataVignette, canvasElement, 50));
	views.get('main').invalidate();
	mainBandMode = bandMode;
}

export function initialisePage(){
	const myCall = localStorage.getItem('myCall');
	if (myCall) { 
		console.log("Loaded my call " + myCall); 
		document.getElementById('myCallInput').value = myCall.toUpperCase();
	}
	
	// move to geofuncs as 'validate squares'
	const defaultSquaresList = "IO50:99,JO01,JO02,JO03";
	let squaresList = localStorage.getItem('squaresList');
	if (squaresList){
		try {squaresList = JSON.parse(squaresList);} catch (e) {squaresList = false;} 
	}	
	if (squaresList){
		console.log("Loaded squares list "+squaresList); 
	} else {
		squaresList = defaultSquaresList;
		localStorage.setItem('squaresList', JSON.stringify(squaresList));
		console.log("No local config data found for squares list: defaults applied.");
	}
	document.getElementById("homeSquaresInput").value = squaresList;

	const colours = JSON.parse(localStorage.getItem('colours'));
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
	

		
	document.getElementById('myCallInput').addEventListener('change', () => {
		const myCall = document.getElementById('myCallInput').value.toUpperCase();
		document.getElementById('myCallInput').value = myCall;
		localStorage.setItem('myCall',myCall); 
		invalidateAllVisible();
	});

	document.getElementById('homeSquaresInput').addEventListener('change', () => {
		const squaresList = document.getElementById('homeSquaresInput').value; 
		if (parseSquares(squaresList) == "Err") {
			input.setCustomValidity("Invalid grid square format");
		} else {
			input.setCustomValidity("");
			setConfig('squaresList', JSON.stringify(squaresList));
			console.log("Saved Squares List: " + squaresList);
		}
		input.reportValidity();
		invalidateAllVisible();
	});	

	document.getElementById('homeCallFilters').addEventListener('change', () => {invalidateAllVisible();});	
	document.getElementById('modeFilters').addEventListener('change', () => {invalidateAllVisible();});	
	document.getElementById('zoomTilesToData').addEventListener('change', () => {invalidateAllVisible();});	
	
	document.getElementById('tileTrayGrid').addEventListener('click', (e) => {
		setMainView(e.target.closest('.tile').id);
	});	
	
	document.getElementById('mainViewWindowBar').addEventListener('click', (e) => {
		const view = views.get('main')
		if (view){
			document.getElementById('zoomMainToData').checked = false;
			if (e.target.dataset.action == 'zoomFullEarth') {view.zoomToBox(fullEarth, 1.0);}
			if (e.target.dataset.action == 'zoomToData') {view.zoomToData();}
			if (e.target.dataset.action == 'zoomOut') {view.setZoom(1.0/1.2);}
			view.invalidate();
		}
	});
	
	document.getElementById('zoomMainToData').addEventListener('change', (e) => {
		setConfig(document.getElementById('zoomMainToData').checked);
	});

	document.getElementById('mainCanvas').addEventListener('mousemove', (e) => {
		views.get('main')?.onMouseMove(e);
	});
	document.getElementById('mainCanvas').addEventListener('click', (e) => {
		const view = views.get('main')
		if (view){
			document.getElementById('zoomMainToData').checked = false;
			view.setZoom(1.2);
			view.invalidate();
		}
	});

}






