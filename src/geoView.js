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
	constructor(dataVignette, canvasElement, zoomControlCheckBox, mapres) {
		this.dataVignette = dataVignette;
		this.canvasElement = canvasElement;
		this.zoomControlCheckBox = zoomControlCheckBox;
		this.mapres = mapres;
		this.drawnCalls = null;
		this.highlightCall = null;
		this.currentHover = null;
		this.ctx = this.canvasElement.getContext('2d');
		this.canvasElementSize = {w:this.canvasElement.width, h:this.canvasElement.height};
		this.pixViewBox = {'x0':0, 'w':this.canvasElement.width, 'y0':0, 'h':this.canvasElement.height};
		this.dirty = false;
		this.redrawPending = false;
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

		if (localStorage.getItem(this.zoomControlCheckBox) == 'true'){
			this.zoomToData();
		} 
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
		let xy = this.getPointerPix(e);

		for (const [call, pos] of this.drawnCalls.entries()) { 
			if(Math.abs(xy.x - p.x) < 5 && Math.abs(xy.x - p.x)<5) {
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
	
	getPix(latlon){
		const nm = {'x':(latlon.lon+180)/360, 'y':(latlon.lat+90)/180};
		const vp = this.pixViewBox;
		const cv = this.canvasElementSize;
		const xy = {'x':cv.w*nm.x, 'y':cv.h - cv.h*nm.y};
		return {'x':(xy.x-vp.x0)*cv.w/vp.w, 'y':(xy.y-vp.y0)*cv.h/vp.h}; 
	}
	
	getPointerPix(e){
		let rect = this.canvasElement.getBoundingClientRect();
		let vp = this.pixViewBox;
		return {'x': vp.x0 + vp.w*(e.clientX - rect.left) / (rect.right-rect.left), 
				'y': vp.y0 + vp.h - vp.h*(rect.bottom - e.clientY)/ (rect.bottom-rect.top)};
	}
	
	setCentre(xy){
		let vp = this.pixViewBox;
		vp.x0 = xy.x - vp.w/2;
		vp.y0 = xy.y - vp.h/2;
	}
	
	setZoom(zoomFactor){
		let vp = this.pixViewBox;
		vp.x0 += (zoomFactor-1) * vp.w / 2;
		vp.y0 += (zoomFactor-1) * vp.h / 2;
		vp.w -= (zoomFactor-1) * vp.w;
		vp.h -= (zoomFactor-1) * vp.h;
	}
	
	zoomToData(){
		//this.axisRanges = this.dataVignette.geoRange;	
		//this.setZoom(0.8);
	}
	
	zoomFullEarth(){
		this.pixViewBox = {'x0':0, 'w':this.canvasElement.width, 'y0':0, 'h':this.canvasElement.height};
	}
	
	zoomToPointerPos(e, zoomFactor){
		let xy = this.getPointerPix(e);
		this.setCentre(xy);
		this.setZoom(zoomFactor);
	}
	
	_drawConnection(endpointRecords){
		
		let epPos = [];
		let showConnection = false;
		
		for (const epRecord of endpointRecords) {
			const p = this.getPix(epRecord.latlong);
			this.drawnCalls.set(epRecord.call, p);
			epPos.push(p)
			this.ctx.beginPath();
			this.ctx.arc(p.x, p.y, 6, 0, 6.282);
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
			this.ctx.moveTo(epPos[0].x, epPos[0].y);
			this.ctx.lineTo(epPos[1].x, epPos[1].y);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.arc(epPos[0].x, epPos[0].y, 6, 0, 6.282);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.arc(epPos[1].x, epPos[1].y, 6, 0, 6.282);
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
				let p = this.getPix({'lat':lat, 'lon':lon});
				i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y);
			});
			this.ctx.closePath();
			this.ctx.fillStyle = mapcolours.land;
			this.ctx.fill();
		});
	}


}





 