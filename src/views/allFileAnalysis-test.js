	import {addSpotToConnectivityMap} from '../lib/conns-data.js';
	import * as STORAGE from '../lib/store-cfg.js';
	import {squareIsInHome} from '../lib/geo.js';
	import {graph} from '../views/graphs.js';
	import {purgeMinutes} from '../lib/store-cfg.js';

	var DOMcontainer = null;
	let getMode = () => null;
	let mode = null;

	let dummyCallsigns = ['AllTXT1','AllTXT2'];
	let allFiles = [];
	let historicConnsData = {};

	export function init(container, band, opts = {}) {
		DOMcontainer = container;
		getMode = opts.getWatchedMode;
		mode = getMode();
		
		let HTML = ""
		HTML +=  '<h2>WSJT-X ALL File Analysis for ' + mode +'</h2>';
		HTML += "<div class = 'text-sm'>";
		HTML += "This is a new view (still being developed) "
		HTML += ""
		HTML += ""
		
		//file chooser, info span and unload buttons for each ALL file
		HTML += '<br><br>Experimental - import Rx spots from WSJT-X ALL.txt files: '
		for (const rc in dummyCallsigns){
			HTML += '<br>ALL file for '+dummyCallsigns[rc]+' <input type="file" id="allFileChooser_'+rc+'" accept="*.txt" />'
			HTML += ' <span id = "timeinfo_'+rc+'"></span>'
		}
		
		// end time chooser
		HTML += "<br><br>Chart includes reports for the <span id = 'timewin'></span> minutes period before " 
		HTML += "<input class = 'settings-input' id='time_picker' type='datetime-local' title='to time'> UTC"
		HTML += "<br>Re-pick the file(s) to show latest results"

		// container for refreshable parts
		HTML += "<div id = 'allFileRefreshingContainer'></div>";
		DOMcontainer.innerHTML = HTML;
		
		// event listener for file choosers
		for (const rc in dummyCallsigns){
			const inputElement = document.getElementById('allFileChooser_'+rc);
			inputElement.addEventListener("change", function(event) {
				const file = event.target.files[rc];
				if (file) {
					allFiles[rc] = file;
					console.log("File chosen:", file.name);
				}
				});
		}	
		
		// event listener for end time input
		let tn_el = document.getElementById("time_picker");
		tn_el.addEventListener("input", refresh);
		
		refresh(); // initial graph load
	}


	export function refresh(){
	   
		console.log("Refresh");
		const container = document.getElementById("allFileRefreshingContainer");

		let HTML = ""
		HTML += "<canvas id='graph1' style='width:100%;max-width:700px'></canvas>";
		HTML += "<br><h3>To Do:</h3><ul>";
		HTML += "<li>Improve time navigation: 'sessions' within file</li>";
		HTML += "<li>Integrate mode buttons (set from file not live)</li>";
		HTML += "<li>Add distance / bearing / options</li>";
		HTML += "</ul>";
		container.innerHTML = HTML;
		
		for (const fIdx in allFiles) {
			const reader = new FileReader();
			const call = dummyCallsigns[fIdx];
			reader.onload = () => {
				let rr = reader.result;
				historicConnsData = load_ALL_file(rr, fIdx); 
			}
			try{reader.readAsText(allFiles[fIdx]); console.log("Pointed reader at file "+allFiles[fIdx].name)}
			catch {console.log("Couldn't read file "+allFiles[fIdx].name)}
		}
		
		let tn_el = document.getElementById("time_picker");
		let time_picker_sec = Math.floor(new Date(tn_el.value).getTime() / 1000);
		let global_t0_sec = time_picker_sec - 60 * purgeMinutes
		document.getElementById("timewin").innerHTML = purgeMinutes;
		
		graph('graph1', historicConnsData, mode, dummyCallsigns, global_t0_sec, time_picker_sec);
	}


  function getBand(MHz){
	let fMHz = parseFloat(MHz);
	let i = [1.8,3.5,5,7,10,14,17,21,24,28,50,70,144,430].findIndex(f => f > MHz);  
	return [false,"160m","80m","60m","40m","30m","20m","18m","15m","12m","10m","6m","4m","2m","70cm"][i];
  }
  
  function getEpoch(dt_str_utc){
	// returns epoch in milliseconds from the date time string at the start of each line in the all file
	let d = dt_str_utc;
	let dt = new Date(Date.UTC("20"+d.slice(0,2),d.slice(2,4)-1,d.slice(4,6),d.slice(7,9),d.slice(9,11),d.slice(11,13)));
	let epoch_from_utc = dt;
	return epoch_from_utc;  
  }
  
  function getSquare(sq){
	// get square from the last entry of the ALL.txt row (which is either an L4 square or RR73, RRR, 73 or R+nn or R-nn)  
	if(sq.length !=4 || sq == "RR73") {return false}
	if(sq[1]=="+" ||sq[1]=="-") {return false}
	return sq.trim()+"MM";  // make into L6 at centre of L4 square
  }

  function load_ALL_file(rr, fIdx) {
	    let historicConnsData = {};
		
		var lines = rr.split(/[\r\n]+/g);
		// receiver callsign
		const rc = dummyCallsigns[fIdx];
		//******************************************need to change this next line to use storred params
		const rl = STORAGE.squaresList.split(",")[0]; // need user to make sure the first square is associated with the callsign
		
		let nSpots = 0;
		let t0 = new Date("2100-12-17T03:24:00");
		let tn = new Date("1995-12-17T03:24:00");
		for (const l of lines) {
			let s = l.trim().match(/\S+/g);
			if(s){
				if(s.length == 10 && s[2] == "Rx"){
					let sc = s[8].trim().replace('<','').replace('>','');
					let sl = getSquare(s[9]);
					let rp = s[4].trim();
					let md = s[3].trim();
					let b = getBand(s[1]);
					let traw = getEpoch(s[0]);
					let t = traw.valueOf() / 1000;
					if(sc!="" && sl && md!="" && b && t){	// ignore unknown bands etc (some caused by zero MHz in ALL.txt)
						let spot = {'sc':sc,'rc':rc,'sl':sl,'rl':rl,'rp':rp,'b':b,'md':md,'t':t};
						addSpotToConnectivityMap(historicConnsData, spot);
						nSpots +=1;
						if(traw<t0){t0=traw}; // capture earliest time (first line)
						if(traw>tn){tn=traw}; // capture latest time (last line)
					}
				}
			}
		}
	  // t0 and tn are now the time range (in milliseconds epoch) of the input file
	  // First write this to the info span:
	     document.getElementById("timeinfo_"+fIdx).innerHTML = t0.toLocaleString()+" to " + tn.toLocaleString() + " ";
	  
	  // Update the end time control to the latest time in the common overlap window:
	  // if the file ends before the window make the window end with this file
	  let tn_el = document.getElementById("time_picker");
	  if(tn_el.value == ""){tn_el.value = setpicker_local(tn}
	  
	  console.log("Added "+nSpots+" spots from ALL.txt file with "+lines.length+" lines");	  
	  
	  return historicConnsData;

	}

	function setpicker_local(dt_local) {
	  let d = dt_local;
	  const year = d.getFullYear();
	  const month = (d.getMonth() + 1).toString().padStart(2, "0");
	  const day = d.getDate().toString().padStart(2, "0");
	  const hours = d.getHours().toString().padStart(2, "0");
	  const minutes = d.getMinutes().toString().padStart(2, "0");
	  return `${year}-${month}-${day}T${hours}:${minutes}`;
	}


