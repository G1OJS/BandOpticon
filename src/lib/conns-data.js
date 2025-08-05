
export var connectivity_Band_Mode_HomeCall = {};

import * as GEO from '/src/lib/geo.js';
import {purgeMinutes} from '/src/lib/store-cfg.js';


export function addSpotToConnectivityMap(spot){
    // find sender and receiver domain (home / not home)
    let sh = (GEO.squareIsInHome(spot.sl));
    let rh = (GEO.squareIsInHome(spot.rl));

    if (!(sh || rh))
        return; // Bail out ASAP if neither end is in home

    // start and maintain a structure associating 'far end' entities with each home call for both home transmit and home receive
    // the structure is connectivity_Band_Mode_HomeCall[band][Tx|Rx][homeCall][otherCall] = timestamp
    // and we only keep the latest timestamp, which avoids duplicates
    const band = String(spot.b);
    const mode = String(spot.md);
    const t = parseInt(spot.t);
    // create band entry if it doesn't exist
    if (!connectivity_Band_Mode_HomeCall[band])
        connectivity_Band_Mode_HomeCall[band] = {}
	// create mode entry if it doesn't exist
    if (!connectivity_Band_Mode_HomeCall[band][mode])
        connectivity_Band_Mode_HomeCall[band][mode] = {Tx: {}, Rx: {} }; 
    if (sh) {
        const h = spot.sc,
        o = spot.rc;
        if (!connectivity_Band_Mode_HomeCall[band][mode].Tx[h])
            connectivity_Band_Mode_HomeCall[band][mode].Tx[h] = {}; // create Tx record for this home call if needed
        connectivity_Band_Mode_HomeCall[band][mode].Tx[h][o] = t; // overwrite with most recent
//		console.log("Added connection " + h + " rxby " + o + " at " + t);
    }
    if (rh) {
        const h = spot.rc,
        o = spot.sc;
        if (!connectivity_Band_Mode_HomeCall[band][mode].Rx[h])
            connectivity_Band_Mode_HomeCall[band][mode].Rx[h] = {}; // create Rx record for this home call if needed
        connectivity_Band_Mode_HomeCall[band][mode].Rx[h][o] = t; // overwrite with most recent
//		console.log("Added connection " + h + " rxing " + o + " at " + t);
    }

    // old code but keep safe:
    // add distance and bearing Home to DX
    // if both in home, sender to receiver
    // compact logic == always sender to receiver unless Rx in home and Tx in DXin which case reverse
    // conn["kmDeg"]= (conn.rd=="home" && conn.sd=="dx") ? squaresToKmDeg(conn.rl,conn.sl):squaresToKmDeg(conn.sl,conn.rl);

}


export function purgeConnections() {
//	console.log("Purging old connections");
	for (const band in connectivity_Band_Mode_HomeCall) {
		for (const mode in connectivity_Band_Mode_HomeCall[band]) {
			for (const dir of["Tx", "Rx"]) {
				const calls = connectivity_Band_Mode_HomeCall[band][mode][dir];
				for (const homeCall in calls) {
					const others = calls[homeCall];
					const toDelete = [];
					for (const otherCall in others) {
						const cutoff = Date.now() / 1000 - 60 * purgeMinutes;
						if (others[otherCall] < cutoff) {
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
    return Object.values(connectivity_Band_Mode_HomeCall)
        .flatMap(modes => Object.values(modes))
        .flatMap(({ Tx, Rx }) => [Tx, Rx])
        .flatMap(homeCalls => Object.values(homeCalls))
        .reduce((sum, others) => sum + Object.keys(others).length, 0);
}
