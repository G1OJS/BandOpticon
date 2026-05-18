import {mhToLatLong} from './geo.js'
import {colours, highlightCall} from './config.js'

let worldGeoJSON = null;

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson')
//fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_coastline.geojson')
.then(resp => resp.json())
.then(data => {
	console.log("GeoJSON loaded:", data);
worldGeoJSON = data;
});

export class geoChart{
	constructor(canvasElement) {
		this.canvasElement = canvasElement;
		this.ctx = this.canvasElement.getContext('2d');
		this.canvasElementSize = {w:1200, h:600};
		this.zoomParams = {scale:1.2, lat0:0, lon0:0};
		this.bgCol = 'white';
		this.stats = {};
		this.cRecords = new Map();
		this.connRecords = new Set();
		this.drawMap();
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
	px(ll){
		let z = this.zoomParams;
		let xnorm = 0.5 + z.scale*(ll[1] - z.lon0)/360;
		let ynorm = 0.5 + z.scale*(ll[0] - z.lat0)/180;
		let x = this.canvasElementSize.w*xnorm;
		let y = this.canvasElementSize.h-this.canvasElementSize.h*ynorm;
		return [x,y];
	}
	addConnection(sRecord, rRecord, changed){
		let conn = sRecord.call+"|"+rRecord.call;
		changed |= this._refreshcRecord(sRecord);  
		changed |= this._refreshcRecord(rRecord);
		if(!this.connRecords.has(conn)) {	
			this.connRecords.add(conn);
			changed = true;
		}
		if (changed) {
			this._drawConnection(sRecord, rRecord);
		}
	}
	
	_refreshcRecord(cRecordNew){
		let call = cRecordNew.call;
		let cRecordExisting = this.cRecords.get(call);
		let changed = false;
		if(cRecordExisting === undefined) {
			changed = true;
		} else {
			changed |= (cRecordNew.tx != cRecordExisting.tx)
			changed |= (cRecordNew.rx != cRecordExisting.rx)
			cRecordNew.tx |= cRecordExisting.tx;
			cRecordNew.rx |= cRecordExisting.rx;
		}
		if (changed) {
			this.cRecords.set(call, cRecordNew);
		}
		return changed;
	}
	
	_drawConnection(sRecord, rRecord){
		
		if ( (sRecord.isInHome && document.getElementById('homeTx').checked) || (rRecord.isInHome && document.getElementById('homeRx').checked) ) {

			for (const cRecord of [sRecord, rRecord]) {
				if (cRecord.p === null) {
					cRecord.p = this.px(mhToLatLong(cRecord.sq));
				}
				this.ctx.beginPath();
				this.ctx.arc(cRecord.p[0], cRecord.p[1], 6, 0, 6.282);
				this.ctx.fillStyle = (cRecord.tx && cRecord.rx)? colours.txrx: (cRecord.tx? colours.tx: colours.rx);
				this.ctx.fill();
			}
			
			if (sRecord.call == highlightCall || rRecord.call == highlightCall) {
				this.ctx.strokeStyle = "black";
				this.ctx.lineWidth=2;
				this.ctx.beginPath();
				this.ctx.moveTo(sRecord.p[0],sRecord.p[1]);
				this.ctx.lineTo(rRecord.p[0],rRecord.p[1]);
				this.ctx.stroke();
				this.ctx.beginPath();
				this.ctx.arc(sRecord.p[0], sRecord.p[1], 6, 0, 6.282);
				this.ctx.stroke();
				this.ctx.beginPath();
				this.ctx.arc(rRecord.p[0], rRecord.p[1], 6, 0, 6.282);
				this.ctx.stroke();
			}
		
		}

	}

	redraw(){
		this.drawMap();
		for (const conn of this.connRecords) {
			let calls = conn.split('|');
			console.log(calls[0]);
			let sRecord = this.cRecords.get(calls[0]);
			let rRecord = this.cRecords.get(calls[1]);
			this.addConnection(sRecord, rRecord, true);
		}
	}
	drawMap(){
		this.ctx.clearRect(0,0, 2000,2000);
		this.ctx.strokeStyle = colours.map;
		this.ctx.lineWidth = 2;
		worldGeoJSON?.features.forEach(feature => {
			const geom = feature.geometry;
			if (geom.type === 'Polygon') {
				this.drawPolygons(geom.coordinates);
			} else if (geom.type === 'MultiPolygon') {
				geom.coordinates.forEach(polygon => this.drawPolygons(polygon));
			}
		});
	}
	drawPolygons(polys) {
		polys.forEach(poly => {
			this.ctx.beginPath();
			poly.forEach(([lon, lat], i) => {
			let p = this.px([lat, lon]);
				i === 0 ? this.ctx.moveTo(p[0], p[1]) : this.ctx.lineTo(p[0], p[1]);
			});
			this.ctx.closePath();
			this.ctx.stroke();
		});
	}
	zoom(zoomAction, e){
		if(zoomAction == 'reset') this.zoomParams = {scale:1.0, lat0:0, lon0:0};

		if(zoomAction == 'zoomIn'){		
			let rect = this.canvasElement.getBoundingClientRect();
			let xnorm = (e.clientX - rect.left) / (rect.right-rect.left);
			let ynorm = (e.clientY - rect.top)/ (rect.bottom-rect.top);	 
			this.zoomParams.lat0 = (-180*(ynorm-0.5) / this.zoomParams.scale) + this.zoomParams.lat0;
			this.zoomParams.lon0 = ( 360*(xnorm-0.5) / this.zoomParams.scale) + this.zoomParams.lon0;
			this.zoomParams.scale = this.zoomParams.scale *1.2;
		}
		for (const cRecord of this.cRecords.values()) cRecord.p = this.px(mhToLatLong(cRecord.sq));
		this.redraw();
	}
	showInfo(e){
		this.canvasElement.style = 'cursor:zoom-in;';
		this.canvasElement.title = '';
		let rect = this.canvasElement.getBoundingClientRect();
		let x = this.canvasElementSize.w * (e.clientX - rect.left) / (rect.right-rect.left);
		let y = this.canvasElementSize.h * (e.clientY - rect.top)/ (rect.bottom-rect.top);	

		for (const [call, cRecord] of this.cRecords.entries()) { 
			let p = cRecord.p;
			if(Math.abs(p[0] - x) < 5 && Math.abs(p[1] - y)<5) {
				this.canvasElement.title = call;
				this.canvasElement.style = 'cursor:default;';
			}
		}
	}
}





 