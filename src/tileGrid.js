import {updateSquaresList, colours} from './config.js';
import {geoChart} from './geoChart.js';
import {connectToFeed} from './mqtt.js';

const ribbon = document.querySelector('#ribbon');
const tray = document.querySelector('#mainViewTray');
const tilesGrid = document.querySelector('#tilesGrid');
const sideBar = document.querySelector('#sideBar');

let nColumns = null;
let tileInstances = null;
let singleViewTileElement = false;
export let myCall = null;

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

document.getElementById('homeButton').addEventListener("click", () => {loadHomeView();});	
document.getElementById('homeSquaresInput').addEventListener('change', () => {updateSquaresList(); resetTileGrid(); connectToFeed();});
document.getElementById('moreColumns').addEventListener("click", () => {nColumns += (nColumns <10); tilesGrid.setAttribute("style", "grid-template-columns: repeat("+nColumns+",1fr)");});
document.getElementById('fewerColumns').addEventListener("click", () => {nColumns -= (nColumns >1); tilesGrid.setAttribute("style", "grid-template-columns: repeat("+nColumns+",1fr)");});
ribbon.addEventListener('click', () => {loadHomeView()}); // catches changes to mode filters
tray.addEventListener('click', e =>   { if(e.target.dataset.action == 'restore') tileInstances.get(e.target.dataset.name).restore(); } );
sideBar.addEventListener('click', e =>   { myCall = e.target.dataset.name; for (const tileElement of tilesGrid.querySelectorAll('.tile:not(.hidden)')) {tileInstances.get(tileElement.dataset.name).geoChart.redraw()};  } );

setInterval(() => sortTilesAndButtons(), 900);
setInterval(() => updateTileStats(), 900);
setInterval(() => updateHomeCalls(), 900);

resetTileGrid();


export function addSpot(spot, senderIsInHome, receiverIsInHome) {
	let bandMode = spot.b+" "+spot.md;
	let tileInstance = tileInstances.get(bandMode);
	if(!tileInstance) {
		tileInstance = new tile(bandMode, restoreFromSingleView);
		tileInstances.set(bandMode, tileInstance);
		tileInstance.setVisibility();
	}
	let sRecord = {call:spot.sc, p:null, sq:spot.sl, tx:true, rx:false, isInHome:senderIsInHome};
	let rRecord = {call:spot.rc, p:null, sq:spot.rl, tx:false, rx:true, isInHome:receiverIsInHome};
	tileInstance.geoChart.recordConnection(sRecord, rRecord);
	tileInstance.geoChart.retouchHighlights();
}

function resetTileGrid(){
	tileInstances = new Map();
	for (const el of document.querySelectorAll('.tile')) el.remove();
	loadHomeView();
}

function loadHomeView(){
	nColumns = 3;
	tilesGrid.setAttribute("style", "grid-template-columns: 1fr 1fr 1fr;");	
	for (const tileElement of tilesGrid.querySelectorAll('.tile')) {tileInstances.get(tileElement.dataset.name).restore();}	
}

function restoreFromSingleView() { // same as loading Home view but don't reset nColumns and don't restore tiles minimised to tray
	for (const tileElement of tilesGrid.querySelectorAll('.tile')) {
		let btnElement = mainViewTray.querySelector('[data-name="'+tileElement.dataset.name+'"]');
		if(!btnElement) tileInstances.get(tileElement.dataset.name).restore();
	}
	tilesGrid.setAttribute("style", "grid-template-columns: repeat("+nColumns+", 1fr");
}

function sortTilesAndButtons() {
    const tileInstancesOrdered = Array.from(tileInstances).sort((a, b) => b[1].wavelength - a[1].wavelength);
    for (const t of tileInstancesOrdered) {
		tilesGrid.append(t[1].tileElement);
		mainViewTray.append(t[1].btnElement || '');
	}
}

function updateTileStats(){
	for (const tileElement of tilesGrid.querySelectorAll('.tile')){
		let tileInstance = tileInstances.get(tileElement.dataset.name);
		tileInstance.tileInfoElement.textContent = tileInstance.geoChart.getStats();
	}
}

function updateHomeCalls(){
	let homeCalls = new Set();
	for (const tileElement of tilesGrid.querySelectorAll('.tile:not(.hidden)')){
		for (const call of tileInstances.get(tileElement.dataset.name).geoChart.callRecords) {
			if (call[1].isInHome) homeCalls.add(call[0]);
		}
	}
	let html='';
	for (const homeCall of Array.from(homeCalls).sort()) {
		let hl = (homeCall == myCall)? "hlCall":"";
		html += "<span data-name = "+homeCall +" class = '"+hl+"'>"+homeCall+"</span><br>";
	}
	document.getElementById('sideBar').innerHTML = html;
}

class tile{
	constructor(tileTitleText, restoreFromSingleView) {
		console.log("Create tile "+tileTitleText);
		this.tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
		document.querySelector('#tilesGrid').append(this.tileElement);
		this.btnElement = false;
		this.name = tileTitleText;
		this.tileElement.dataset.name = tileTitleText;
		this.tileTitleElement = this.tileElement.querySelector('.tileTitle');  
		this.tileTitleElement.textContent = tileTitleText;
		this.tileInfoElement = this.tileElement.querySelector('.tileInfo');
		this.canvasElement = this.tileElement.querySelector('canvas');
		this.restoreFromSingleView = restoreFromSingleView;
		this.geoChart = new geoChart(this.canvasElement);
		
		let band = this.tileTitleElement.textContent.split(" ")[0];
		let wl = parseInt(band.split("m")[0]);
		if (band.search("cm") > 0) wl /= 100;
		this.wavelength = wl;

		this.tileElement.addEventListener("mousemove", e => {this.geoChart.showInfo(e, this.canvasElement)}); 
		this.tileElement.addEventListener("click", e => {	
			//console.log(e.target.dataset.action);
			if(e.target.dataset.action == 'minimise') this.minimise();
			if(e.target.dataset.action == 'maximise') this.maximise();
			if(e.target.dataset.action == 'back') this.restoreFromSingleView();
			if(e.target.dataset.action == 'zoomIn') this.geoChart.zoom('zoomIn', e);
			if(e.target.dataset.action == 'resetZoom') this.geoChart.zoom('reset', e);
		});
	}
	addTrayButton(){
		if(this.btnElement) return;
		this.btnElement = document.createElement('button');
		this.btnElement.classList.add('control', 'trayButton');
		this.btnElement.dataset.action = 'restore';
		this.btnElement.dataset.name = this.name;
		this.btnElement.textContent = this.name;
		mainViewTray.appendChild(this.btnElement);
	}
	removeTrayButton(){
		if(!this.btnElement) return;
		this.btnElement.remove();	
		this.btnElement = false;
	}
	setVisibility(){
		let tileMode = this.name.split(" ")[1];
		let toHide = false;
		if(tileMode == 'FT8' && !document.getElementById('FT8').checked) toHide = true;
		if(tileMode == 'FT4' && !document.getElementById('FT4').checked) toHide = true;
		if(tileMode == 'WSPR' && !document.getElementById('WSPR').checked) toHide = true;
		if('FT8FT4WSPR'.search(tileMode) <0 && !document.getElementById('Other').checked) toHide = true;
		if(singleViewTileElement && singleViewTileElement != this.tileElement) toHide = true;
		if(toHide) {
			this.tileElement.classList.add('hidden');
			if(this.btnElement) this.btnElement.classList.add('hidden');
		} else {
			this.tileElement.classList.remove('hidden');
			if(this.btnElement) this.btnElement.classList.remove('hidden');
		}	
	}
	restore() {
		this.tileElement.querySelector('.back').classList.add('hidden'); 
		this.tileElement.querySelector('.maximise').classList.remove('hidden');
		this.tileElement.querySelector('.minimise').classList.remove('hidden');
		this.removeTrayButton();
		singleViewTileElement = false;
		this.setVisibility();
	}
	minimise(){
		this.tileElement.classList.add('hidden');
		this.addTrayButton();
	}
	maximise(){
		this.tileElement.querySelector('.back').classList.remove('hidden');
		this.tileElement.querySelector('.maximise').classList.add('hidden');
		this.tileElement.querySelector('.minimise').classList.add('hidden');
		for (const tileElement of tilesGrid.querySelectorAll('.tile')) {
			if(tileElement.dataset.name !=this.name) tileElement.classList.add('hidden');
		}
		tilesGrid.setAttribute("style", "grid-template-columns: 1fr");	
		singleViewTileElement = this.tileElement;
	}	
}
