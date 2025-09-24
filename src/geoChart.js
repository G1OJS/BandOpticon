import {mhToLatLong} from './geo.js'
import {myCall, colours} from './config.js'

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
		this.callRecords = new Map();
		this.connRecords = new Set();
		this.drawMap();
	}
	getStats(){ 
		return this.callRecords.size + "cls " + this.connRecords.size+"cns";
	}
	px(ll){
		let z = this.zoomParams;
		let xnorm = 0.5 + z.scale*(ll[1] - z.lon0)/360;
		let ynorm = 0.5 + z.scale*(ll[0] - z.lat0)/180;
		let x = this.canvasElementSize.w*xnorm;
		let y = this.canvasElementSize.h-this.canvasElementSize.h*ynorm;
		return [x,y];
	}
	recordConnection(sRecord, rRecord){
		let conn = sRecord.call+"|"+rRecord.call;
		let highlight = (sRecord.call==myCall || rRecord.call==myCall);
		this._recordCall(sRecord, highlight);
		this._recordCall(rRecord, highlight);
		if(!this.connRecords.has(conn)) {
			this.connRecords.add(conn);
			this._drawConnection(conn, highlight);
		}
	}
	_recordCall(cRecord, highlight){
		let callRecord = this.callRecords.get(cRecord.call) || cRecord;
		if (callRecord.p == null) callRecord.p = this.px(mhToLatLong(cRecord.sq));
		callRecord.tx ||= cRecord.tx;
		callRecord.rx ||= cRecord.rx;
		this.callRecords.set(cRecord.call, callRecord);
		this._drawCall(callRecord, highlight);
	}
	_drawConnection(conn, highlight){
		let col = highlight? colours.connhl:colours.conn;
		let s = this.callRecords.get(conn.split("|")[0]); 
		let r = this.callRecords.get(conn.split("|")[1]); 
		this.ctx.strokeStyle = col;
		this.ctx.lineWidth=2;
		this.ctx.beginPath();
		this.ctx.moveTo(s.p[0],s.p[1]);
		this.ctx.lineTo(r.p[0],r.p[1]);
		this.ctx.stroke();
	}
	_drawCall(callRecord, highlight){
		if(highlight){
			this.ctx.fillStyle = (callRecord.tx && callRecord.rx)? colours.txrxhl: (callRecord.tx? colours.txhl: colours.rxhl);
		} else {
			this.ctx.fillStyle = (callRecord.tx && callRecord.rx)? colours.txrx: (callRecord.tx? colours.tx: colours.rx);
		}
		this.ctx.beginPath();
		this.ctx.arc(callRecord.p[0],callRecord.p[1],8,0,6.282);
		this.ctx.fill();
	}
	retouchHighlights(){
		for (const [conn, connRecord] of this.connRecords.entries()){
			if(conn.search(myCall)>=0) this._drawConnection(conn, true);
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
		
		for (const callRecord of this.callRecords.values()) callRecord.p = this.px(mhToLatLong(callRecord.sq));
		this.redraw();
	}
	redraw(){
		this.drawMap();
		for (const conn of this.connRecords) this._drawConnection(conn, false);
		for (const call of this.callRecords.values()) this._drawCall(call, false);
		this.retouchHighlights();	
	}
	
	showInfo(e){
		this.canvasElement.style = 'cursor:zoom-in;';
		this.canvasElement.title = '';
		let rect = this.canvasElement.getBoundingClientRect();
		let x = this.canvasElementSize.w * (e.clientX - rect.left) / (rect.right-rect.left);
		let y = this.canvasElementSize.h * (e.clientY - rect.top)/ (rect.bottom-rect.top);	

		for (const [call, callRecord] of this.callRecords.entries()) { 
			let p = callRecord.p;
			if(Math.abs(p[0] - x) < 5 && Math.abs(p[1] - y)<5) {
				this.canvasElement.title = call;
				this.canvasElement.style = 'cursor:default;';
			}
		}
	}
}





 