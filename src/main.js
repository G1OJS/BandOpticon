import {connectToFeed} from './mqtt.js';
import {loadConfig} from './config.js';
import {startRibbon} from './ribbon.js'
import {activeCanvases, updateChartForView} from './plots.js'

export var view = "Overview";

export const colours =   {tx:'rgba(230, 30, 30, .3)', 	rx:		'rgba(30, 230, 30, .3)',	txrx:'rgba(20, 20, 250, .3)',
						  txhl:'rgba(255, 0, 0, 1)', 	rxhl:	'rgba(0, 255, 0, 1)',		txrxhl:'rgba(0, 0, 255, 1)',
					conn:'rgba(150, 150, 250, .2)' , connhl: 'red'
					};

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

for (let bandIdx =0;bandIdx<20;bandIdx++){
	let canvas_id = 'bandTile_'+bandIdx;
	document.getElementById(canvas_id).addEventListener("click", function (e) {switchView(parseInt(canvas_id.split("_")[1]))});
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
	
	updateChartForView(tile_idx);
}
