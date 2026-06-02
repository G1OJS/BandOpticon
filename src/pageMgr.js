import {parseSquares, mhToLatLong} from './geoFuncs.js';
import {getView, clearAllViews, views} from './geoView.js';
import {getDataVignette, clearAllDataVignettes} from './dataMgr.js';
import {connectToFeed, mqttStatus} from './mqtt.js';

const uiFields = ['myCall', 'squaresList', 'mapCentreSquare'];
const uiCheckBoxesCommon = ['homeTx','homeRx','FT8','FT4','FT2','WSPR','CW','Other','setZoomToData',
							'showAllConnections','showOnlyDuplexConnections','showOnlyInvolvingThisCall','AzEq']
const uiClickables = ['tileTrayGrid','zoomFullEarthBtn','setZoomToDataBtn','zoomOutBtn','mainCanvas']

let pendingUpdates = new Set();
let viewParams = {'latlonCentre':{'lat':0,'lon':0}, 'spotSize':4, 'lineWidth':4, 'spotAlpha':0.7, 'lineAlpha': 0.8};

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
	const colours = JSON.parse(localStorage.getItem('colours'));
	document.getElementById('legendMarkerTx').style.background = colours.tx;
	document.getElementById('legendMarkerRx').style.background = colours.rx;
	document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
	
	for (const field of uiFields){
		const fieldElement = document.getElementById(field);
		const localStorageValue = localStorage.getItem(field);
		fieldElement.value = localStorageValue? localStorageValue.replaceAll('"',''):'';
		fieldElement.addEventListener('change', () => {
			localStorage.setItem(field, JSON.stringify(fieldElement.value));
		});
	}
	for (const cb of uiCheckBoxesCommon){
		const cbElement = document.getElementById(cb);
		let localStorageValue = localStorage.getItem(cb);
		if (localStorageValue !== undefined)  cbElement.checked = (localStorageValue == 'true');
		viewParams[cb] = cbElement.checked;
		cbElement.addEventListener('change', () => {
			localStorage.setItem(cb, cbElement.checked);
			viewParams[cb] = cbElement.checked;
			for (const bandMode of views.keys()) {pendingUpdates.add(bandMode);}
			refreshViews();
		});
	}
	for (const cbl of uiClickables) {
		document.getElementById(cbl).addEventListener('click', (e) => {

		});
	}
	document.getElementById('mainCanvas').addEventListener('mousemove', (e) => {
		views.get('mainCanvas')?.onMousemove(e);
	});
	
	connectToFeed(document.getElementById('squaresList').value, bands); 
	
	while (mqttStatus != 'Receiving') {
		document.getElementById('mqttStatus').innerText = mqttStatus;
		await new Promise(r => setTimeout(r, 250));
	}
	document.getElementById('mqttStatus').innerText ='';
	
	console.log(viewParams);
}

export function onDataUpdate(bandMode){
	pendingUpdates.add(bandMode);
}

const refresh = setInterval(() => {refreshViews()}, 250);

function refreshViews(){
	for (const bandMode of pendingUpdates) {
		document.getElementById('tileTrayGrid').querySelector("[id='"+bandMode+"']")?.classList.add('hidden');
		const md = bandMode.split(' ')[1];
		let vis = false;
		vis |= (md == 'FT8' && document.getElementById('FT8').checked);
		vis |= (md == 'FT4' && document.getElementById('FT4').checked);
		vis |= (md == 'FT2' && document.getElementById('FT2').checked);
		vis |= (md == 'WSPR' && document.getElementById('WSPR').checked);
		vis |= (md == 'CW' && document.getElementById('CW').checked);
		vis |= ('FT8FT4FT2WSPRCW'.search(md) <0 && document.getElementById('Other').checked);
		if(vis) refreshView(bandMode);
	}
	pendingUpdates = new Set();
}

function refreshView(bandMode){
	const dataVignette = getDataVignette(bandMode);
	const stats = dataVignette?.getStats();
	if (!stats) return;
	
	if (stats.calls > 0){
		let tileElement = document.getElementById('tileTrayGrid').querySelector("[id='"+bandMode+"']");
		if (!tileElement) {
			console.log("Create tile for ", bandMode);
			tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
			tileElement.dataset.value = dataVignette.wavelength;
			let insertpos = null;
			for (const tile of document.querySelectorAll('.tile')){
				if (tile.dataset.value < dataVignette.wavelength) {
					insertpos = tile;
					break;
				}
			}
			tileTrayGrid.insertBefore(tileElement, insertpos);
			tileElement.querySelector('.tileTitle').textContent = bandMode;  
			tileElement.id = bandMode;				
		}
		tileElement.classList.remove('hidden');
		tileElement.querySelector('.tileSubtitle').innerText = `Total Calls:${stats.calls}`;	
		const view = getView(tileElement.id, dataVignette, 400, 110);
		view.invalidate();
	} 
	
	if (bandMode == document.getElementById('mainViewTitle').innerText){
		const canvas = document.getElementById("mainCanvas");
		const view = getView('mainCanvas', dataVignette, 1200, 50);
		document.getElementById('clickTileMessage').classList.add('hidden');
		document.getElementById('mainViewSubTitle').innerText = `Total Calls:${stats.calls} Home Calls [Tx: ${stats.callsHomeTx} Rx:${stats.callsHomeRx} TxRx:${stats.callsHomeTxRx}] Connections [Simplex:${stats.simplex} Duplex:${stats.duplex} ]`;			
		view.invalidate();		
	} 	
	
	
}

