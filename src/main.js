import {connectToFeed} from './mqtt.js';
import {loadConfig} from './config.js';
import {startRibbon} from './ribbon.js'
import {charts, toggleZoomToDataRange} from './plots.js'

for (let idx=0;idx<20;idx++) {
  var tile  = document.querySelector('.bandTileTemplate').content.cloneNode(true);
  document.querySelector('#bandsGrid').appendChild(tile);
}
export const freeTiles = Array.from(document.querySelectorAll('.bandTile')); 

function bandOf(el) 	{return el.closest('.bandTile')?.dataset.band ?? null;}
function actionOf(el) 	{return el.dataset.action || null;}

export var view = "Overview";
var nColumns = 3;

export const colours =   {tx:'rgba(230, 30, 30, .3)', 	rx:		'rgba(30, 230, 30, .3)',	txrx:'rgba(20, 20, 250, .3)',
						  txhl:'rgba(255, 0, 0, 1)', 	rxhl:	'rgba(0, 255, 0, 1)',		txrxhl:'rgba(0, 0, 255, 1)',
					conn:'rgba(150, 150, 250, .2)' , connhl: 'rgba(50, 50, 250, .8)'
					};

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;
document.getElementById('moreColumns').addEventListener("click", function (e) {addRemoveColumns('more')});
document.getElementById('fewerColumns').addEventListener("click", function (e) {addRemoveColumns('fewer')});


setInterval(() => sortAndUpdateTiles(), 1000);

const mainView = document.querySelector('#mainView');
const bandsGrid = document.querySelector('#bandsGrid');
const mainViewTray = document.querySelector('#mainViewTray');
document.querySelector('#bandsGrid').addEventListener('click', e => {if(actionOf(e.target)=='minimise') minimiseTile(e.target.closest('.bandTile'));});
document.querySelector('#mainViewTray').addEventListener('click', e => {if(e.target.classList?.contains('trayButton')) restoreTile(e.target);});
document.querySelector('#bandsGrid').addEventListener('click', e => {if(actionOf(e.target)=='drillIn') drillInTile(e.target.closest('.bandTile'));});
document.querySelector('#mainView').addEventListener('click', e => {if(actionOf(e.target)=='home') restoreAll();});

document.querySelector('#mainViewTray').addEventListener("click", e => {if(actionOf(e.target)=='maximiseGridView') maximiseGridView(e.target)});
document.querySelector('#mainViewTray').addEventListener("click", e => {if(actionOf(e.target)=='restoreGridView') restoreGridView(e.target);});

function minimiseTile(el) {
  const band = el.dataset.band;
  el.style.display = 'none';
  let btn = mainViewTray.querySelector(`[data-band="${band}"]`);
  if (!btn) {
    btn = document.createElement('button');
	btn.classList.add('trayButton', 'control');
    btn.dataset.band = band;
    btn.textContent = band;
    mainViewTray.appendChild(btn);
//	if(mainViewTray.querySelectorAll('.trayButton').length > 2) //activate home button
  }
}
function maximiseGridView(clicked){
	clicked.nextElementSibling.classList.remove('hidden');
	clicked.classList.add('hidden');
	for (const el of document.querySelectorAll('.hideForMaxView')) el.classList.add('hidden');
}
function restoreGridView(clicked){
	clicked.previousElementSibling.classList.remove('hidden');
	clicked.classList.add('hidden');
	for (const el of document.querySelectorAll('.hideForMaxView')) el.classList.remove('hidden');
}
function restoreAll(el){
	for (const el2 of document.querySelectorAll('.trayButton')) {restoreTile(el2);};
	for (const el2 of document.querySelectorAll('.bandTile')) {el2.querySelector('.home').classList.add('hidden'); el2.querySelector('.maximise').classList.remove('hidden');}
	bandsGrid.setAttribute("style", "grid-template-columns: 1fr 1fr 1fr;");
	nColumns = 3;
	view="Overview";
	sortAndUpdateTiles();
}
function restoreTile(el) {
  const band = el.dataset.band;
  let tile_el = bandsGrid.querySelector(`[data-band="${band}"]`);
  tile_el.style.display = '';
  el.remove();
  view="Overview";
}
function drillInTile(el){
	if(view == "Single") {
		toggleZoomToDataRange(el);
	} else {
		hideAllExcept(el);
		view = "Single"
		bandsGrid.setAttribute("style", "grid-template-columns: 1fr;");
	}
}
function hideAllExcept(el){
	el.querySelector('.home').classList.remove('hidden');
	el.querySelector('.maximise').classList.add('hidden');
	const band = el.dataset.band;
	for (const el2 of document.querySelectorAll('.bandTile')) {
		if(el2.dataset.band && el2.dataset.band !=band) minimiseTile(el2);
	}
}
	
export function setMainViewHeight(){
	let happ = document.getElementById('app').clientHeight;
	let h = happ-20;
	for (const elId of ['ribbon', 'mainViewTray', 'footer']){
		let el = document.getElementById(elId);
		h -= (el.clientHeight + 40);
	}
	let el = document.getElementById('scrollContainer')
	el.style.height = h+"px";
}

function addRemoveColumns(direction){
	if(view !="Overview") return;
	if (direction == "more") nColumns += (nColumns <10);
	if (direction == "fewer") nColumns -= (nColumns >1);
	const el = document.getElementById('bandsGrid');
	el.setAttribute("style", "grid-template-columns: repeat("+nColumns+",1fr)");
	console.log(document.getElementById('bandsGrid').elementStyle);
}

function sortAndUpdateTiles() {
    const container = document.getElementById('bandsGrid');
    const orderedBands = Array.from(charts.keys()).sort((a, b) => wavelength(b) - wavelength(a));
    for (const band of orderedBands) {
        const chart = charts.get(band);
        const tile  = document.querySelector(`.bandTile[data-band="${band}"]`);
        chart.update('none');
        if(view == "Overview") toggleZoomToDataRange(chart.canvas, true);
        container.appendChild(tile);
    }
    setMainViewHeight();
}

function wavelength(band) {
    let wl = parseInt(band.split("m")[0]);
    if (band.search("cm") > 0) {
        return wl / 100
    } else {
        return wl
    }
}


loadConfig();
connectToFeed();
startRibbon();