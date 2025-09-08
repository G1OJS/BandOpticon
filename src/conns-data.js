
export var connsData = {};
export var callsData = {};

import {mhToLatLong, squareIsInHome} from './geo.js';
import {purgeMinutes} from './store-cfg.js';

function updateCallsignLocactions(callsign, square){
	if (!callsData[callsign]){
		let ll = mhToLatLong(square);
		callsData[callsign] = {x:ll[1], y:ll[0], inHome:squareIsInHome(square)};
	}
}

export function addSpotToConnectivityMap(connsData, spot){
	// mqtt subscriptions are only for at least one end in HOME, so no non-HOME to non-HOME connections arrive here

	// update callsign info for both sender and receiver
	updateCallsignLocactions(spot.rc, spot.rl);
	updateCallsignLocactions(spot.sc, spot.sl);

	// add connection 
    if (!connsData[spot.b]) connsData[spot.b] = {}; 
    if (!connsData[spot.b][spot.md]) connsData[spot.b][spot.md] = {};
	if (!connsData[spot.b][spot.md][spot.sc]) connsData[spot.b][spot.md][spot.sc] = {};
	connsData[spot.b][spot.md][spot.sc][spot.rc] = spot.t;
}

export function purgeLiveConnections() {
	// need to add purge for callsData too	
	const tNow = Math.round(Date.now() / 1000);
	const cutoff = tNow - 60 * purgeMinutes;
	//console.log("Purging old connections.\n tNow = " + tNow + "\n cutoff = "+ cutoff + "\n latest add = " + latestTimestamp );
	for (const band in connsData) {
		for (const mode in connsData[band]) {
			for (const sc in connsData[band][mode]) {
				const otherCalls = connsData[band][mode][sc]     
				const toDelete = [];
				for (const otherCall in otherCalls) {
					if(otherCall.t < cutoff) {toDelete.push(otherCall)}
				}
				toDelete.forEach(otherCall=> {delete otherCalls[otherCall];});
				if (Object.keys(sc).length === 0) {delete connsData[band][mode][sc];}
			}
		}
	}
}

export function countAllConnections() {
  return Object.keys(connsData).length;
}

