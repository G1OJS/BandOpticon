const colours = JSON.parse(localStorage.getItem('colours'));
const mapcolours = JSON.parse(localStorage.getItem('mapcolours'));

let landPolys110m = null;
let landPolys50m = null;
let myCall = null;

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson').then(resp => resp.json()).then(data => {
	console.log("GeoJSON loaded:", data);
	landPolys110m = data;
});

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson').then(resp => resp.json()).then(data => {
	console.log("GeoJSON loaded:", data);
	landPolys50m = data;
});

export class GeoView{
	constructor(dataVignette, canvasElement, mapres) {
		this.dataVignette = dataVignette;
		this.canvasElement = canvasElement;
		this.mapres = mapres;
		this.axisRanges = {'latmin':-90, 'latmax':90, 'lonmin':-180, 'lonmax':180};
		this.drawnCalls = null;
		this.highlightCall = null;
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
	
	render(){
		const callsignRecords = this.dataVignette.getCallsignRecords();
		const connectionStrings = this.dataVignette.getConnectionStrings(); 
		myCall = localStorage.getItem('myCall');

		this.drawnCalls = new Map();
		if (this.mapres == 110) this._drawMap(landPolys110m);
		if (this.mapres == 50) this._drawMap(landPolys50m);

		for (const connectionString of connectionStrings){
			let vis = false;
			let endpointCallsigns = connectionString.split('|');
			let endpointRecords = [callsignRecords.get(endpointCallsigns[0]), callsignRecords.get(endpointCallsigns[1])];
			vis |= (endpointRecords[0].isInHome && document.getElementById('homeTx').checked); 
			vis |= (endpointRecords[1].isInHome && document.getElementById('homeRx').checked);
			if (vis){	
				this._drawConnection(endpointRecords);
			}
		}	
		
	}
	
	onMouseMove(e){
		let hovering_over = null;
		let rect = this.canvasElement.getBoundingClientRect();
		let x = this.canvasElementSize.w * (e.clientX - rect.left) / (rect.right-rect.left);
		let y = this.canvasElementSize.h * (e.clientY - rect.top)/ (rect.bottom-rect.top);

		for (const [call, pos] of this.drawnCalls.entries()) { 
			if(Math.abs(x - pos[0]) < 5 && Math.abs(y - pos[1])<5) {
				this.canvasElement.style = 'cursor:default;';
				this.canvasElement.title = call;
				hovering_over = call;
				break;
			}
		}
		if (hovering_over !== this.currentHover) {
			this.currentHover = hovering_over;
			this.highlightCall = this.currentHover? this.currentHover: myCall;
			this.invalidate();
		}
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
	
	_drawConnection(endpointRecords){
		
		let epPos = [];
		let showConnection = false;
		
		for (const epRecord of endpointRecords) {
			const p = this.getPix(epRecord.latlong);
			this.drawnCalls.set(epRecord.call, p);
			epPos.push(p)
			this.ctx.beginPath();
			this.ctx.arc(p[0], p[1], 6, 0, 6.282);
			this.ctx.fillStyle = (epRecord.tx && epRecord.rx)? colours.txrx: (epRecord.tx? colours.tx: colours.rx);
			this.ctx.fill();
			if (epRecord.call == this.highlightCall){
				showConnection = true;
				this.ctx.strokeStyle = this.ctx.fillStyle;
			}
		}
		
		if (showConnection) {
			this.ctx.lineWidth=2;
			this.ctx.beginPath();
			this.ctx.moveTo(epPos[0][0], epPos[0][1]);
			this.ctx.lineTo(epPos[1][0], epPos[1][1]);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.arc(epPos[0][0], epPos[0][1], 6, 0, 6.282);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.arc(epPos[1][0], epPos[1][1], 6, 0, 6.282);
			this.ctx.stroke();
		}
		
	}
	
	_drawMap(landPolys){
		this.ctx.clearRect(0,0, this.canvasElementSize.w, this.canvasElementSize.h);
		this.ctx.strokeStyle = mapcolours.land;
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
		});
	}


}





 