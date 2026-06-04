import {parseSquares, mhToLatLong} from './geoFuncs.js';
import {getView, clearAllViews, views} from './geoView.js';
import {getDataVignette, clearAllDataVignettes, dataVignettes} from './dataMgr.js';
import {connectToFeed, mqttStatus} from './mqtt.js';

const uiFields = ['myCall', 'squaresList', 'mapCentreSquare'];
const uiCheckBoxesCommon = ['homeTx','homeRx','FT8','FT4','FT2','WSPR','CW','Other','setZoomToDataCarousel', 'setZoomToDataMain',
							'showAllConnections','showOnlyDuplexConnections','showOnlyInvolvingThisCall','AzEq']
const connectionsRadioGroup = ['showAllConnections','showOnlyDuplexConnections','showOnlyInvolvingThisCall'];
const uiMainViewClickElements = ['zoomFullEarthBtn','setZoomToDataBtn','zoomOutBtn','mainCanvas']

let pendingUpdates = new Set();
let viewParams = {'AzEq':false, 'latlonCentre':{'lat':0,'lon':0}, 'myCall':'', 'setZoomToDataCarousel':false, 'setZoomToDataMain':false, 
				  'spotSize':6, 'lineWidth':4, 'spotAlpha':0.5, 'lineAlpha': 0.35, 'mapAlpha':0.35, 
				tx:'rgb(200, 30, 30)', rx:'rgb(30, 200, 30)',	txrx:'rgb(51, 153, 255)', 
				land:'rgba(180,200,180)', sea:'rgba(180,210,250)'};
				
function setControl(controlName, value){
	viewParams[controlName] = value;
	document.getElementById(controlName).checked = value;
	localStorage.setItem(controlName, value);
}

export function getViewParams() {return viewParams;}

export async function loadApp(){
	clearAllDataVignettes();
	clearAllViews();
	let bands = '+';
	let url = new URL(window.location.href);
	let params = new URLSearchParams(url.search);
	if (params){
		let b = params.get("b");
		if (b){
			{bands = b.split(',');}
		}
	}
	document.getElementById('legendMarkerTx').style.background = viewParams.tx;
	document.getElementById('legendMarkerRx').style.background = viewParams.rx;
	document.getElementById('legendMarkerTxRx').style.background = viewParams.txrx;
	
	for (const field of uiFields){
		const fieldElement = document.getElementById(field);
		const localStorageValue = localStorage.getItem(field);
		fieldElement.value = localStorageValue? localStorageValue.replaceAll('"',''):'';
		if (field == 'mapCentreSquare') viewParams.latlonCentre = mhToLatLong(fieldElement.value);
		if (field == 'myCall') viewParams.myCall = fieldElement.value;
		fieldElement.addEventListener('change', () => {
			fieldElement.value = fieldElement.value.toUpperCase();
			localStorage.setItem(field, JSON.stringify(fieldElement.value));
			if (field == 'mapCentreSquare') viewParams.latlonCentre = mhToLatLong(fieldElement.value);
			if (field == 'myCall') viewParams.myCall = fieldElement.value;
			refreshViews(dataVignettes.keys());			
			if (field == 'squaresList') loadApp();
		});
	}
	for (const cb of uiCheckBoxesCommon){
		const cbElement = document.getElementById(cb);
		if (localStorage.getItem(cb) === null) localStorage.setItem(cb, cbElement.checked);
		cbElement.checked = (localStorage.getItem(cb) === 'true');
		viewParams[cb] = cbElement.checked;
		cbElement.addEventListener('change', () => {
			if (connectionsRadioGroup.includes(cb) && cbElement.checked) {
				for (const other of connectionsRadioGroup) {
					if (other != cb) setControl(other, false);
				}
			}
			localStorage.setItem(cb, cbElement.checked);
			viewParams[cb] = cbElement.checked;
			refreshViews(dataVignettes.keys());
		});
	}
	for (const cbl of uiMainViewClickElements) {
		document.getElementById(cbl).addEventListener('click', (e) => {
			setControl('setZoomToDataMain', false);
			const bandMode = document.getElementById('mainTile').dataset.bm;
			views.get(bandMode+' main')?.onClick(e);
			refreshMain();
		});
	}
	document.getElementById('mainCanvas').addEventListener('mousemove', (e) => {
		const bandMode = document.getElementById('mainTile').dataset.bm;
		views.get(bandMode+' main')?.onMouseMove(e);
	});
	
	connectToFeed(document.getElementById('squaresList').value, bands); 
	
	while (mqttStatus != 'Receiving') {
		document.getElementById('mqttStatus').innerText = mqttStatus;
		await new Promise(r => setTimeout(r, 250));
	}
	document.getElementById('mqttStatus').innerText ='';
	if (!document.getElementById('mainTile').dataset.bm) {
		document.getElementById('clickTileMessage').classList.remove('hidden');
	}
}

export function onDataUpdate(bandMode){
	pendingUpdates.add(bandMode);
}

const refresh = setInterval(() => {
	refreshViews(pendingUpdates);
	pendingUpdates = new Set();
}, 500);

function refreshViews(viewsToRefresh){
	for (const bandMode of viewsToRefresh) {
		document.getElementById('tileTrayGrid').querySelector("[data-bm='"+bandMode+"']")?.classList.add('hidden');
		const md = bandMode.split(' ')[1];
		let vis = false;
		vis |= (md == 'FT8' && document.getElementById('FT8').checked);
		vis |= (md == 'FT4' && document.getElementById('FT4').checked);
		vis |= (md == 'FT2' && document.getElementById('FT2').checked);
		vis |= (md == 'WSPR' && document.getElementById('WSPR').checked);
		vis |= (md == 'CW' && document.getElementById('CW').checked);
		vis |= ('FT8FT4FT2WSPRCW'.search(md) <0 && document.getElementById('Other').checked);
		if(vis) refreshView(bandMode);
		if (bandMode == document.getElementById('mainTile').dataset.bm){
			refreshMain();
		}
	}
}

function refreshView(viewName){
	const bandMode = viewName.replace(' main','');
	const dataVignette = getDataVignette(bandMode);
	const stats = dataVignette?.getStats();
	if (stats.calls){
		let tileElement = document.getElementById('tileTrayGrid').querySelector('[data-bm="'+bandMode+'"]');
		if (!tileElement) {
			//console.log("Create tile for ", bandMode);
			tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
			tileElement.dataset.value = dataVignette.wavelength;
			tileElement.dataset.bm = bandMode;
			tileElement.addEventListener('click', (e) => {
				document.getElementById('mainTile').dataset.bm = e.target.closest('.tile').dataset.bm;
				refreshMain();
			});		
			let insertpos = null;
			for (const tile of document.querySelectorAll('.tile')){
				if (tile.dataset.value < dataVignette.wavelength) {
					insertpos = tile;
					break;
				}
			}
			tileTrayGrid.insertBefore(tileElement, insertpos);
			tileElement.querySelector('.tileTitle').textContent = bandMode;  			
		}
		tileElement.classList.remove('hidden');
		tileElement.querySelector('.tileSubtitle').innerText = `Total Calls:${stats.calls}`;
		const canvas = document.querySelector('[data-bm="'+bandMode+'"]').querySelector('canvas');
		const view = getView(bandMode, canvas, dataVignette, 400, 110);
		(getViewParams().setZoomToDataCarousel)? view.setZoomToData(): view.setZoomFullEarth();
		view.invalidate();
	} else {
		tileElement?.classList.add('hidden');
	}	 
}

function refreshMain(){
	const bandMode = document.getElementById('mainTile').dataset.bm;
	const dataVignette = getDataVignette(bandMode);
	const stats = dataVignette?.getStats();
	const tileElement = document.getElementById('tileTrayGrid').querySelector('[data-bm="'+bandMode+'"]');
	if(!tileElement.classList.contains('hidden')){
		document.getElementById('mainTile').classList.remove('hidden');
		const canvas = document.getElementById('mainCanvas');
		const view = getView(bandMode+' main', canvas, dataVignette, 1200, 50);
		if(getViewParams().setZoomToDataMain) view.setZoomToData();
		document.getElementById('clickTileMessage').classList.add('hidden');
		document.getElementById('mainViewTitle').innerText = bandMode;
		document.getElementById('mainViewSubTitle').innerText = `Total Calls:${stats.calls} Home Calls [Tx: ${stats.callsHomeTx} Rx:${stats.callsHomeRx} TxRx:${stats.callsHomeTxRx}] Connections [Simplex:${stats.simplex} Duplex:${stats.duplex} ]`;			
		view.invalidate();
	} else {
		document.getElementById('mainTile').classList.add('hidden');
	}
}

