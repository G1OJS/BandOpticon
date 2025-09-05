
export var liveConnsData = {};
export var call_locs= {};
export var latestTimestamp = 0;

export var homeCalls = null;
export var leaderCall = null;
export var otherCalls_myCall1 = null;
export var otherCalls_Leader = null;
export var otherCalls_All = null;

import {mhToLatLong, squareIsInHome} from './geo.js';
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
	if (!call_locs[spot.sc]){
		let ll = mhToLatLong(spot.sl);
		call_locs[spot.sc] = {x:ll[1], y:ll[0]};
	}
	if (!call_locs[spot.rc]){
		let ll = mhToLatLong(spot.rl);
		call_locs[spot.rc] = {x:ll[1], y:ll[0]};
	}

    // tree structure of timestamps for each home call for both home transmit and home receive
    // connsData[band][mode][Tx|Rx][homeCall][otherCall] = t	
	const rp = spot.rp;
    if (!connsData[band]) { connsData[band] = {}; }
    if (!connsData[band][mode]) {connsData[band][mode] = {Tx: {}, Rx: {} }; }	
	let h = null; let o = null; let d = null;
    if (sh) {h = spot.sc; o = spot.rc; d = connsData[band][mode].Tx;}
    if (rh) {h = spot.rc; o = spot.sc; d = connsData[band][mode].Rx;}
	if (!d[h]) d[h] = {}; 
	if (!d[h][o]) d[h][o] = [];
	d[h][o]=t;
}

export function purgeLiveConnections() {
	
	// need to add purge for call_locs too
	
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
						if(otherCall.t < cutoff) {toDelete.push(otherCall)}
					}
					toDelete.forEach(otherCall=> {delete otherCalls[otherCall];});
					if (Object.keys(homeCall).length === 0) {delete liveConnsData[band][mode][dir][homeCall];}
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
					for (const otherCall in otherCalls) {
						nConns += 1;
					}
				}
			}
		}
	}
  return nConns;
}

