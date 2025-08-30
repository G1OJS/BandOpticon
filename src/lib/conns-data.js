
export var liveConnsData = {};
export var callsigns_info={};
export var latestTimestamp = 0;

import {squareIsInHome} from './geo.js';
import {purgeMinutes} from './store-cfg.js';

//setInterval(() => {console.log(liveConnsData)}, 20000);

export function addSpotToConnectivityMap(connsData, spot){
    // find sender and receiver domain (home / not home)
    let sh = squareIsInHome(spot.sl);
    let rh = squareIsInHome(spot.rl);

    if (!(sh || rh))
        return; // Bail out ASAP if neither end is in home
	
	 // Update callsignInfo
	if (!callsigns_info[spot.sc]) callsigns_info[spot.sc] = {sq:spot.sl, inHome:sh, lastBand:spot.b, lastMode:spot.md, RxTx:'Tx'};
	if (!callsigns_info[spot.rc]) callsigns_info[spot.rc] = {sq:spot.rl, inHome:rh, lastBand:spot.b, lastMode:spot.md, RxTx:'Rx'};

    // start and maintain a structure associating 'far end' entities with each home call for both home transmit and home receive
    // the structure is connsData[band][Tx|Rx][homeCall][otherCall] = timestamp
    // and we only keep the latest timestamp, which avoids duplicates
    const band = String(spot.b);
    const mode = String(spot.md);
    const t = parseInt(spot.t);
	if(t > latestTimestamp) {latestTimestamp = t}
	
	const rp = spot.rp;
    // create band entry if it doesn't exist
    if (!connsData[band])
        connsData[band] = {}
	// create mode entry if it doesn't exist
    if (!connsData[band][mode])
        connsData[band][mode] = {Tx: {}, Rx: {} }; 
	
	let h = null; let o = null; let d = null;
    if (sh) {
        h = spot.sc; o = spot.rc; d = connsData[band][mode].Tx;
    }
    if (rh) {
        h = spot.rc; o = spot.sc; d = connsData[band][mode].Rx;
	}

	if (!d[h]) d[h] = {}; // create record for this home call if needed
	if (!d[h][o]) d[h][o] = []; // start reports list if needed
	d[h][o].push ({'t':t, 'rp':rp});

	if(!d['ALL_HOME']) d['ALL_HOME'] = {}
	if(!d['ALL_HOME'][o]) d['ALL_HOME'][o] = []
	if(!d['ALL_HOME'][o][0]) d['ALL_HOME'][o][0] = {'t':0, 'rp':-50}
	if(!d['ALL_HOME'][o][1]) d['ALL_HOME'][o][1] = {'t':0, 'rp':-50}
	
	if(rp > parseInt(d['ALL_HOME'][o][0]['rp'])) d['ALL_HOME'][o][0] ={'t':t, 'rp':rp};
	if(rp < parseInt(d['ALL_HOME'][o][1]['rp'])) d['ALL_HOME'][o][1] ={'t':t, 'rp':rp};
	

    // old code but keep safe:
    // add distance and bearing Home to DX
    // if both in home, sender to receiver
    // compact logic == always sender to receiver unless Rx in home and Tx in DXin which case reverse
    // conn["kmDeg"]= (conn.rd=="home" && conn.sd=="dx") ? squaresToKmDeg(conn.rl,conn.sl):squaresToKmDeg(conn.sl,conn.rl);

}

export function purgeLiveConnections() {
	
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
								//console.log("del "+reports[rpt].t );
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

