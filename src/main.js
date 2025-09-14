import {connectToFeed} from './mqtt.js';
import {loadConfig} from './config.js';
import {startRibbon} from './ribbon.js'
import {activeCanvases, updateChartForView} from './plots.js'

export var view = "Overview";
var nColumns = 3;

export const colours =   {tx:'rgba(230, 30, 30, .3)', 	rx:		'rgba(30, 230, 30, .3)',	txrx:'rgba(20, 20, 250, .3)',
						  txhl:'rgba(255, 0, 0, 1)', 	rxhl:	'rgba(0, 255, 0, 1)',		txrxhl:'rgba(0, 0, 255, 1)',
					conn:'rgba(150, 150, 250, .2)' , connhl: 'rgba(50, 50, 250, .8)'
					};

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

for (let bandIdx =0;bandIdx<20;bandIdx++){
	let canvas_id = 'bandTile_'+bandIdx;
	document.getElementById(canvas_id).addEventListener("click", function (e) {switchView(parseInt(canvas_id.split("_")[1]))});
}

export function setMainViewHeight(){
	let happ = document.getElementById('app').clientHeight;
	let h = happ-20;
	for (const elId of ['ribbon', 'mainViewTitle', 'mainViewRibbon', 'footer']){
		let el = document.getElementById(elId);
		h -= (el.clientHeight + 40);
	}
	let el = document.getElementById('scrollContainer')
	el.style.height = h+"px";
}

document.getElementById('moreColumns').addEventListener("click", function (e) {changeGrid('more')});
document.getElementById('fewerColumns').addEventListener("click", function (e) {changeGrid('fewer')});

function changeGrid(direction){
	if(view !="Overview") return;
	
	if (direction == "more") nColumns += (nColumns <10);
	if (direction == "fewer") nColumns -= (nColumns >1);
	const el = document.getElementById('bandsGrid');
	el.setAttribute("style", "grid-template-columns: repeat("+nColumns+",1fr)");
	console.log(document.getElementById('bandsGrid').elementStyle);
}

loadConfig();
connectToFeed();
startRibbon();

function switchView(tile_idx){
	view = (view == "Overview")? tile_idx: "Overview";
	
	for (let idx =0;idx<20;idx++){
		let hide = true;
		if (view =="Overview" && activeCanvases.has(idx)) hide = false;
		if (view !="Overview" && idx == tile_idx) hide = false;
		let tile = document.getElementById('bandTile_'+idx); 
		if (hide) {tile.classList.add('hidden')} else {tile.classList.remove('hidden')};
	}
	
	const el = document.getElementById('bandsGrid');
	if(view == "Overview"){
		el.setAttribute("style", "grid-template-columns: repeat("+nColumns+",1fr)");
	} else {
		el.setAttribute("style", "grid-template-columns: 1fr;");
	}
	
	updateChartForView(tile_idx);
}
