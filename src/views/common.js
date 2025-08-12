
export function graph1(canvas, bandModeData, mode, myCalls, fromTime_seconds, toTime_seconds){
	
	if(!bandModeData){return}
	
	// get all transmitting callsigns in the time window across all myCalls (works with any number but code below only works with first two)
	// as unique band-call combinations.  output: set(band-call) 
	let band_calls = new Set();
	for (const band in bandModeData) {
		for (const mc of myCalls){
			if(bandModeData[band][mode]?.Rx[mc]){
				for (const oc in bandModeData[band][mode].Rx[mc]) {
					for (const rpt of bandModeData[band][mode].Rx[mc][oc]){
						if (rpt.t>= fromTime_seconds && rpt.t <= toTime_seconds){
							let bc = band +"-"+oc;
							band_calls.add(bc);
						}
					}
				}
			}
		}
	}


    // look for concurrent SNR reports of the same callsign on the same band defined as 
	// reports where both myCalls received the call within the concurrency window
	// Also include reports from one of myCalls but not the other
	// output: conc_rpts[serial_idx] = {band-call, rpt_1, rpt_2} where rpt_x is -30dB if only the other myCall received 
	let conc_sec = 600;
	let reports = {};
	// function to add reports in a structure easy to manipulate later
	function addReport(bc, rp1, rp2) {
	  if (!reports[bc]) {
		reports[bc] = {bc, label:bc, range_1:[rp1-0.5, rp1+0.5], range_2:[rp2-0.5, rp2+0.5]};
	  } else {
		if (rp1 < reports[bc].range_1[0]) reports[bc].range_1[0] = rp1;
		if (rp1 > reports[bc].range_1[1]) reports[bc].range_1[1] = rp1;
		if (rp2 < reports[bc].range_2[0]) reports[bc].range_2[0] = rp2;
		if (rp2 > reports[bc].range_2[1]) reports[bc].range_2[1] = rp2;
	  }
	}
	// loop over bandcalls and add reports to structure
	for (const bc of band_calls){
		let rpts_1 = bandModeData[bc.split('-')[0]][mode].Rx?.[myCalls[0]]?.[bc.split('-')[1]];
		if(rpts_1) {
			for (const rpt_1 of rpts_1){
				let rpts_2 = bandModeData[bc.split('-')[0]][mode].Rx?.[myCalls[1]]?.[bc.split('-')[1]];
				let also_in_2 = false;
				if(rpts_2) {
					for (const rpt_2 of rpts_2){
						if(Math.abs(rpt_1.t - rpt_2.t) < conc_sec){
							addReport(bc,parseInt(rpt_1.rp),parseInt(rpt_2.rp));
							also_in_2 = true;
						}
					}
				}
				if(!also_in_2) {
					addReport(bc,parseInt(rpt_1.rp),-30);
				}
			}
		} else {
			let rpts_2 = bandModeData[bc.split('-')[0]][mode].Rx?.[myCalls[1]]?.[bc.split('-')[1]];
			if(rpts_2){
				for (const rpt_2 of rpts_2){
					addReport(bc,-30,parseInt(rpt_2.rp));
				}
			}
		}
	}
	
	// sort by Tx band, then by SNR diff between the two Rx calls
	let reportsArr = Object.values(reports);
	reportsArr.sort((a, b) => {
		    let a_band = a.bc.split("-")[0];
		    let b_band = b.bc.split("-")[0];
			if (a_band !== b_band) return a_band.localeCompare(b_band); // band-call sort
			return (a.range_1[1] - a.range_2[1]) - (b.range_1[1] - b.range_2[1]);   // sort on difference between max achieved SNRs
		});

    // assign each band-call a colour according to band	
	let bc_colors = [];
	let bands = reportsArr.map(row => row.label.split('-')[0]);
	for (const band of bands){
		let idx = [false,"160m","80m","60m","40m","30m","20m","18m","15m","12m","10m","6m","4m","2m","70cm"].findIndex(b => b == band); 
		let cols = ['rgba(255, 99, 132, 0.5)','rgba(54, 162, 235, 0.5)','rgba(75, 192, 192, 0.5)'];
		let col = cols[idx % 3];
		bc_colors.push(col);
	}

    // prep the data for the chart
	let labels = reportsArr.map(row => row.label);
	console.log(labels);
	console.log(bc_colors);
	console.log(reportsArr.map(row => row.range_1));
	console.log(reportsArr.map(row => row.range_2));
	
	
	const data = {
	  labels,
	  datasets: [
		{
		  label: myCalls[0],
		  data: reportsArr.map(row => row.range_1),
		  backgroundColor: bc_colors.map(c => c.replace('0.5', '0.7')),
		  borderColor:bc_colors,
		  barPercentage: 0.5,
		  borderWidth: 1
		},
		{
		  label: myCalls[1],
		  data: reportsArr.map(row => row.range_2),
		  backgroundColor: bc_colors.map(c => c.replace('0.5', '0.4')), 
		  borderColor:bc_colors,
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

}
	