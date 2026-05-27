import {mhToLatLong} from './geoFuncs.js'
import {onDataUpdate} from './pageMgr.js'

let dataVignettes = new Map();

export function addSpot(spot, senderIsInHome, receiverIsInHome) {
	if (spot.sl && spot.rl){
		const sRecord = {call:spot.sc, sq:spot.sl, tx:true, rx:false, isInHome:senderIsInHome};
		const rRecord = {call:spot.rc, sq:spot.rl, tx:false, rx:true, isInHome:receiverIsInHome};
		const bandMode = spot.b+" "+spot.md;
		if(!dataVignettes.get(bandMode)) {
			console.log("Create data vignette "+bandMode);
			dataVignettes.set(bandMode, new DataVignette(bandMode));
		}
		dataVignettes.get(bandMode).recordConnection(sRecord, rRecord);
	}
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
		this.stats = {};
		this.srRecords = new Map();
		this.connectionStrings = [];
	}
	
	getStats(){ 
		let totalTx = 0, totalRx = 0, total = 0;
		for (const call of this.srRecords.keys()) {
			let crec = this.srRecords.get(call);
			if (crec.isInHome){
				total +=1;
				if(crec.tx) totalTx +=1;
				if(crec.rx) totalRx +=1;
			}
		}
		this.stats = {
		  cls: total,
		  tx_pc: Math.round(100*totalTx/total),
		  rx_pc: Math.round(100*totalRx/total)
		};
	}
	
	getConnectionStrings(){
		return this.connectionStrings;	
	}
	
	getsrRecords(){
		return this.srRecords;
	}
	
	recordConnection(sRecord, rRecord){
		let changed = false;
		let connectionString = sRecord.call+"|"+rRecord.call;
		changed |= this._update_srRecords(sRecord);  
		changed |= this._update_srRecords(rRecord);
		if(!this.connectionStrings.includes(connectionString)) {	
			this.connectionStrings.push(connectionString);
			changed = true;
		}
		if (changed) {
			onDataUpdate(this.bandMode);
		}
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
		
		if (changed) {
			this.srRecords.set(call, srRecordNew);
		}
		return changed;
	}
		
}


