import {connectToFeed} from './mqtt.js';
import {loadConfig} from './config.js';
import Ribbon from './ribbon.js';

const ribbon = new Ribbon({
  onModeChange: refreshMainView,
  onConfigChange: refreshMainView,
  onBandsChange: refreshMainView
 });

function refreshMainView( canvas_id_clicked = null ){
	if(canvas_id_clicked){
		for (let bandIdx =0;bandIdx<20;bandIdx++){
			document.getElementById('bandTile_'+bandIdx).classList.add("hidden");
		}
		view = (view == "Overview")? "Single":"Overview";
		if (view == "Single") {
			ribbon.setWatchedBands(charts[canvas_id_clicked]['band']);
		}
	}
	
	if(view == "Overview"){
		ribbon.setWatchedBands();
		document.getElementById("bandsGrid").style = "grid-template-columns:1fr 1fr 1fr;"
		document.getElementById("mainViewTitle").innerHTML="Bands Overview";
	} else {
		document.getElementById("bandsGrid").style = "grid-template-columns:1fr"
		document.getElementById("mainViewTitle").innerHTML="Band detail";	
	}
}

//setInterval(() => refreshMainView(), 5000);

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

let view = "Overview";
loadConfig();
connectToFeed();
refreshMainView();


