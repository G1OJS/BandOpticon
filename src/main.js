import {connectToFeed} from './mqtt.js';
import {loadConfig, myCall, updateSquaresList, updateMyCall} from './config.js';
import {tile} from './plots.js'

const ribbon = document.querySelector('#ribbon');
const mainViewTray = document.querySelector('#mainViewTray');
const mainView = document.querySelector('#mainView');
const tilesGrid = document.querySelector('#tilesGrid');
let nColumns = null;
let tileInstances = null;
setInterval(() => sortTiles(), 900);
setInterval(() => setHeight(), 1100);

resetApp();
loadConfig();
connectToFeed();

export const colours =   {tx:'rgba(200, 30, 30, .4)', 	rx:		'rgba(30, 200, 30, .4)',	txrx:'rgba(20, 20, 200, .4)',
						  txhl:'rgba(255, 0, 0, 1)', 	rxhl:	'rgba(0, 255, 0, 1)',		txrxhl:'rgba(0, 0, 255, 1)',
						conn:'rgba(80, 180, 250, .2)' , connhl: 'rgba(50, 50, 250, .6)',
						map:'rgba(0,0,0,0.3)'};

export function addSpot(spot) {
	let bandMode = spot.b+" "+spot.md;
	let tileInstance = tileInstances.get(bandMode);
	if(!tileInstance) {
		tileInstance = new tile(bandMode, restoreFromSingleView);
		tileInstances.set(bandMode, tileInstance);
		tileInstance.setVisibility();
	}
	let isHl = (spot.sc == myCall || spot.rc == myCall);
	let sInfo = {call:spot.sc, sq:spot.sl, tx:true, rx:false, isHl:isHl};
	tileInstance.recordCall(sInfo, false);
	let rInfo = {call:spot.rc, sq:spot.rl, tx:false, rx:true, isHl:isHl};
	tileInstance.recordCall(rInfo, false);
	tileInstance.recordConnection(sInfo,rInfo);
	tileInstance.retouchHighlights();
}

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

document.getElementById('homeButton').addEventListener("click", () => {loadHomeView();});	
document.getElementById('myCallInput').addEventListener('change', () => { updateMyCall(); resetApp();});
document.getElementById('homeSquaresInput').addEventListener('change', () => {updateSquaresList(); resetApp();});
document.getElementById('moreColumns').addEventListener("click", () => {nColumns += (nColumns <10); tilesGrid.setAttribute("style", "grid-template-columns: repeat("+nColumns+",1fr)");});
document.getElementById('fewerColumns').addEventListener("click", () => {nColumns -= (nColumns >1); tilesGrid.setAttribute("style", "grid-template-columns: repeat("+nColumns+",1fr)");});
ribbon.addEventListener('click', () => {loadHomeView()});
mainViewTray.addEventListener('click', e =>   { if(e.target.dataset.action == 'restore') tileInstances.get(e.target.dataset.name).restore(); } );

function resetApp(){
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

function sortTiles() {
    const tileInstancesOrdered = Array.from(tileInstances).sort((a, b) => b[1].wavelength - a[1].wavelength);
    for (const t of tileInstancesOrdered) {
		tilesGrid.append(t[1].tileElement);
		let btnElement = mainViewTray.querySelector('[data-name="'+t[1].tileElement.dataset.name+'"]');
		if(btnElement) mainViewTray.append(btnElement);
	}
}

function setHeight(){
	let vh	=  window.innerHeight || document.documentElement.clientHeight;
	let app =  parseInt(document.getElementById('app').offsetHeight);
	let rib =  parseInt(document.getElementById('ribbon').offsetHeight);
	let tray=  parseInt(document.getElementById('mainViewTray').offsetHeight);
	let foot=  parseInt(document.getElementById('footer').offsetHeight);
	let misc=  100;
	let maxh = vh-rib-tray-foot-misc;
	document.getElementById('scrollContainer').style.maxHeight = maxh+"px";	
}
