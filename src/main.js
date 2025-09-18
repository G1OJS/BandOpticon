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

export var view = "Home";
var nColumns = 3;

function ceilingXbyY(x,y){
	return (x>y)? y:x;
}
function floorXbyY(x,y){
	return (x<y)? y:x;
}

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
document.querySelector('#mainViewTray').addEventListener('click', e => {if(e.target.classList?.contains('bandButton')) restoreTile(e.target);});
document.querySelector('#bandsGrid').addEventListener('click', e => {if(actionOf(e.target)=='setSingleOrZoom') setSingleOrZoom(e.target.closest('.bandTile'));});
document.querySelector('#mainView').addEventListener('click', e => {if(actionOf(e.target)=='home') restoreAll(e.target);}); 	// split here to remember columns and tray bands

document.querySelector('#mainViewTray').addEventListener("click", e => {if(actionOf(e.target)=='hideHeaderAndFooter') hideHeaderAndFooter(e.target)});
document.querySelector('#mainViewTray').addEventListener("click", e => {if(actionOf(e.target)=='restoreHeaderAndFooter') restoreHeaderAndFooter(e.target);}); // 

function hideHeaderAndFooter(clicked){
	clicked.nextElementSibling.classList.remove('hidden');
	clicked.classList.add('hidden');
	for (const el of document.querySelectorAll('.hideForMaxView')) el.classList.add('hidden');
}
function restoreHeaderAndFooter(clicked){
	clicked.previousElementSibling.classList.remove('hidden');
	clicked.classList.add('hidden');
	for (const el of document.querySelectorAll('.hideForMaxView')) el.classList.remove('hidden');
}

function checkMinimisedBands(){
	let homeButton = document.getElementById('home-button');
	let nHidden = mainViewTray.querySelectorAll('.bandButton').length;
	console.log("nHidden "+nHidden);
	if(nHidden > 2) {homeButton.classList.remove("inactive");} else {homeButton.classList.add("inactive");}
}

function minimiseTile(el) {
  const band = el.dataset.band;
  el.classList.add('hidden');
  let btn = mainViewTray.querySelector(`[data-band="${band}"]`);
  if (!btn) {
    btn = document.createElement('button');
	btn.classList.add('control', 'windowBarButton', 'bandButton');
    btn.dataset.band = band;
    btn.textContent = band;
    mainViewTray.appendChild(btn);
	checkMinimisedBands();
  }
}
function restoreAll(el){
	// split here to remember columns and tray bands
	console.log("Restore all");
	resetTileControls(el);
	for (const el of document.querySelectorAll('.bandButton')) {restoreTile(el);};
	checkMinimisedBands();
}
function resetTileControls(tile_el){
	tile_el.querySelector('.home').classList.add('hidden'); 
	tile_el.querySelector('.maximise').classList.remove('hidden');
	tile_el.querySelector('.minimise').classList.remove('hidden');
	tile_el.querySelector('canvas').style = 'cursor:default;';
}
function restoreTile(btn_el) {
    const band = btn_el.dataset.band;
	console.log("Restore "+band);
    let tile_el = bandsGrid.querySelector(`[data-band="${band}"]`);
    tile_el.classList.remove('hidden');
	resetTileControls(tile_el);
    btn_el.remove();
    view="Home";
	document.getElementById('moreColumns').classList.remove("inactive");
	document.getElementById('fewerColumns').classList.remove("inactive");
	nColumns = 3;
	bandsGrid.setAttribute("style", "grid-template-columns: 1fr 1fr 1fr;");
	sortAndUpdateTiles();
	checkMinimisedBands();
}
function setSingleOrZoom(el){
	if(view == "Single") {
		let z = toggleZoomToDataRange(el);
		let c = el.querySelector('canvas');
		if(z == 'in') {c.style = 'cursor:zoom-out;';} else {c.style = 'cursor:zoom-in;';}  
	} else {
		view = "Single"
		el.querySelector('.home').classList.remove('hidden');
		el.querySelector('.maximise').classList.add('hidden');
		el.querySelector('.minimise').classList.add('hidden');
		const band = el.dataset.band;
		for (const el2 of document.querySelectorAll('.bandTile')) {
			if(el2.dataset.band && el2.dataset.band !=band) minimiseTile(el2);
		}
		document.getElementById('home-button').classList.remove("inactive");
		document.getElementById('moreColumns').classList.add("inactive");
		document.getElementById('fewerColumns').classList.add("inactive");
		bandsGrid.setAttribute("style", "grid-template-columns: 1fr;");	
		el.querySelector('canvas').style = 'cursor:zoom-in;';
		console.log("Set view single");
	}
	checkMinimisedBands();
}
export function setMainViewHeight(){
	let happ = document.getElementById('app').clientHeight;
	let h = happ-20;
	for (const elId of ['ribbon', 'mainViewTray', 'footer']){
		let el = document.getElementById(elId);
		h -= (el.clientHeight + 40);
	}
	h = ceilingXbyY(h, document.getElementById('app').clientWidth);
	let el = document.getElementById('scrollContainer')
	el.style.height = h+"px";
}

function addRemoveColumns(direction){
	if(view !="Home") return;
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
        if(view == "Home") toggleZoomToDataRange(chart.canvas, true);
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