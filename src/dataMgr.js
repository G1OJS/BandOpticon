import {mhToLatLong} from './geo.js'

let dataVignettes = new Map();

export class DataVignette{
	constructor(bandMode){
		this.bandMode = bandMode;
		this.band = this.bandMode.split(' ')[0];
		this.wavelength = parseInt(this.band.split("m")[0]);
		if (this.band.search("cm") > 0) this.wavelength /= 100;
		this.mode = this.bandMode.split(' ')[1];
		this.stats = {};
		this.cRecords = new Map();
		this.connRecords = new Set();
	}
	
	getStats(){ 
		let totalTx = 0, totalRx = 0, total = 0;
		for (const call of this.cRecords.keys()) {
			let crec = this.cRecords.get(call);
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
	
	addConnection(sRecord, rRecord){
		let conn = sRecord.call+"|"+rRecord.call;
		this._refreshcRecord(sRecord);  
		this._refreshcRecord(rRecord);
		if(!this.connRecords.has(conn)) {	
			this.connRecords.add(conn);
		}
	}
	
	_refreshcRecord(cRecordNew){
		let call = cRecordNew.call;
		let cRecordExisting = this.cRecords.get(call);
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
			this.cRecords.set(call, cRecordNew);
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
		dataVignettes.sort((a, b) => b.wavelength - a.wavelength);
	}
	dataVignettes.get(bandMode).addConnection(sRecord, rRecord);
}
