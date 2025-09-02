import {mhToLatLong} from '../lib/geo.js';
import {callsigns_info} from '../lib/conns-data.js';

function get_otherCalls_LatLon(connsData, call){
	let ll=[];
	if(connsData[call]){
		for (const oc in connsData[call]) {
			let sq = callsigns_info[oc]['sq'];
			ll.push(mhToLatLong(sq));
		}
	}
	return ll;
}

export function geo_graph(canvas, connsData, callA, callB, callC, t0, tn){
	
	if(!connsData){return}
	
	document.getElementById(canvas).parentElement.classList.remove('hidden');
	

	
	let llA = get_otherCalls_LatLon(connsData, callA);
	let llB = get_otherCalls_LatLon(connsData, callB);
	let llC = get_otherCalls_LatLon(connsData, callC);
	let colA = 'rgba(255, 99, 132, 1)';
	let colB = 'rgba(54, 162, 235, 0.7)';
	let colC = 'rgba(200, 162, 235, 0.7)';
	
	const data = {
	  datasets: [	{label: callA, data: llA.map(e => ({x:e.lon, y:e.lat})), backgroundColor: colA, pointRadius:4},
					{label: callB, data: llB.map(e => ({x:e.lon, y:e.lat})), backgroundColor: colB, pointRadius:6},
					{label: callC, data: llC.map(e => ({x:e.lon, y:e.lat})), backgroundColor: colC, pointRadius:10}],
	};
	


	new Chart(
	  document.getElementById(canvas),
		{type: 'scatter',data: data, options: {
			    animation: false, 
				    scales: {
						x: {title: {display:true, text: 'Longitude'}, type: 'linear',position: 'bottom'},
						y: {title: {display:true, text: 'Lattitude'}, type: 'linear',position: 'left'}
					}
			}
		}
	);
	
}
	

