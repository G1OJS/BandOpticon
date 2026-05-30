
import {parseSquares, mhToLatLong} from './geoFuncs.js';
import {GeoView} from './geoView.js';
import {getDataVignette, clearAllVignettes} from './dataMgr.js';
import {connectToFeed, mqttStatus} from './mqtt.js';

let zoomTilesToDataCheckBox = null;
let zoomMainToDataCheckBox = null;
let tileTrayGrid = null;
let mainViewCanvasElement = null;
	
let views = new Map();
let mainBandMode = null;

export async function  loadApp(){
	let views = new Map();
	clearAllVignettes();
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
	refreshCarousel();
	refreshMain();
	connectToFeed(bands); 
	
	while (mqttStatus != 'receiving') {
		document.getElementById('mqttStatus').innerText = mqttStatus;
		await new Promise(r => setTimeout(r, 250));
	}
	document.getElementById('mqttStatus').innerText ='';
}

export function onDataUpdate(bandMode){
	//note stats = {'calls': 0, 'callsHomeTx':0, 'callsHomeRx':0, 'callsHomeTxRx':0, 'connsHomeTx':0, 'connsHomeRx':0};
	refreshTile(bandMode);
	if (bandMode == mainBandMode) {
		refreshMain(null);
	}
}

function refreshCarousel(){
	for (const tileElement of tileTrayGrid.querySelectorAll('.tile')) refreshTile(tileElement.id);	
}

function refreshTile(bandMode){
	const md = bandMode.split(' ')[1];
	let vis = false;
	vis |= (md == 'FT8' && document.getElementById('FT8').checked);
	vis |= (md == 'FT4' && document.getElementById('FT4').checked);
	vis |= (md == 'FT2' && document.getElementById('FT2').checked);
	vis |= (md == 'WSPR' && document.getElementById('WSPR').checked);
	vis |= (md == 'CW' && document.getElementById('CW').checked);
	vis |= ('FT8FT4FT2WSPRCW'.search(md) <0 && document.getElementById('Other').checked);	
	const stats = getDataVignette(bandMode)?.getStats();
	if (stats){
		vis &= (stats.calls >0);
		if (vis) {
			let tileElement = tileTrayGrid.querySelector("[id='"+bandMode+"']");
			if (!tileElement) tileElement = _createTileElement(bandMode);
			tileElement.querySelector('.tileSubtitle').innerText = `Total Calls:${stats.calls}`;	
			const canvas = tileElement.querySelector('canvas');
			const AzEq = document.getElementById('AzEqCheckBox').checked;
			[canvas.width, canvas.height] = AzEq? [400, 400]:[400, 200];
			const view = views.get(bandMode);
			view.projection = document.getElementById('AzEqCheckBox').checked? 'AzEq':'EqRect';
			view.latlonCentre = mhToLatLong(localStorage.getItem('mapCentre'));
			zoomTilesToDataCheckBox.checked? view.setZoomToData():view.zoomFullEarth();
			view.myCall = localStorage.getItem('myCall');
			view.invalidate();
			tileElement.classList.remove('hidden');
			if (!mainBandMode){
				document.getElementById('clickTileMessage').classList.remove('hidden');	
			}		
		} else {
			tileTrayGrid.querySelector("[id='"+bandMode+"']")?.classList.add('hidden');
		}	
	}
}

function refreshMain(bandMode){
	if(bandMode){
		mainBandMode = bandMode;
		document.getElementById('mainViewTitle').innerText = bandMode;
		views.set('main', new GeoView(getDataVignette(bandMode), document.getElementById('mainCanvas'), 'zoomMainToDataCheckBoxChecked', 50));	
	} else {
		bandMode = mainBandMode;
	}
	let dataVignette = getDataVignette(bandMode);
	const canvas = document.getElementById("mainCanvas");
	const AzEq = document.getElementById('AzEqCheckBox').checked;
	[canvas.width, canvas.height] = AzEq? [1200, 1200]:[1200, 600];
	if (dataVignette != undefined){
		document.getElementById('clickTileMessage').classList.add('hidden');
		const stats = getDataVignette(bandMode).getStats();
		document.getElementById('mainViewSubTitle').innerText = `Total Calls:${stats.calls} Home Calls [Tx: ${stats.callsHomeTx} Rx:${stats.callsHomeRx} TxRx:${stats.callsHomeTxRx}] Connections [out:${stats.connsHomeTx} In:${stats.connsHomeRx}]`;	
		const view = views.get('main');
		view.projection = document.getElementById('AzEqCheckBox').checked? 'AzEq':'EqRect';
		view.latlonCentre = mhToLatLong(localStorage.getItem('mapCentre'));
		view.showAllConnections = document.getElementById('showAllConnections').checked;
		view.showReciprocalConnections = document.getElementById('showReciprocalConnections').checked;
		view.myCall = localStorage.getItem('myCall');
		if (zoomMainToDataCheckBox.checked) view.setZoomToData();
		view.invalidate();
	} else {
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);		
		document.getElementById('mainViewTitle').innerText = ''
		document.getElementById('mainViewSubTitle').innerText = ''
	}
}

function _createTileElement(bandMode){
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

	// load any stored values of squares list and myCall	
	const myCall = localStorage.getItem('myCall');
	document.getElementById('myCallInput').value = myCall?.toUpperCase();
	const homeSquaresInput = document.getElementById('homeSquaresInput')
	loadSquaresList(homeSquaresInput)
	const mapCentreInput = document.getElementById('mapCentreInput')
	if (!localStorage.getItem('mapCentre')) localStorage.setItem('mapCentre', 'IO90');
	mapCentreInput.value = localStorage.getItem('mapCentre');

	//set colours for legend items
	const colours = JSON.parse(localStorage.getItem('colours'));
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
	
	zoomTilesToDataCheckBox = document.getElementById('zoomTilesToDataCheckBox');
	zoomMainToDataCheckBox = document.getElementById('zoomMainToDataCheckBox');
	if (localStorage.getItem('zoomTilesToDataCheckBoxChecked') == 'true') zoomTilesToDataCheckBox.checked = true;
	if (localStorage.getItem('zoomMainToDataCheckBoxChecked') == 'true') zoomMainToDataCheckBox.checked = true;
	tileTrayGrid = document.querySelector('#tileTrayGrid');
	mainViewCanvasElement = document.getElementById('mainCanvas');

	document.getElementById('homeFilters').addEventListener('change', () => {refreshCarousel(); refreshMain();});	
	document.getElementById('modeFilters').addEventListener('change', () => {refreshCarousel(); refreshMain();});		
	document.getElementById('mapSettings').addEventListener('change', () => {
		localStorage.setItem('mapCentre', mapCentreInput.value);
		refreshCarousel(); 
		refreshMain();
	});		
	
	// show all connections changed
	const showAllConnectionsCheckBox = document.getElementById('showAllConnections');
	const showReciprocalConnectionsCheckBox = document.getElementById('showReciprocalConnections');
	const showConnectionsForCallsignCheckBox = document.getElementById('showConnectionsForCallsign');
	showAllConnectionsCheckBox.addEventListener('change', (e) => {
		showConnectionsForCallsignCheckBox.checked = !showAllConnectionsCheckBox.checked;
		showReciprocalConnectionsCheckBox.checked = !showAllConnectionsCheckBox.checked;
		refreshCarousel();
		refreshMain(null);
	});
	showReciprocalConnectionsCheckBox.addEventListener('change', (e) => {
		showAllConnectionsCheckBox.checked = !showReciprocalConnectionsCheckBox.checked;
		showConnectionsForCallsignCheckBox.checked = !showReciprocalConnectionsCheckBox.checked;
		refreshCarousel();
		refreshMain(null);
	});	
	showConnectionsForCallsignCheckBox.addEventListener('change', (e) => {
		showAllConnectionsCheckBox.checked = !showConnectionsForCallsignCheckBox.checked;
		showReciprocalConnectionsCheckBox.checked = !showConnectionsForCallsignCheckBox.checked;
		refreshCarousel();
		refreshMain(null);
	});	
	
	// myCall changed
	document.getElementById('myCallInput').addEventListener('change', () => {
		const myCall = document.getElementById('myCallInput').value.toUpperCase();
		document.getElementById('myCallInput').value = myCall;
		localStorage.setItem('myCall', myCall); 
		refreshCarousel();
		refreshMain(null);
	});

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

	// handlers for carousel controls	
	zoomTilesToDataCheckBox.addEventListener('change', (e) => {
		localStorage.setItem('zoomTilesToDataCheckBoxChecked', zoomTilesToDataCheckBox.checked);
		refreshCarousel();
	});
	
	// carousel tile click
	document.getElementById('tileTrayGrid').addEventListener('click', (e) => {
		const bandMode = e.target.closest('.tile')?.id;
		if (bandMode) {
			const canvasElement = document.getElementById('mainCanvas');
			const dataVignette = getDataVignette(bandMode);
			views.set('main', new GeoView(dataVignette, canvasElement, 'zoomMainToDataCheckBoxChecked', 50));
			refreshMain(bandMode);
		}	
	});	
	
	// handlers for clicks to main view zoom controls
	zoomMainToDataCheckBox.addEventListener('change', (e) => {
		localStorage.setItem('zoomMainToDataCheckBoxChecked', zoomMainToDataCheckBox.checked);
		const mainView = views.get('main');
		zoomMainToDataCheckBox.checked? mainView.setZoomToData():mainView.zoomFullEarth();
		mainView.invalidate();
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






