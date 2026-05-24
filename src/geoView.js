
import {colours} from './config.js'

let worldGeoJSON = null;

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_coastline.geojson')
.then(resp => resp.json())
.then(data => {
	console.log("GeoJSON loaded:", data);
worldGeoJSON = data;
});

export class GeoView{
	constructor(canvasElement) {
		this.canvasElement = canvasElement;
		this.axisRanges = {'lat0':-90, 'lat1':90, 'lon0':-180, 'lon1':180};
		this.drawnCalls = new Map();
		this.currentHover = null;
		this.ctx = this.canvasElement.getContext('2d');
		this.canvasElementSize = {w:canvasElement.width, h:canvasElement.height};
		this.bgCol = 'white';
		this.stats = {};
		console.log("Created geoView with size "+this.canvasElementSize.w + ", "+ this.canvasElementSize.h);
	}
	
	px(ll){
		let c = this.canvasElementSize;
		let r = this.axisRanges;		
		let x = c.w * (ll[1]-r.lon0)/(r.lon1-r.lon0);
		let y = c.h - c.h * (ll[0]-r.lat0)/(r.lat1-r.lat0);
		return [x,y];
	}
	
	drawConnection(endpointCallsigns, endpointRecords, highlightCall){
		
		for (const cRecord of endpointRecords) {
			cRecord.p = this.px(cRecord.latlong);
			this.drawnCalls.set(cRecord.call, cRecord.p);
			this.ctx.beginPath();
			this.ctx.arc(cRecord.p[0], cRecord.p[1], 6, 0, 6.282);
			this.ctx.fillStyle = (cRecord.tx && cRecord.rx)? colours.txrx: (cRecord.tx? colours.tx: colours.rx);
			this.ctx.fill();
		}
		
		if (endpointCallsigns.includes(highlightCall)) {
			let [sRecord, rRecord] = endpointRecords;
			this.ctx.strokeStyle = colours.rx;
			if (endpointCallsigns[0] == highlightCall) this.ctx.strokeStyle = colours.tx;
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

	rebase(){
		this.drawnCalls = new Map();
		this._drawMap();
	}
	
	updateHoveringOver(e){
		let hovering_over = null;
		let rect = this.canvasElement.getBoundingClientRect();
		let x = this.canvasElementSize.w * (e.clientX - rect.left) / (rect.right-rect.left);
		let y = this.canvasElementSize.h * (e.clientY - rect.top)/ (rect.bottom-rect.top);

		for (const [call, pos] of this.drawnCalls.entries()) { 
			//console.log(x, pos[0], y, pos[1]);
			if(Math.abs(x - pos[0]) < 5 && Math.abs(y - pos[1])<5) {
				this.canvasElement.style = 'cursor:default;';
				this.canvasElement.title = call;
				hovering_over = call;
				break;
			}
		}
		if (hovering_over !== this.currentHover) {
			this.currentHover = hovering_over;
		}
	}
	
	_drawMap(){
		this.ctx.clearRect(0,0, this.canvasElementSize.w, this.canvasElementSize.h);
		this.ctx.strokeStyle = colours.map;
		this.ctx.lineWidth = 2;
		worldGeoJSON?.features.forEach(feature => {
			const geom = feature.geometry;
			if (geom.type === 'LineString') {
				this._drawLineString(geom.coordinates);
			}
		});
	}

	_drawLineString(coords) {
		this.ctx.beginPath();
		coords.forEach(([lon, lat], i) => {
			let p = this.px([lat, lon]);
				i === 0 ? this.ctx.moveTo(p[0], p[1]) : this.ctx.lineTo(p[0], p[1]);
			});
		this.ctx.stroke();
	}
	


}





 