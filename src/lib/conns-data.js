
export var liveConnsData = {};
export var callsigns_info={};

import {squareIsInHome} from './geo.js';
import {purgeMinutes} from './store-cfg.js';


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
	const rp = spot.rp;
    // create band entry if it doesn't exist
    if (!connsData[band])
        connsData[band] = {}
	// create mode entry if it doesn't exist
    if (!connsData[band][mode])
        connsData[band][mode] = {Tx: {}, Rx: {} }; 
    if (sh) {
        const h = spot.sc,
        o = spot.rc;
        if (!connsData[band][mode].Tx[h]) connsData[band][mode].Tx[h] = {}; // create Tx record for this home call if needed
		if (!connsData[band][mode].Tx[h][o]) connsData[band][mode].Tx[h][o] = [{'t':t, 'rp':rp}]; // start reports list if needed
		connsData[band][mode].Tx[h][o].push ({'t':t, 'rp':rp});
    }
    if (rh) {
        const h = spot.rc,
        o = spot.sc;
		if (!connsData[band][mode].Rx[h]) connsData[band][mode].Rx[h] = {}; // create Rx record for this home call if needed
		if (!connsData[band][mode].Rx[h][o]) connsData[band][mode].Rx[h][o] = [{'t':t, 'rp':rp}]; // start reports list if needed
		connsData[band][mode].Rx[h][o].push ({'t':t, 'rp':rp});
    }

    // old code but keep safe:
    // add distance and bearing Home to DX
    // if both in home, sender to receiver
    // compact logic == always sender to receiver unless Rx in home and Tx in DXin which case reverse
    // conn["kmDeg"]= (conn.rd=="home" && conn.sd=="dx") ? squaresToKmDeg(conn.rl,conn.sl):squaresToKmDeg(conn.sl,conn.rl);

}


export function purgeLiveConnections() {
//	console.log("Purging old connections");
	for (const band in liveConnsData) {
		for (const mode in liveConnsData[band]) {
			for (const dir of["Tx", "Rx"]) {
				const calls = liveConnsData[band][mode][dir];
				for (const homeCall in calls) {
					const others = calls[homeCall];
					const toDelete = [];
					for (const otherCall in others) {
						
						const cutoff = Date.now() / 1000 - 60 * purgeMinutes;
						if (others[otherCall].t < cutoff) {
							toDelete.push(otherCall);
						}
					}
//					console.log("Deleting " + toDelete.length);
					toDelete.forEach(otherCall => delete others[otherCall]);					
					if (Object.keys(others).length === 0) {
						delete calls[homeCall];
					}
				}
			}
		}
	}
}


export function countAllTimestamps() {
    return Object.values(liveConnsData)
        .flatMap(modes => Object.values(modes))
        .flatMap(({ Tx, Rx }) => [Tx, Rx])
        .flatMap(homeCalls => Object.values(homeCalls))
        .reduce((sum, others) => sum + Object.keys(others).length, 0);
}
