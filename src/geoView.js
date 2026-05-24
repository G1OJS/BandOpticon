
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
		this.viewProps = {};
		this.zoomParams = null;
		this.currentHover = null;
		this.ctx = this.canvasElement.getContext('2d');
		this.canvasElementSize = {w:canvasElement.width, h:canvasElement.height};
		this.bgCol = 'white';
		this.stats = {};
		this.setZoom('zoomFullEarth');
		console.log("Created geoView with size "+this.canvasElementSize.w + ", "+ this.canvasElementSize.h);
	}
	
	setMarkerSize(markerSize){
		this.viewProps.markerSize = markerSize;
	}
	
	px(ll){
		let z = this.zoomParams;
		let xnorm = 0.5 + z.scale*(ll[1] - z.lon0)/360;
		let ynorm = 0.5 + z.scale*(ll[0] - z.lat0)/180;
		let x = this.canvasElementSize.w*xnorm;
		let y = this.canvasElementSize.h-this.canvasElementSize.h*ynorm;
		return [x,y];
	}
	
	drawConnection(endpointCallsigns, endpointRecords, highlightCall){
		
		for (const cRecord of endpointRecords) {
			const p = this.px(cRecord.latlong);
			this.ctx.beginPath();
			this.ctx.arc(p[0], p[1], this.viewProps.markerSize, 0, 6.282);
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

	drawMap(){
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
	
	setZoom(zoomAction){
		if(zoomAction == 'zoomFullEarth') this.zoomParams = {scale:1.2, lat0:0, lon0:0};

		if(zoomAction == 'zoomToData'){
			let latrng = [90,-90];
			let lonrng = [180,-180];
			for (const cRecord of this.cRecords.values()){
				let ll = cRecord.latlong;
				if (ll[0] > latrng[1]) {latrng[1] = ll[0];}
				if (ll[0] < latrng[0]) {latrng[0] = ll[0];}
				if (ll[1] > lonrng[1]) {lonrng[1] = ll[1];}
				if (ll[1] < lonrng[0]) {lonrng[0] = ll[1];}
			}
			this.zoomParams.lat0 = 0.5*(latrng[1]+latrng[0]);
			this.zoomParams.lon0 = 0.5*(lonrng[1]+lonrng[0]);
			let a = 90/Math.abs((latrng[1]-this.zoomParams.lat0));
			let b = 90/Math.abs((latrng[0]-this.zoomParams.lat0));
			let c = 180/Math.abs((lonrng[1]-this.zoomParams.lon0));
			let d = 180/Math.abs((lonrng[0]-this.zoomParams.lon0));
			this.zoomParams.scale = Math.max(Math.min(a,b,c,d)/1.2, 1);
		}
		
		if(zoomAction == 'zoomOut'){		
			this.zoomParams.scale = Math.max(this.zoomParams.scale / 1.2, 1);
		}	
	}
	
	onMouseMove(e){
		let hovering_over = this.myCall;
		this.canvasElement.title = '';
		let rect = this.canvasElement.getBoundingClientRect();
		let x = this.canvasElementSize.w * (e.clientX - rect.left) / (rect.right-rect.left);
		let y = this.canvasElementSize.h * (e.clientY - rect.top)/ (rect.bottom-rect.top);	

		for (const [call, cRecord] of this.cRecords.entries()) { 
			let p = cRecord.p;
			if (p !== null) { // some cRecords might not have had p set in _updateCanvas
				if(Math.abs(p[0] - x) < 5 && Math.abs(p[1] - y)<5) {
					this.canvasElement.style = 'cursor:default;';
					this.canvasElement.title = call;
					hovering_over = call;
				}
			}
		}
		
		if (hovering_over !== this.currentHover) {
			this.currentHover = hovering_over;
			this.redraw(hovering_over);
		}

	}
}





 