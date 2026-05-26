
import {colours, mapcolours} from './config.js'

let landPolys110m = null;
let landPolys50m = null;

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson').then(resp => resp.json()).then(data => {
	console.log("GeoJSON loaded:", data);
	landPolys110m = data;
});

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson').then(resp => resp.json()).then(data => {
	console.log("GeoJSON loaded:", data);
	landPolys50m = data;
});

export class GeoView{
	constructor(dataVignette, canvasElement) {
		this.dataVignette = dataVignette;
		this.canvasElement = canvasElement;
		this.axisRanges = {'latmin':-90, 'latmax':90, 'lonmin':-180, 'lonmax':180};
		this.drawnCalls = new Map();
		this.currentHover = null;
		this.ctx = this.canvasElement.getContext('2d');
		this.canvasElementSize = {w:canvasElement.width, h:canvasElement.height};
		this.dirty = false;
		this.redrawPending = false;
		console.log("Created geoView with size "+this.canvasElementSize.w + ", "+ this.canvasElementSize.h);
	}
	
	invalidate(){
        this.dirty=true;
        if(this.redrawPending) return;
        this.redrawPending=true;
        requestAnimationFrame(()=>{
            this.redrawPending=false;
            if(this.dirty){
                this.dirty=false;
                this.render();
            }
        });
    }
	
	getPointerLatLon(e){
		let rect = this.canvasElement.getBoundingClientRect();
		let norms = [(e.clientX - rect.left)/(rect.right-rect.left), (rect.bottom - e.clientY) / (rect.bottom-rect.top)];
		let r = this.axisRanges;	
		return [r.latmin + norms[1]*(r.latmax-r.latmin), r.lonmin + norms[0]*(r.lonmax-r.lonmin)];
	}
	
	getPix(ll){
		let c = this.canvasElementSize;
		let r = this.axisRanges;		
		let x = c.w * (ll[1]-r.lonmin)/(r.lonmax-r.lonmin);
		let y = c.h - c.h * (ll[0]-r.latmin)/(r.latmax-r.latmin);
		return [x,y];
	}
	
	setCentre([lat0, lon0]){
		let g = this.axisRanges;
		let latmean = (g.latmin + g.latmax)/2.0;
		let lonmean = (g.lonmin + g.lonmax)/2.0;
		g.latmin += lat0 - latmean;
		g.latmax += lat0 - latmean;
		g.lonmin += lon0 - lonmean;
		g.lonmax += lon0 - lonmean;	
	}
	
	setZoom(zoomFactor){
		let g = this.axisRanges;
		let latmean = (g.latmin + g.latmax)/2.0;
		let lonmean = (g.lonmin + g.lonmax)/2.0;
		g.latmin = latmean + (g.latmin - latmean) / zoomFactor;
		g.latmax = latmean + (g.latmax - latmean) / zoomFactor;
		g.lonmin = lonmean + (g.lonmin - lonmean) / zoomFactor;
		g.lonmax = lonmean + (g.lonmax - lonmean) / zoomFactor;	
	}
	
	zoomToBox(newBox, marginFactor){
		let e = this.axisRanges;
		let n = newBox;
		this.setCentre([(n.latmax + n.latmin)/2.0, (n.lonmax + n.lonmin)/2.0]);
		let zoomFactor = Math.min( (e.latmax - e.latmin)/(n.latmax-n.latmin), (e.lonmax - e.lonmin)/(n.lonmax-n.lonmin));
		this.setZoom(zoomFactor * marginFactor);
	}
	
	drawConnection(endpointCallsigns, endpointRecords, highlightCall){
		
		for (const cRecord of endpointRecords) {
			cRecord.p = this.getPix(cRecord.latlong); // with p back in cRecord, do I still need this.drawnCalls? Maybe yes as it's a subset of cRecords?
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
	
	render(){

		const callsignRecords = this.dataVignette.getCallsignRecords();
		const connectionStrings = this.dataVignette.getConnectionStrings(); 
		const highlightCall = '';

		this.drawnCalls = new Map();
		const res = 110;
		if (res == 110) this._drawMap(landPolys110m);
		if (res == 50) this._drawMap(landPolys50m);

		for (const connectionString of connectionStrings){
			let vis = false;
			let endpointCallsigns = connectionString.split('|');
			let endpointRecords = [callsignRecords.get(endpointCallsigns[0]), callsignRecords.get(endpointCallsigns[1])];
			vis |= (endpointRecords[0].isInHome && document.getElementById('homeTx').checked); 
			vis |= (endpointRecords[1].isInHome && document.getElementById('homeRx').checked);
			if (vis){	
				this.drawConnection(endpointCallsigns, endpointRecords, highlightCall);
			}
		}	
		
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
	
	_drawMap(landPolys){
		this.ctx.clearRect(0,0, this.canvasElementSize.w, this.canvasElementSize.h);
		this.ctx.strokeStyle = colours.map;
		this.ctx.lineWidth = 2;
		landPolys?.features.forEach(feature => {
			const geom = feature.geometry;
			if (geom.type === 'Polygon') {
				this._drawPolygons(geom.coordinates);
			}
		});
	}

	_drawPolygons(polys) {
		polys.forEach(poly => {
			this.ctx.beginPath();
			poly.forEach(([lon, lat], i) => {
			let p = this.getPix([lat, lon]);
				i === 0 ? this.ctx.moveTo(p[0], p[1]) : this.ctx.lineTo(p[0], p[1]);
			});
			this.ctx.closePath();
			this.ctx.fillStyle = mapcolours.land;
			this.ctx.fill();
			//this.ctx.stroke();
		});
	}


}





 