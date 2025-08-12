
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

	let conc_sec = 600;
    // look for concurrent SNR reports of the same callsign on the same band defined as 
	// reports where both myCalls received the call within the concurrency window
	// Also include reports from one of myCalls but not the other
	// output: conc_rpts[serial_idx] = {band-call, rpt_1, rpt_2} where rpt_x is -30dB if only the other myCall received 

	let conc_rpts = {};  // concurrent reports to graph

	function addReport(bc, r1, r2) {
	  if (!conc_rpts[bc]) conc_rpts[bc] = { rp1: [], rp2: [] };
	  conc_rpts[bc].rp1.push(r1);
	  conc_rpts[bc].rp2.push(r2);
	}
	
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

//	function s(a,b){
//		// different band-calls: sort by band-call
//		if(a.bc != b.bc) {return a.bc - b.bc}
//		// sort by snr difference between rp1 and rp2 (two differences, one for a and one for b)	
//		return (a.rp1-a.rp2) - (b.rp1-b.rp2)
//	}
	
  //  conc_rpts.sort((a,b)=>s(a,b));
	
//	for (const rpt of conc_rpts){console.log(rpt)}
	
	// chart with colours identifying different bands (if more than one band in the dataset)
	
	// Map band to colour 
	function getBandColor(bandCall) {
	  const band = bandCall.split('-')[0]; // "20m", "40m", etc.
	  switch (band) {
		case '20m': return 'rgba(255, 99, 132, 0.5)'; // red-ish
		case '40m': return 'rgba(54, 162, 235, 0.5)'; // blue-ish
		case '80m': return 'rgba(75, 192, 192, 0.5)'; // teal-ish
		default:    return 'rgba(201, 203, 207, 0.5)'; // grey
	  }
	}
	
	const labels = Object.keys(conc_rpts).map((e) => e.trim()).slice(0, 300);
	const rx1Data = labels.map((bc, i ) => ( [Math.min(...conc_rpts[bc].rp1), 1+Math.max(...conc_rpts[bc].rp1)]));
	const rx2Data = labels.map((bc, i ) => ( [Math.min(...conc_rpts[bc].rp2), 1+Math.max(...conc_rpts[bc].rp2)]));

	const bandColors = labels.map(getBandColor);

	const data = {
	  labels,
	  datasets: [
		{
		  label: myCalls[0],
		  data: rx1Data,
		  backgroundColor: bandColors.map(c => c.replace('0.5', '0.7')),
		  borderColor:bandColors,
		  borderWidth: 1
		},
		{
		  label: myCalls[1],
		  data: rx2Data,
		  backgroundColor: bandColors.map(c => c.replace('0.5', '0.4')), 
		  borderColor:bandColors,
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
			beginAtZero: false, // allow negative SNR
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
      bar: { grouped: false } // overlay instead of side-by-side
    }  
	  }
	};

	// Create the chart
	new Chart(
	  document.getElementById(canvas),
	  config
	);

}
	