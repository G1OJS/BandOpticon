

export function graph(canvas, bandModeData, mode, myCalls, t0, tn){
	
	if(!bandModeData){return}
	
	let global_t0 = t0;
	let global_tn = tn;
	function in_time_window(t) {return(t>=global_t0 && t<=global_tn)}
	
	// get list of bands for first of myCalls
	let bandList = new Set();
	for (const band in bandModeData) {
		if(bandModeData[band][mode]?.Rx[myCalls[0]]) bandList.add(band)
	}
	
	if (bandList.size == 0) {
		for (const band in bandModeData) {
			bandList.add(band)
		}	
	}

	// get all transmitting callsigns across all myCalls (works with any number but code below only works with first two)
	// in each unique band-call combination.  output: set(band-call) 
	let band_calls = new Set();
	for (const band of bandList) {
		for (const mc of myCalls){
			if(bandModeData[band][mode]?.Rx[mc]){
				for (const oc in bandModeData[band][mode].Rx[mc]) {
					for (const rpt of bandModeData[band][mode].Rx[mc][oc]){
						if(rpt){
							if(in_time_window(parseInt(rpt.t))){
								let bc = band +"-"+oc;
								band_calls.add(bc);
							}
						}
					}
				}
			}
		}
	}

    // look for SNR reports of the same callsign on the same band, 
	// and reports that are only received by one of myCalls
	let reports = {};
	for (const bc of band_calls){  // Tx call is set here
		let rpts_1 = bandModeData[bc.split('-')[0]][mode].Rx?.[myCalls[0]]?.[bc.split('-')[1]];
		let rpts_2 = bandModeData[bc.split('-')[0]][mode].Rx?.[myCalls[1]]?.[bc.split('-')[1]];
		if(rpts_1) {
			for (const rpt_1 of rpts_1){
				let also_in_2 = false;
				if(rpts_2) {
					for (const rpt_2 of rpts_2){
						addReport(bc,rpt_1,rpt_2);
						also_in_2 = true;
					}
				}
				if(!also_in_2) {
					addReport(bc, rpt_1, {'t':rpt_1.t,'rp':null});
				}
			}
		} else {
			if(rpts_2){
				for (const rpt_2 of rpts_2){
					if(rpt_2){
						addReport(bc, {'t':rpt_2.t,'rp':null}, rpt_2);
					}
				}
			}
		}
	}
	
	// sort by Tx band, then by SNR diff between the two Rx calls
	let reportsArr = Object.values(reports);

	reportsArr.sort((a, b) => {
		    let a_band = a.bc.split("-")[0];
		    let b_band = b.bc.split("-")[0];
			if (a_band !== b_band) return b_band.localeCompare(a_band); // band sort
			let max1a = a.range_1[1] || -50;
			let max1b = b.range_1[1] || -50;
			let max2a = a.range_2[1] || -50;
			let max2b = b.range_2[1] || -50;
			if(max1b == max1a) return (max2a-max2b)  // rx1 has same rpt (likely -30): reverse sort on rx2
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
		  label: myCalls[0],
		  data: reportsArr.map(row => row.range_1),
		  spanGaps: true,
		  backgroundColor: color_Rx1,
		  borderColor:color_Rx1,
		  barPercentage: 0.5,
		  borderWidth: 1
		},
		{
		  label: myCalls[1],
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
	
	
	function addReport(bc, rp1, rp2) {
  
	  let t1 = parseInt(rp1.t);
	  let t2 = parseInt(rp2.t);
	  if ( !in_time_window(t1) || !in_time_window(t2)) {return}	
	  let r1 = parseInt(rp1.rp);
	  let r2 = parseInt(rp2.rp);
	  
	  if (!reports[bc]) {
		reports[bc] = {bc, label:bc, range_1:[r1-0.5, r1+0.5], range_2:[r2-0.5, r2+0.5]}; // spread +/- 0.5 for graph visibility
	  } else {
		if ((r1 < reports[bc].range_1[0]) && in_time_window(t1)) reports[bc].range_1[0] = r1;
		if ((r1 > reports[bc].range_1[1]) && in_time_window(t1)) reports[bc].range_1[1] = r1;
		if ((r2 < reports[bc].range_2[0]) && in_time_window(t2)) reports[bc].range_2[0] = r2;
		if ((r2 > reports[bc].range_2[1]) && in_time_window(t2)) reports[bc].range_2[1] = r2;
	  }

	}

}
	

