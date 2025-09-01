

export function snr_graph(canvas, connsData, callA, callB, t0, tn){
	
	if(!connsData){return}
	
	document.getElementById(canvas).parentElement.classList.remove('hidden');

	function in_time_window(t) {
		return(t>=t0 && t<=tn)
	}
	
	// get all other callsigns across home calls callA and CallB
	let other_calls = new Set();
	for (const mc of [callA, callB]){
		if(connsData[mc]){
			for (const oc in connsData[mc]) {
				for (const rpt of connsData[mc][oc]){
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
	
	for (const oc of other_calls){ 
		let rpts_1 = connsData?.[callA]?.[oc];
		let rpts_2 = connsData?.[callB]?.[oc];
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
	
	// sort by SNR diff between the two HOME calls
	let reportsArr = Object.values(reports);

	reportsArr.sort((a, b) => {
			let max1a = a.range_1[1] || -50;
			let max1b = b.range_1[1] || -50;
			let max2a = a.range_2[1] || -50;
			let max2b = b.range_2[1] || -50;
			if(max1b == max1a) return (max2a-max2b)  // home1 has same rpt as home2 (could be -50 = none): reverse sort on home2
			return (max1b - max1a) //  sort on home1 max
		});

    // prep the data for the chart
	let labels = reportsArr.map(row => row.label);
	let color_home1 = 'rgba(255, 99, 132, 1)';
	let color_home2 = 'rgba(54, 162, 235, 0.7)';
	const data = {
	  labels,
	  datasets: [
		{
		  label: callA,
		  data: reportsArr.map(row => row.range_1),
		  spanGaps: true,
		  backgroundColor: color_home1,
		  borderColor:color_home1,
		  barPercentage: 0.5,
		  borderWidth: 1
		},
		{
		  label: callB,
		  data: reportsArr.map(row => row.range_2),
		  spanGaps: true,
		  backgroundColor: color_home2, 
		  borderColor:color_home2,
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
	

