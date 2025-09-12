import {connectToFeed} from './mqtt.js';
import {loadConfig} from './config.js';
import {startRibbon} from './ribbon.js'

const colours =   {tx:'rgba(250, 20, 20, .3)', 	rx:		'rgba(20, 250, 20, .3)',		txrx:'rgba(20, 20, 250, .3)',
					conn:'rgba(150, 150, 250, .2)' , connMe: 'red'
					};

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

for (let bandIdx =0;bandIdx<20;bandIdx++){
	let canvas_id = 'bandTileCanvas_'+bandIdx;
	//document.getElementById(canvas_id).addEventListener("click", function (e) {refreshMainView(canvas_id)});
}

loadConfig();
connectToFeed();
startRibbon();


