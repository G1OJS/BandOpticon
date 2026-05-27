
import {parseSquares} from './geoFuncs.js';
import {GeoView} from './geoView.js';
import {getDataVignette} from './dataMgr.js';
import {connectToFeed, mqttStatus} from './mqtt.js';

let zoomTilesToDataCheckBox = null;
let zoomMainToDataCheckBox = null;
let tileTrayGrid = null;
let mainViewCanvasElement = null;
	
let views = new Map();
let mainBandMode = null;

export async function  loadApp(){
	let views = new Map();
	let mainBandMode = null;
	let bands = '+';
	let url = new URL(window.location.href);
	let params = new URLSearchParams(url.search);
	if (params){
		let b = params.get("b");
		if (b){
			{bands = b.split(',');}
		}
	}
	initialisePage();
	connectToFeed(bands); 
	
	while (mqttStatus != 'receiving') {
		document.getElementById('mqttStatus').innerText = mqttStatus;
		await new Promise(r => setTimeout(r, 250));
	}
	document.getElementById('mqttStatus').innerText ='';
	document.getElementById('clickTileMessage').classList.remove('hidden');
}

export function onDataUpdate(bandMode){
	//note stats = {'calls': 0, 'callsHomeTx':0, 'callsHomeRx':0, 'callsHomeTxRx':0, 'connsHomeTx':0, 'connsHomeRx':0};
	let vis = setTileVisibility(bandMode);
	if (vis) { 
		const dataVignette = getDataVignette(bandMode)
		const stats = dataVignette.getStats();
		const tileElement = tileTrayGrid.querySelector("[id='"+bandMode+"']");
		const tileSubtitleElement = tileElement.querySelector('.tileSubtitle');
		tileSubtitleElement.innerText = `Total Calls:${stats.calls}`;
		const view = views.get(bandMode);
		view.invalidate();
		if (bandMode == mainBandMode) {
			const mainViewSubTitleElement = document.getElementById('mainViewSubTitle');
			mainViewSubTitleElement.innerText = `Total Calls:${stats.calls} Home Calls [Tx: ${stats.callsHomeTx} Rx:${stats.callsHomeRx} TxRx:${stats.callsHomeTxRx}] Connections [out:${stats.connsHomeTx} In:${stats.connsHomeRx}]`;
			const mainView = views.get('main');
			mainView.invalidate();
		}
	}
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
	//console.log("Create tile "+bandMode);
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
	views.set(tileElement.id, new GeoView(dataVignette, canvasElement, 'zoomTilesToDataCheckBoxChecked', 110));	
	return tileElement;
}

function setMainView(bandMode){
	document.getElementById('mainViewTitle').innerText = bandMode;
	document.getElementById('clickTileMessage').classList.add('hidden');
	const canvasElement = document.getElementById('mainCanvas');
	const dataVignette = getDataVignette(bandMode);
	views.set('main', new GeoView(dataVignette, canvasElement, 'zoomMainToDataCheckBoxChecked', 50));
	views.get('main').invalidate();
	mainBandMode = bandMode;
}

function loadSquaresList(homeSquaresInput){
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
	homeSquaresInput.value = squaresList;
}

export function initialisePage(){
	zoomTilesToDataCheckBox = document.getElementById('zoomTilesToDataCheckBox');
	zoomMainToDataCheckBox = document.getElementById('zoomMainToDataCheckBox');
	tileTrayGrid = document.querySelector('#tileTrayGrid');
	mainViewCanvasElement = document.getElementById('mainCanvas');
	
	// load any stored values of myCall
	const myCall = localStorage.getItem('myCall');
	if (myCall) { 
		console.log("Loaded my call " + myCall); 
		document.getElementById('myCallInput').value = myCall.toUpperCase();
	}
	document.getElementById('myCallInput').addEventListener('change', () => {
		const myCall = document.getElementById('myCallInput').value.toUpperCase();
		document.getElementById('myCallInput').value = myCall;
		localStorage.setItem('myCall',myCall); 
		invalidateAllVisible();
	});

	// load any stored values of squares list
	const homeSquaresInput = document.getElementById('homeSquaresInput')
	loadSquaresList(homeSquaresInput)
	
	// listener for changed squares list
	homeSquaresInput.addEventListener('change', () => {
		const squaresList = homeSquaresInput.value; 
		if (parseSquares(squaresList) == "Err") {
			homeSquaresInput.setCustomValidity("Invalid grid square format");
		} else {
			homeSquaresInput.setCustomValidity("");
			localStorage.setItem('squaresList', JSON.stringify(squaresList));
			console.log("Saved Squares List: " + squaresList);
		}
		homeSquaresInput.reportValidity();
		loadApp();
	});	

	//set colours for legend items
	const colours = JSON.parse(localStorage.getItem('colours'));
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
	
	document.getElementById('homeCallFilters').addEventListener('change', () => {invalidateAllVisible();});	
	document.getElementById('modeFilters').addEventListener('change', () => {invalidateAllVisible();});		
	
	// handlers for carousel controls	
	if (localStorage.getItem('zoomTilesToDataCheckBoxChecked') == 'true') zoomTilesToDataCheckBox.checked = true;
	zoomTilesToDataCheckBox.addEventListener('change', (e) => {
		localStorage.setItem('zoomTilesToDataCheckBoxChecked', zoomTilesToDataCheckBox.checked);
		if (zoomTilesToDataCheckBox.checked){
			for (const tileElement of tileTrayGrid.querySelectorAll('.tile')){ views.get(tileElement.id)?.setZoomToData();}
		} else {
			for (const tileElement of tileTrayGrid.querySelectorAll('.tile')){ views.get(tileElement.id)?.zoomFullEarth();}
		}	
		invalidateAllVisible();
	});
	
	// carousel tile click
	document.getElementById('tileTrayGrid').addEventListener('click', (e) => {
		const bandMode = e.target.closest('.tile')?.id;
		if (bandMode) setMainView(bandMode);
	});	
	
	// handlers for clicks to main view controls
	if (localStorage.getItem('zoomMainToDataCheckBoxChecked') == 'true') zoomMainToDataCheckBox.checked = true;
	zoomMainToDataCheckBox.addEventListener('change', (e) => {
		localStorage.setItem('zoomMainToDataCheckBoxChecked', zoomMainToDataCheckBox.checked);
		if (zoomMainToDataCheckBox.checked) {
			views.get('main')?.setZoomToData();
		} else {
			views.get('main')?.zoomFullEarth();
		}
		views.get('main')?.invalidate();
	});
	document.getElementById('mainViewWindowBar').addEventListener('click', (e) => {
		const mainView = views.get('main')
		if (mainView){
			zoomMainToDataCheckBox.checked = false;
			localStorage.setItem('zoomMainToDataCheckBoxChecked', false);
			if (e.target.dataset.action == 'zoomFullEarth') {mainView.zoomFullEarth();}
			if (e.target.dataset.action == 'setZoomToData') {mainView.setZoomToData();}
			if (e.target.dataset.action == 'zoomOut') {mainView.setZoom(1.0/1.2, null);}
			mainView.invalidate();
		}
	});
	
	// handlers for main view click & hover
	document.getElementById('mainCanvas').addEventListener('click', (e) => {
		const mainView = views.get('main')
		if (mainView){
			zoomMainToDataCheckBox.checked = false;
			localStorage.setItem('zoomMainToDataCheckBoxChecked', false);
			mainView.zoomToPointerPos(e, 1.2);
			mainView.invalidate();
		}
	});	
	document.getElementById('mainCanvas').addEventListener('mousemove', (e) => {
		views.get('main')?.onMouseMove(e);
	});


}






