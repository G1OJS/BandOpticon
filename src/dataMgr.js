import {mhToLatLong, squaresToKmDeg} from './geoFuncs.js'
import {onDataUpdate} from './pageMgr.js'

let dataVignettes = new Map();
const ttl = 300000;

const purge = setInterval(() => {
  for (const dataVignette of dataVignettes.keys()){
	  dataVignettes.get(dataVignette).purgeStale();
  }
}, 5000);

export function addSpot(spot, senderIsInHome, receiverIsInHome) {
	if (spot.sl && spot.rl){
		const mapCentre = localStorage.getItem('mapCentre');
		const sRecord = {call:spot.sc, sq:spot.sl, tx:true, rx:false, isInHome:senderIsInHome, 'kmDeg':squaresToKmDeg(mapCentre, spot.sl)};
		const rRecord = {call:spot.rc, sq:spot.rl, tx:false, rx:true, isInHome:receiverIsInHome, 'kmDeg':squaresToKmDeg(mapCentre, spot.rl)};
		const bandMode = spot.b+" "+spot.md;
		if(!dataVignettes.get(bandMode)) {
			console.log("Create data vignette "+bandMode);
			dataVignettes.set(bandMode, new DataVignette(bandMode));
		}
		dataVignettes.get(bandMode).recordConnection(sRecord, rRecord);
	}
}

export function clearAllVignettes(bandMode){
	dataVignettes = new Map();
}

export function getDataVignette(bandMode){
	return dataVignettes.get(bandMode);
}

export class DataVignette{
	constructor(bandMode){
		this.bandMode = bandMode;
		let band = this.bandMode.split(' ')[0];
		this.wavelength = parseInt(band.split("m")[0]);
		if (band.search("cm") > 0) this.wavelength /= 100;
		this.srRecords = new Map();
		this.connections = new Set();
	}
	
	getStats(){ 
		let stats = {'calls': 0, 'callsHomeTx':0, 'callsHomeRx':0, 'callsHomeTxRx':0, 'connsHomeTx':0, 'connsHomeRx':0};
		
		for (const call of this.srRecords.keys()) {
			stats.calls +=1;
			let crec = this.srRecords.get(call);
			if (crec.isInHome){
				if ((crec.tx) && (crec.tx)) {
					stats.callsHomeTxRx +=1;
				} else {
					if(crec.tx) stats.callsHomeTx +=1;
					if(crec.rx) stats.callsHomeRx +=1;
				}
			}
		}
		for (const connection of this.connections){
			const epRecords = [this.srRecords.get(connection.s), this.srRecords.get(connection.r)];
			if (connection.s.isInHome) stats.connsHomeTx +=1;
			if (connection.r.isInHome) stats.connsHomeRx +=1;
		}
		return stats;
	}
	
	getconnections(){
		return this.connections;	
	}
	
	getsrRecords(){
		return this.srRecords;
	}
	
	recordConnection(sRecord, rRecord){
		let changed = false;
		let connection = {'s':sRecord.call, 'r':rRecord.call};
		changed |= this._update_srRecords(sRecord);  
		changed |= this._update_srRecords(rRecord);
		if(!this.connections.has(connection)) {	
			this.connections.add(connection);
			changed = true;
		}
		if (changed) {
			onDataUpdate(this.bandMode);
		}
	}

	_isCurrent(epRecord){
		return ((Date.now() - epRecord.lastSeen) < ttl)
	}

	purgeStale(){
		let srRecordsCurrent = new Map();
		for (const [call, rec] of this.srRecords.entries()) {
			if (this._isCurrent(rec)) srRecordsCurrent.set(call, rec);
		}
		let connectionsCurrent = new Set();
		for (const connection of this.connections){
			if (this._isCurrent(this.srRecords.get(connection.s)) &&  this._isCurrent(this.srRecords.get(connection.r)) ){
				connectionsCurrent.add(connection);
			}
		}
		this.srRecords = structuredClone(srRecordsCurrent);
		this.connections = structuredClone(connectionsCurrent);
	}
	
	_update_srRecords(srRecordNew){
		let call = srRecordNew.call;
		let srRecordExisting = this.srRecords.get(call);
		let changed = false;
		let noLatLong = false;
		
		if(srRecordExisting === undefined) {
			noLatLong = true;
		} else {
			noLatLong |= (srRecordNew.latlong === undefined);
			changed |= (srRecordNew.tx != srRecordExisting.tx)
			changed |= (srRecordNew.rx != srRecordExisting.rx)
			srRecordNew.tx |= srRecordExisting.tx;
			srRecordNew.rx |= srRecordExisting.rx;
		}
		
		if (noLatLong){
			srRecordNew.latlong = mhToLatLong(srRecordNew.sq);
			changed = true;
		}
		
		srRecordNew.lastSeen = Date.now();
		this.srRecords.set(call, srRecordNew);
		
		return changed;
	}
		
}
