import {connectToFeed} from './mqtt.js';
import {loadConfig} from './config.js';
import {startRibbon} from './ribbon.js'
import {charts, toggleZoomToDataRange} from './plots.js'

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
document.getElementById('maximiseGridView').addEventListener("click", function (e) {maximiseGridView('fewer')});
document.getElementById('restoreGridView').addEventListener("click", function (e) {restoreGridView('fewer')});

setInterval(() => sortAndUpdateTiles(), 1000);

for (const el of document.querySelectorAll('.bandCanvas'))		{ el.addEventListener("click", function (e) {drillIn(el)}); }
for (const el of document.querySelectorAll('.bandTileTitle'))	{ el.addEventListener("click", function (e) {minimiseTile(el)});}
for (const el of document.querySelectorAll('.trayButton'))		{ 
	if(el.id == 'tray_All')  {
		el.addEventListener("click", function (e) {restoreAll()}); 
	} else {
		el.addEventListener("click", function (e) {restoreTile(el)}); 
	}
}

function minimiseTile(el){
	el.parentElement.classList.add('hidden');
	let idx = el.id.split("_")[1];
	let trayEl = document.getElementById('tray_'+idx)
	trayEl.innerHTML = " "+el.innerHTML.split(" ")[0];
	trayEl.classList.remove('hidden')
}
function restoreTile(trayEl){
	console.log("restore "+trayEl.id); 	
	let idx = trayEl.id.split("_")[1];
	trayEl.classList.add('hidden');
	let gridEl = document.getElementById('bandTile_'+idx)
	gridEl.classList.remove('hidden')
	view="Overview";
}
function drillIn(bandTile_el){
	if(view == "Single") {
		toggleZoomToDataRange(bandTile_el);
	} else {
		hideAllExcept(bandTile_el);
		view = "Single"
		const el = document.getElementById('bandsGrid');
		el.setAttribute("style", "grid-template-columns: 1fr;");
	}
}
function hideAllExcept(bandTile_el){
	for (const el of document.querySelectorAll('.bandTileTitle')) {
		if(el.innerHTML!=""){
			let idx = el.id.split('_')[1];
			if(idx  != bandTile_el.id.split('_')[1]) minimiseTile(el);
		}
	}
}
function restoreAll(){
	for (const el of document.querySelectorAll('.trayButton')) {
		if(el.id != 'tray_All' && el.innerHTML !="") restoreTile(el);
	};
	const el = document.getElementById('bandsGrid');
	el.setAttribute("style", "grid-template-columns: 1fr 1fr 1fr;");
	nColumns = 3;
}

function maximiseGridView(){
	document.getElementById('maximiseGridView').classList.add('hidden');
	document.getElementById('restoreGridView').classList.remove('hidden');
	for (const el of document.querySelectorAll('.hideForMaxView')) el.classList.add('hidden');
}
function restoreGridView(){
	document.getElementById('maximiseGridView').classList.remove('hidden');
	document.getElementById('restoreGridView').classList.add('hidden');
	for (const el of document.querySelectorAll('.hideForMaxView')) el.classList.remove('hidden');
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

function sortAndUpdateTiles(){
	const container = document.getElementById('bandsGrid');
	const orderedBands = Array.from(charts.keys()).sort(function(a, b){return wavelength(b) - wavelength(a)}); 
	for (const band of orderedBands){
		let chart = charts.get(band);
		let idx = chart.canvas.id.split("_")[1];
		container.appendChild(document.getElementById('bandTile_'+idx));
		chart.update('none');
	};
	setMainViewHeight();
	let nVis = 0;
	for (const el of document.querySelectorAll('.trayButton')) {
		if(!el.classList.contains('hidden')) nVis +=1;
	}
	if(nVis>2) {
		document.getElementById('tray_All').classList.remove('hidden');
	} else {
		document.getElementById('tray_All').classList.add('hidden');
	}
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