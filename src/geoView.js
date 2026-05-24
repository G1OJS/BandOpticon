
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
		this.drawnCalls ={};
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
			const p = this.px(cRecord.latlong);
			this.drawnCalls[cRecord.call] = p;
			this.ctx.beginPath();
			this.ctx.arc(p[0], p[1], 6, 0, 6.282);
			this.ctx.fillStyle = (cRecord.tx && cRecord.rx)? colours.txrx: (cRecord.tx? colours.tx: colours.rx);
			this.ctx.fill();
		}
		
		if (endpointCallsigns.includes(highlightCall)) {
			this.ctx.strokeStyle = colours.rx;
			if (sRecord.call == highlightCall) this.ctx.strokeStyle = colours.tx;
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
		this.drawnCalls ={};
		this._drawMap();
	}
	
	getCallAt(p){

		for (const [call, pos] of this.drawnCalls.entries()) { 
			if(Math.abs(p[0] - pos[0]) < 5 && Math.abs(p[1] - pos[1])<5) {
				this.canvasElement.style = 'cursor:default;';
				this.canvasElement.title = call;
				hovering_over = call;
				break;
			}
		}
		
		if (hovering_over !== this.currentHover) {
			this.currentHover = hovering_over;
			this.redraw(hovering_over);
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





 