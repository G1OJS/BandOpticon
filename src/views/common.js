
export function graph1(canvas, bandModeData, mode, myCalls){
	
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
		rpts_a.push(bandModeData[b]?.[mode]?.Rx?.[myCalls[0]]?.[c]?.rp ?? -30);
		rpts_b.push(bandModeData[b]?.[mode]?.Rx?.[myCalls[1]]?.[c]?.rp ?? -30);
		x.push(idx);
		x_sortdex.push(idx);
	}
	
//	x_sortdex.sort((a,b)=>{return((rpts_a[a] > -30 && rpts_a[b] > - 30)? (rpts_a[b]-rpts_a[a]):(rpts_b[b]-rpts_b[a])) });
	x_sortdex.sort((a,b)=>{return((rpts_a[b]-rpts_b[b])-(rpts_a[a]-rpts_b[a])) });
	let ser_a=[];
	let ser_b=[];
	for (const idx of x_sortdex){
		ser_a.push(rpts_a[idx]);
		ser_b.push(rpts_b[idx]);
	}
	
	new Chart(canvas, {
	  type: "line",
	  data: {
		labels: x,
		datasets: [{
		  label: myCalls[0],
		  fill: false,
		  lineTension: 0,
		  backgroundColor: "rgba(0,0,255,1.0)",
		  borderColor: "rgba(0,0,255,0.1)",
		  data: ser_a
		}, {
		  label: myCalls[1],
		  fill: false,
		  lineTension: 0,
		  backgroundColor: "rgba(0,200,100,1.0)",
		  borderColor: "rgba(0,0,255,0.1)",
		  data: ser_b
		}]
	  },
	  options: {
		legend: {display: true},
		scales: {
		  x: {title:{display:true, text:'callsign number'}},
		  yAxes: [{ticks: {min: -25, max:15}}],
		}
	  }
	});


}
	