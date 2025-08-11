	import {addSpotToConnectivityMap} from '../lib/conns-data.js';
	import * as STORAGE from '../lib/store-cfg.js';
	import {squareIsInHome} from '../lib/geo.js';
	import {graph1} from '../views/common.js';

	var DOMcontainer = null;
	let getMode = () => null;
	let mode = null;

	let historicConnsData = {}

	export function init(container, band, opts = {}) {
		DOMcontainer = container;
		getMode = opts.getWatchedMode;
		mode = getMode();
		internal_refresh(); // keeps this away from the periodic refresh
	}

	export function refresh(){
	   // does nothing
	}

	let dummyCallsigns = ['AllTXT1','AllTXT2'];

	function internal_refresh(){

		const bandModeData = historicConnsData;
		if(!bandModeData){return}
		mode = getMode();

		let HTML = ""
		HTML +=  '<h2>WSJT-X ALL File Analysis for ' + mode +'</h2>';
		HTML += "<div class = 'text-sm'>";
		HTML += "This is a new view (still being developed) "
		HTML += ""
		HTML += ""
		
		HTML += '<br><br>Experimental - import Rx spots from WSJT-X ALL.txt files: '
		for (const rc of dummyCallsigns){
			HTML += '<br>ALL file for '+rc+' <input type="file" id="allFileChooser_'+rc.trim()+'" accept="*.txt" />'
			HTML += ' <button id = "delete_'+rc.trim()+'">Delete data</button>'
		}
		HTML += "</div><br>";
		HTML += "<canvas id='graph1' style='width:100%;max-width:700px'></canvas>"
		DOMcontainer.innerHTML = HTML;
		
		for (const rc of dummyCallsigns){
			const inputElement = document.getElementById('allFileChooser_'+rc.trim());
			inputElement.addEventListener("change", handleFileSelection);
			const deleteButton = document.getElementById('delete_'+rc.trim());
			deleteButton.addEventListener("click", handleDelete);
		}	
		

		graph1('graph1', historicConnsData, mode, dummyCallsigns);
	}

	function handleFileSelection(event){
		const fileList = event.target.files;
		const id = event.target.id;
		const reader = new FileReader();
		reader.onload = () => {
			let rr = reader.result;
			load_ALL_file(rr,id.split("_")[1]);
		}
		console.log(fileList[0]);
		reader.readAsText(fileList[0]);
	}

	function handleDelete(event){
		const id = event.target.id;
		let call = id.split("_")[1];
		for (const band in historicConnsData) {
			for (const mode in historicConnsData[band]) {
				const Rx_calls = historicConnsData[band][mode].Rx;
				const others = Rx_calls[call];
				const toDelete = [];
				for (const otherCall in others) { toDelete.push(otherCall)}
				toDelete.forEach(otherCall => delete others[otherCall]);					
			}
		}
		internal_refresh();
	}


  function getBand(MHz){
	let fMHz = parseFloat(MHz);
	let i = [1.8,3.5,5,7,10,14,17,21,24,28,50,70,144,430].findIndex(f => f > MHz);  
	return [false,"160m","80m","60m","40m","30m","20m","18m","15m","12m","10m","6m","4m","2m","70cm"][i];
  }
  
  function getEpoch(dt_str_utc){
	let d = dt_str_utc;
	let dt = new Date(Date.UTC("20"+d.slice(0,2),d.slice(2,4)-1,d.slice(4,6),d.slice(7,9),d.slice(9,11),d.slice(11,13)));
	let epoch_from_utc = dt.valueOf() / 1000
	return epoch_from_utc;  
  }
  
  function getSquare(sq){
	// get square from the last entry of the ALL.txt row (which is either an L4 square or RR73, RRR, 73 or R+nn or R-nn)  
	if(sq.length !=4 || sq == "RR73") {return false}
	if(sq[1]=="+" ||sq[1]=="-") {return false}
	return sq.trim()+"MM";  // make into L6 at centre of L4 square
  }

  function load_ALL_file(rr, call) {
		var lines = rr.split(/[\r\n]+/g);
		// receiver callsign
		const rc = call;
		//******************************************need to change this next line to use storred params
		const rl = STORAGE.squaresList.split(",")[0]; // need user to make sure the first square is associated with the callsign
		
		let nSpots = 0;
		for (const l of lines) {
			let s = l.trim().match(/\S+/g);
			if(s){
				if(s.length == 10 && s[2] == "Rx"){
					let sc = s[8].trim().replace('<','').replace('>','');
					let sl = getSquare(s[9]);
					let rp = s[4].trim();
					let md = s[3].trim();
					let b = getBand(s[1]);
					let t = getEpoch(s[0]);
					if(sc!="" && sl && md!="" && b && t){	// ignore unknown bands etc (some caused by zero MHz in ALL.txt)
						//const cutoff = Date.now() / 1000 - 60 * STORAGE.purgeMinutes;
					  //  const cutoff = Date.now() / 1000 - 60 * 72;	// 72 hours
					//	if(t > cutoff){
						let spot = {'sc':sc,'rc':rc,'sl':sl,'rl':rl,'rp':rp,'b':b,'md':md,'t':t};
						addSpotToConnectivityMap(historicConnsData, spot);
						nSpots +=1;
					//	}
					}
				}
			}
		//	console.log(spot);
		}
	  console.log("Added "+nSpots+" spots from ALL.txt file with "+lines.length+" lines");
	  internal_refresh();
	}



