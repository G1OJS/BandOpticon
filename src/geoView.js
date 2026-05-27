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
		this.drawnCallsCanv = null;
		this.highlightCall = null;
		this.currentHover = null;
		this.ctx = this.canvasElement.getContext('2d');
		this.usedNDC = {'x0':1,'w':0, 'y0':1, 'h':0};
		this.viewNDC = {'x0':-1, 'w':2, 'y0':-1, 'h':2};
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
				if (localStorage.getItem(this.zoomControlCheckBox) == 'true'){
					this.zoomToData();
					this.invalidate();
				} 
            }
        });
    }
	
	updateUsedNDC(pNDC){
		let u = this.usedNDC;
		u.x0 = Math.min(u.x0, pNDC.x);
		u.y0 = Math.min(u.y0, pNDC.y);
		u.w = Math.max(u.w, pNDC.x - u.x0);
		u.h = Math.max(u.h, pNDC.y - u.y0);
	}
	
	render(){
		const srRecords = this.dataVignette.getsrRecords();
		const connectionStrings = this.dataVignette.getConnectionStrings(); 
		myCall = localStorage.getItem('myCall');

		this.drawnCallsCanv = new Map();
		if (this.mapres == 110) this._drawMap(landPolys110m);
		if (this.mapres == 50) this._drawMap(landPolys50m);

		for (const connectionString of connectionStrings){
			let vis = false;
			let epCallsigns = connectionString.split('|');
			let epRecords = [srRecords.get(epCallsigns[0]), srRecords.get(epCallsigns[1])];
			vis |= (epRecords[0].isInHome && document.getElementById('homeTx').checked); 
			vis |= (epRecords[1].isInHome && document.getElementById('homeRx').checked);
			if (vis){	
				this._drawConnection(epRecords);
			}
		}	
		
	}
	
	onMouseMove(e){
		let hovering_over = null;
		const ptrCanv = this.getPtrNDC(e);

		for (const [call, pCanv] of this.drawnCallsCanv.entries()) { 
			if(Math.abs(ptrCanv.x - pCanv.x) < 5 && Math.abs(ptrCanv.x - pCanv.x)<5) {
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
	
	getNDC(latlon){
		return {'x':latlon.lon/180, 'y':latlon.lat/90};
	}
	
	getCanv(pNDC){
		const vp = this.viewNDC;
		const cv = {w:this.canvasElement.width, h:this.canvasElement.height};
		return {'x':cv.w * (pNDC.x - vp.x0)/vp.w, 'y':cv.h - cv.h * (pNDC.y - vp.y0)/vp.h}; 
	}
	
	getPtrNDC(e){
		const rect = this.canvasElement.getBoundingClientRect();
		const vp = this.viewNDC;
		return {'x': vp.x0 + vp.w*(e.clientX - rect.left) / (rect.right-rect.left), 
				'y': vp.y0 + vp.h*(rect.bottom - e.clientY)/ (rect.bottom-rect.top)};
	}

	setZoom(zoomFactor, centreNDC){
		const vn = this.viewNDC;
		if (centreNDC) {
			const cn = centreNDC;			
			vn.x0 = cn.x - vn.w/2;
			vn.y0 = cn.y - vn.h/2;			
		}
		vn.x0 += (zoomFactor-1) * vn.w / 2;
		vn.y0 += (zoomFactor-1) * vn.h / 2;
		vn.w -= (zoomFactor-1) * vn.w;
		vn.h -= (zoomFactor-1) * vn.h;
	}
	
	zoomToData(){
		this.viewNDC = structuredClone(this.usedNDC);
		this.viewNDC.w = Math.max(this.viewNDC.w, this.viewNDC.h);
		this.viewNDC.h = Math.max(this.viewNDC.h, this.viewNDC.w);
		const usedNDCCentre = {'x': this.usedNDC.x0 + this.usedNDC.w/2, 'y':this.usedNDC.y0 + this.usedNDC.h/2};
		this.setZoom(0.8, usedNDCCentre);
	}
	
	zoomFullEarth(){
		this.viewNDC = {'x0':-1, 'w':2, 'y0':-1, 'h':2};
	}
	
	zoomToPointerPos(e, zoomFactor){
		let xy = this.getPtrNDC(e);
		this.setZoom(zoomFactor, xy);
	}
	
	_drawConnection(srRecords){
		
		let epCanv = [];
		let showConnection = false;
		
		for (const epRecord of srRecords) {
			const pNDC = this.getNDC(epRecord.latlong);
			this.updateUsedNDC(pNDC);
			const pCanv = this.getCanv(pNDC);
			this.drawnCallsCanv.set(epRecord.call, pCanv);
			epCanv.push(pCanv)
			this.ctx.beginPath();
			this.ctx.arc(pCanv.x, pCanv.y, 6, 0, 6.282);
			this.ctx.fillStyle = (epRecord.tx && epRecord.rx)? colours.txrx: (epRecord.tx? colours.tx: colours.rx);
			this.ctx.fill();
			if (epRecord.call == this.highlightCall){
				showConnection = true;
				this.ctx.strokeStyle = this.ctx.fillStyle;
			}
		}
		
		if (showConnection) {
			const epts = {'s':epCanv[0], 'r':epCanv[1]};
			this.ctx.lineWidth=2;
			this.ctx.beginPath();
			this.ctx.moveTo(epts.s.x, epts.s.y);
			this.ctx.lineTo(epts.r.x, epts.r.y);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.arc(epts.s.x, epts.s.y, 6, 0, 6.282);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.arc(epts.r.x, epts.r.y, 6, 0, 6.282);
			this.ctx.stroke();
		}
		
	}
	
	_drawMap(landPolys){
		this.ctx.clearRect(0,0, this.canvasElement.width, this.canvasElement.height);
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
				const pNDC = this.getNDC({'lat':lat, 'lon':lon});
				const pCanv = this.getCanv(pNDC);
				i === 0 ? this.ctx.moveTo(pCanv.x, pCanv.y) : this.ctx.lineTo(pCanv.x, pCanv.y);
			});
			this.ctx.closePath();
			this.ctx.fillStyle = mapcolours.land;
			this.ctx.fill();
		});
	}


}





 