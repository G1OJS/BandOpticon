
export var liveConnsData = {};
export var tx_callsigns_info={};
export var rx_callsigns_info={};
export var latestTimestamp = 0;

import {squareIsInHome} from './geo.js';
import {purgeMinutes} from './store-cfg.js';

export function addSpotToConnectivityMap(connsData, spot){
	// mqtt subscriptions are only for at least one end in HOME, so no non-HOME to non-HOME connections arrive here
	
	// set convenience variables
    let sh = squareIsInHome(spot.sl);
    let rh = squareIsInHome(spot.rl);
	const band = spot.b;
    const mode = spot.md;
    const t = parseInt(spot.t);
	if(t > latestTimestamp) {latestTimestamp = t}

	 // Update HOME tx_callsignInfo and rx_callsignInfo
	if (!tx_callsigns_info[spot.sc]) tx_callsigns_info[spot.sc] = {sq:spot.sl, inHome:sh, lastBand:spot.b, lastMode:spot.md, lastTime:spot.t};
	if (!rx_callsigns_info[spot.rc]) rx_callsigns_info[spot.rc] = {sq:spot.rl, inHome:rh, lastBand:spot.b, lastMode:spot.md, lastTime:spot.t};

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
	
    // old code but keep safe:
    // add distance and bearing Home to DX
    // if both in home, sender to receiver
    // compact logic == always sender to receiver unless Rx in home and Tx in DXin which case reverse
    // conn["kmDeg"]= (conn.rd=="home" && conn.sd=="dx") ? squaresToKmDeg(conn.rl,conn.sl):squaresToKmDeg(conn.sl,conn.rl);

}


export function updateLeaderInfo(data, callsigns_info){
	// data is subset of connectivity map e.g. data = connsData[band][mode].Tx

	// go through active callsigns and find call with most othercalls connected
	let leader_home = null;
	let nMax = 0;
	for (const homeCall in callsigns_info) {
        const otherCalls = new Set();
        for (const oc in data[homeCall]) {
            otherCalls.add(oc);
        }
        const count = otherCalls.size;
        if (count > nMax && homeCall != "ALL_HOME" && homeCall != "LEADER_HOME") {
            nMax = count;
            leader_home = homeCall;
        }		
    }
	
	// find max and min reports for each other call connectd to the leader_home, and record in the data tree
	for (const oc in data[leader_home]) {
		for (const rpt of data[leader_home][oc]) { 
			if(!data['LEADER_HOME']) data['LEADER_HOME'] = {}
			if(!data['LEADER_HOME'][oc]) data['LEADER_HOME'][oc] = []
			if(!data['LEADER_HOME'][oc][0]) data['LEADER_HOME'][oc][0] = {'t':0, 'rp':-50}
			if(!data['LEADER_HOME'][oc][1]) data['LEADER_HOME'][oc][1] = {'t':0, 'rp':50}
			let snr = parseInt(rpt['rp']);
			if(snr > parseInt(data['LEADER_HOME'][oc][0]['rp'])) data['LEADER_HOME'][oc][0] = rpt;
			if(snr < parseInt(data['LEADER_HOME'][oc][1]['rp'])) data['LEADER_HOME'][oc][1] = rpt;	
		}
	}
	
	return leader_home;
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

