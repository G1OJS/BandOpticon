import {setMyCall, setSquaresList, colours} from './config.js';
import {GeoView} from './geoView.js';
import {getDataVignette} from './dataMgr.js';
import {mqttStatus} from './mqtt.js';

const tileTrayGrid = document.querySelector('#tileTrayGrid');
const mainViewCanvasElement = document.getElementById('mainCanvas');
const fullEarth = {'latmin':-90, 'latmax':90, 'lonmin':-180, 'lonmax':180};
const europeTest = {'latmin':45, 'latmax':55, 'lonmin':-5, 'lonmax':5};

let views = new Map();
let mainBandMode = null;
let highlightCall = null;

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
	views.set(tileElement.id, new GeoView(dataVignette, canvasElement));	
	return tileElement;
}

function setMainView(bandMode){
	document.getElementById('mainViewTitle').innerText = bandMode;
	const canvasElement = document.getElementById('mainCanvas');
	const dataVignette = getDataVignette(bandMode);
	views.set('main', new GeoView(dataVignette, canvasElement));
	views.get('main').invalidate();
	mainBandMode = bandMode;
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
		invalidateAllVisible();
	});

	document.getElementById('homeSquaresInput').addEventListener('change', () => {
		setSquaresList(); 
		invalidateAllVisible();
	});	

	document.getElementById('homeCallFilters').addEventListener('change', () => {invalidateAllVisible();});	
	document.getElementById('modeFilters').addEventListener('change', () => {invalidateAllVisible();});	
	document.getElementById('zoomTilesToData').addEventListener('change', () => {invalidateAllVisible();});	
	
	document.getElementById('tileTrayGrid').addEventListener('click', (e) => {
		setMainView(e.target.closest('.tile').id);
	});	
	
	document.getElementById('mainViewWindowBar').addEventListener('click', (e) => {

	});
	
	document.getElementById('zoomMainToData').addEventListener('change', (e) => {
		
	});

	document.getElementById('mainCanvas').addEventListener('mousemove', (e) => {

	});
	document.getElementById('mainCanvas').addEventListener('click', (e) => {

	});

	waitForMqtt();
}






