import {mhToLatLong} from './geoFuncs.js'
import {updateView} from './pageMgr.js'

let dataVignettes = new Map();

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
		this.callsignRecords = new Map();
		this.connectionStrings = [];
	}
	
	getStats(){ 
		let totalTx = 0, totalRx = 0, total = 0;
		for (const call of this.callsignRecords.keys()) {
			let crec = this.callsignRecords.get(call);
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
	
	getCallsignRecords(){
		return this.callsignRecords;
	}
	
	recordConnection(sRecord, rRecord){
		let changed = false;
		let connectionString = sRecord.call+"|"+rRecord.call;
		changed |= this._update_cRecords(sRecord);  
		changed |= this._update_cRecords(rRecord);
		if(!this.connectionStrings.includes(connectionString)) {	
			this.connectionStrings.push(connectionString);
			changed = true;
		}
		if (changed) {
			updateView(this.bandMode);
		}
	}
	
	_update_cRecords(cRecordNew){
		let call = cRecordNew.call;
		let cRecordExisting = this.callsignRecords.get(call);
		let changed = false;
		let noLatLong = false;
		
		if(cRecordExisting === undefined) {
			noLatLong = true;
		} else {
			noLatLong |= (cRecordNew.latlong === undefined);
			changed |= (cRecordNew.tx != cRecordExisting.tx)
			changed |= (cRecordNew.rx != cRecordExisting.rx)
			cRecordNew.tx |= cRecordExisting.tx;
			cRecordNew.rx |= cRecordExisting.rx;
		}
		
		if (noLatLong){
			if(cRecordNew.sq){
				cRecordNew.latlong = mhToLatLong(cRecordNew.sq);
				changed = true;
			}
		}
		
		if (changed) {
			this.callsignRecords.set(call, cRecordNew);
		}
		return changed;
	}
		
}

export function addSpot(spot, senderIsInHome, receiverIsInHome) {
	const sRecord = {call:spot.sc, p:null, sq:spot.sl, tx:true, rx:false, isInHome:senderIsInHome};
	const rRecord = {call:spot.rc, p:null, sq:spot.rl, tx:false, rx:true, isInHome:receiverIsInHome};
	const bandMode = spot.b+" "+spot.md;
	if(! dataVignettes.get(bandMode)) {
		console.log("Create data vignette "+bandMode);
		dataVignettes.set(bandMode, new DataVignette(bandMode));
		//dataVignettes.sort((a, b) => b.wavelength - a.wavelength);
	}
	dataVignettes.get(bandMode).recordConnection(sRecord, rRecord);
}
