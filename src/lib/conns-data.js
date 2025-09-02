
export var liveConnsData = {};
export var callsigns_info={};
export var latestTimestamp = 0;

import {squareIsInHome} from './geo.js';
import {purgeMinutes, myCall} from './store-cfg.js';

export function addSpotToConnectivityMap(connsData, spot){
	// mqtt subscriptions are only for at least one end in HOME, so no non-HOME to non-HOME connections arrive here
	
	// set convenience variables
    let sh = squareIsInHome(spot.sl);
    let rh = squareIsInHome(spot.rl);
	const band = spot.b;
    const mode = spot.md;
    const t = parseInt(spot.t);
	if(t > latestTimestamp) {latestTimestamp = t}

	 // Update callsignInfo
	if (!callsigns_info[spot.sc]) callsigns_info[spot.sc] = {sq:spot.sl, inHome:sh};
	if (!callsigns_info[spot.rc]) callsigns_info[spot.rc] = {sq:spot.rl, inHome:rh};

    // tree structure of timestamped reports for each home call for both home transmit and home receive
    // connsData[band][mode][Tx|Rx][homeCall][otherCall] = [{'t':t, 'rp':rp}]	
	const rp = spot.rp;
    if (!connsData[band]) { connsData[band] = {}; }
    if (!connsData[band][mode]) {connsData[band][mode] = {Tx: {}, Rx: {} }; }	
	let h = null; let o = null; let d = null;
    if (sh) {h = spot.sc; o = spot.rc; d = connsData[band][mode].Tx;}
    if (rh) {h = spot.rc; o = spot.sc; d = connsData[band][mode].Rx;}
	if (!d[h]) d[h] = {}; 
	if (!d[h][o]) d[h][o] = [];
	d[h][o].push ({'t':t, 'rp':rp});
	
	// keep track of spots for all callsigns in HOME, with max and min SNR for each HOME/Other pair
	if(!d['ALL_HOME']) d['ALL_HOME'] = {}
	if(!d['ALL_HOME'][o]) d['ALL_HOME'][o] = []
	if(!d['ALL_HOME'][o][0]) d['ALL_HOME'][o][0] = {'t':0, 'rp':-50}
	if(!d['ALL_HOME'][o][1]) d['ALL_HOME'][o][1] = {'t':0, 'rp':50}
	if(rp > parseInt(d['ALL_HOME'][o][0]['rp'])) d['ALL_HOME'][o][0] ={'t':t, 'rp':rp};
	if(rp < parseInt(d['ALL_HOME'][o][1]['rp'])) d['ALL_HOME'][o][1] ={'t':t, 'rp':rp};

}

export function getBandStats(data){
	// data is subset of connectivity map e.g. data = connsData[band][mode].Tx
	let nHomeCalls = 0;
	let leaderCall = null;
	let nOtherCalls = 0;
	let nOtherCalls_Leader = 0;
	let nOtherCalls_myCall1 =0;
    let myCall1 = myCall.split(",")[0].trim();
    let myCall2 = myCall.split(",")[1]?.trim();
	const ocs_all = new Set();
	for (const hc in data) {
		nHomeCalls += 1;
        const ocs = new Set();
        for (const oc in data[hc]) { ocs.add(oc); ocs_all.add(oc); }
        nOtherCalls = ocs.size;
        if (nOtherCalls > nOtherCalls_Leader && hc != "ALL_HOME" && hc != "LEADER_HOME") {
            nOtherCalls_Leader = nOtherCalls;
            leaderCall = hc;
        }
		if(hc == myCall1){
			nOtherCalls_myCall1 = nOtherCalls;
		}
    }
	let nOtherCalls_All = ocs_all.size;
	return {nHomeCalls:nHomeCalls, nOtherCalls:nOtherCalls_All, leaderCall:leaderCall, nOtherCalls_Leader:nOtherCalls_Leader, nOtherCalls_myCall1:nOtherCalls_myCall1};
}


// needs checking
export function purgeLiveConnections() {
	
	// need to add purge for callsigns_info too
	
	const tNow = Math.round(Date.now() / 1000);
	const cutoff = tNow - 60 * purgeMinutes;
	//console.log("Purging old connections.\n tNow = " + tNow + "\n cutoff = "+ cutoff + "\n latest add = " + latestTimestamp );
	
	for (const band in liveConnsData) {
		for (const mode in liveConnsData[band]) {
			for (const dir of["Tx", "Rx"]) {
				for (const homeCall in liveConnsData[band][mode][dir]) {
					const otherCalls = liveConnsData[band][mode][dir][homeCall]     
					const toDelete = [];
					for (const otherCall in otherCalls) {
						const reports = otherCalls[otherCall]
						for (const rpt in reports){
							if(reports[rpt].t < cutoff) {
								toDelete.push(rpt)
							}
						}
						toDelete.forEach(rpt => {
							delete reports[rpt]
						});
						if (Object.keys(reports).length === 0) {
						  delete otherCalls[otherCall];
					    }
					}
				}
			}
		}
	}
}

// needs checking
export function countAllConnections() {
  let nConns = 0;
	for (const band in liveConnsData) {
		for (const mode in liveConnsData[band]) {
			for (const dir of["Tx", "Rx"]) {
				for (const homeCall in liveConnsData[band][mode][dir]) {
					const otherCalls = liveConnsData[band][mode][dir][homeCall]     
					const toDelete = [];
					for (const otherCall in otherCalls) {
						nConns += 1;
					}
				}
			}
		}
	}
  return nConns;
}

