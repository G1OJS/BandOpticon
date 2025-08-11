
export function graph1(canvas, bandModeData, mode, myCalls, fromTime_seconds, toTime_seconds){
	
	let otherCalls = new Set();
	let rxObj={};
	for (const band in bandModeData) {
		rxObj = bandModeData[band]?.[mode]?.Rx?.[myCalls[0]];
		if(rxObj){
			for (const otherCall in rxObj) {
				let bc = band +"-"+otherCall;
				otherCalls.add(bc);
			}
		}
		rxObj = bandModeData[band]?.[mode]?.Rx?.[myCalls[1]];
		if(rxObj){
			for (const otherCall in rxObj) {
				let bc = band +"-"+otherCall;
				otherCalls.add(bc);
			}
		}
	}

	otherCalls = Array.from(otherCalls);  

	let x =[];
	let x_sortdex = [];
	let rpts_a = [];
	let rpts_b = [];

	for (const idx in otherCalls){
		let b = otherCalls[idx].split("-")[0];
		let c = otherCalls[idx].split("-")[1];
		let rec_a = bandModeData[b]?.[mode]?.Rx?.[myCalls[0]]?.[c]?? {t:0, rp:-30};
		let rec_b = bandModeData[b]?.[mode]?.Rx?.[myCalls[1]]?.[c]?? {t:0, rp:-30};
		rpts_a.push(rec_a);
		rpts_b.push(rec_b);
		x.push(idx);
		x_sortdex.push(idx);
	}
	
//	x_sortdex.sort((a,b)=>{return((rpts_a[a] > -30 && rpts_a[b] > - 30)? (rpts_a[b]-rpts_a[a]):(rpts_b[b]-rpts_b[a])) });
	x_sortdex.sort((a,b)=>{return((rpts_a[b].rp - rpts_b[b].rp)-(rpts_a[a].rp - rpts_b[a].rp)) });
	let ser_a=[];
	let ser_b=[];
	let xx = [];
	for (const idx of x_sortdex){
		let t_a = rpts_a[idx].t;
		let t_b = rpts_b[idx].t;
	//	console.log("A "+fromTime_seconds, t_a, toTime_seconds);
	//	console.log("B "+fromTime_seconds, t_b, toTime_seconds);
		let in_time_window = (t_a >= fromTime_seconds && t_a <= toTime_seconds) || (t_b >= fromTime_seconds && t_b <= toTime_seconds);
		if(in_time_window){
			ser_a.push(rpts_a[idx].rp);
			ser_b.push(rpts_b[idx].rp);
			xx.push(idx);
		}
	}
	
	
	new Chart(canvas, {
	  type: "line",
	  data: {
		labels: xx,
		datasets: [{
		  label:myCalls[0],
		  fill: false,
		  lineTension: 0,
		  backgroundColor: "rgba(0,0,255,1.0)",
		  borderColor: "rgba(0,0,255,0.1)",
		  data: ser_a,
		}, {
		  label:myCalls[1],
		  fill: false,
		  lineTension: 0,
		  backgroundColor: "rgba(0,200,100,1.0)",
		  borderColor: "rgba(0,0,255,0.1)",
		  data: ser_b,
		}]
	  },
	  options: {
		legend: {display: true},
		  scales: {
			  x: {
				display: true,
				title: {
				  display: true,
				  text: 'Callsign number'
				}
			  },
			  y: {
				display: true,
				title: {
				  display: true,
				  text: 'SNR dB'
				}
			  }
			}
	  }
	});


}
	