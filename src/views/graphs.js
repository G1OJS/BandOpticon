

export function snr_graph(canvas, bandModeData, band, mode, callA, callB, t0, tn){
	
	if(!bandModeData){return}
	
	document.getElementById(canvas).parentElement.classList.remove('hidden');

	function in_time_window(t) {
		return(t>=t0 && t<=tn)
	}
	
	// get all other callsigns across home calls callA and CallB
	let other_calls = new Set();
	for (const mc of [callA, callB]){
		if(bandModeData[band][mode]?.Rx[mc]){
			for (const oc in bandModeData[band][mode].Rx[mc]) {
				for (const rpt of bandModeData[band][mode].Rx[mc][oc]){
					if(rpt){
						if(in_time_window(parseInt(rpt.t))){
							other_calls.add(oc);
						}
					}
				}
			}
		}
	}

    // look for SNR reports of the same callsign on the same band, 
	// and reports that are only received by one of callA, CallB
	let reports = {};
	
	for (const oc of other_calls){  // Tx call is set here
		let rpts_1 = bandModeData[band][mode].Rx?.[callA]?.[oc];
		let rpts_2 = bandModeData[band][mode].Rx?.[callB]?.[oc];
		if(rpts_1){
			for (const rpt_1 of rpts_1){
				if(rpt_1) {
					let also_in_2 = false;
					if(rpts_2){
						for (const rpt_2 of rpts_2){
							if(rpt_2) {
								addReport(oc, rpt_1, rpt_2);
								also_in_2 = true;
							}
						}
					}
					if(!also_in_2) {
						addReport(oc, rpt_1, {t:0,rp:NaN});
					}
				}
			}
		} else {
			if(rpts_2){
				for (const rpt_2 of rpts_2){
					if(rpt_2){
						addReport( oc, {t:0,rp:NaN}, rpt_2);
					}
				}
			}
		}
	}
	
	// sort by SNR diff between the two Rx calls
	let reportsArr = Object.values(reports);

	reportsArr.sort((a, b) => {
			let max1a = a.range_1[1] || -50;
			let max1b = b.range_1[1] || -50;
			let max2a = a.range_2[1] || -50;
			let max2b = b.range_2[1] || -50;
			if(max1b == max1a) return (max2a-max2b)  // rx1 has same rpt: reverse sort on rx2
			return (max1b - max1a) //  sort on Rx1 max
		});

    // prep the data for the chart
	let labels = reportsArr.map(row => row.label);
	let color_Rx1 = 'rgba(255, 99, 132, 1)';
	let color_Rx2 = 'rgba(54, 162, 235, 0.7)';
	const data = {
	  labels,
	  datasets: [
		{
		  label: callA,
		  data: reportsArr.map(row => row.range_1),
		  spanGaps: true,
		  backgroundColor: color_Rx1,
		  borderColor:color_Rx1,
		  barPercentage: 0.5,
		  borderWidth: 1
		},
		{
		  label: callB,
		  data: reportsArr.map(row => row.range_2),
		  spanGaps: true,
		  backgroundColor: color_Rx2, 
		  borderColor:color_Rx2,
		  barPercentage: 0.85,
		  borderWidth: 1
		}
	  ]
	};
	
	const config = {
	  type: 'bar',
	  data,
	  options: {
		responsive: true,
		scales: {
		  y: {
			beginAtZero: false,
			title: {
			  display: true,
			  text: 'SNR (dB)'
			}
		  },
		  x: {
			title: {
			  display: false,
			  text: 'Band - Call'
			} 
		  }
		},
    datasets: {
      bar: { grouped: false } 
    }  
	  }
	};

	// Create the chart
	new Chart(
	  document.getElementById(canvas),
	  config
	);
	
	
	function addReport( bc, rp1, rp2) {
		let t1 = parseInt(rp1.t);
		let t2 = parseInt(rp2.t);
	    if ( !in_time_window(t1) && !in_time_window(t2)) {return}	
		let r1 = parseInt(rp1.rp);
		let r2 = parseInt(rp2.rp);
		
		if (!reports[bc]) {
			reports[bc] = {bc, label:bc, range_1:[r1-0.5, r1+0.5], range_2:[r2-0.5, r2+0.5]}; // spread +/- 0.5 for graph visibility
		}
	  
		if(r1){
			if ((r1 < reports[bc].range_1[0]) ) reports[bc].range_1[0] = r1
			if ((r1 > reports[bc].range_1[1]) ) reports[bc].range_1[1] = r1
		}
		if(r2){
			if ((r2 < reports[bc].range_2[0]) ) reports[bc].range_2[0] = r2
			if ((r2 > reports[bc].range_2[1])) reports[bc].range_2[1] = r2
		}
	  

	}

}
	

