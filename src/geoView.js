import {mhToLatLong, latlonToKmDeg} from './geoFuncs.js'

const colours = JSON.parse(localStorage.getItem('colours'));
const mapcolours = JSON.parse(localStorage.getItem('mapcolours'));
const connectionColours = ['black','red','green','blue','purple','yellow','orange','cyan','grey'];

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
	constructor(dataVignette, canvasElement, zoomControlCheckBox, mapres) {
		this.dataVignette = dataVignette;
		this.canvasElement = canvasElement;
		this.zoomControlCheckBox = zoomControlCheckBox;
		this.mapres = mapres;
		this.showAllConnections = false;
		this.showReciprocalConnections = false;
		this.drawnCalls = new Map();
		this.myCall = localStorage.getItem('myCall');
		this.highlightCall = localStorage.getItem('myCall');
		this.currentHover = null;
		this.ctx = this.canvasElement.getContext('2d');
		this.viewNDC = {'x0':-1, 'w':2, 'y0':-1, 'h':2};
		this.dirty = false;
		this.redrawPending = false;
		this.projection = 'AzEq';
		this.latlonCentre = mhToLatLong(localStorage.getItem('mapCentre'));
		this.unitCircle = null;
		this.earthHalfCircumference = latlonToKmDeg({'lat':0,'lon':0}, {'lat':0,'lon':180}).km;
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
		this.drawnCalls = new Map();
		if (localStorage.getItem(this.zoomControlCheckBox) == 'true'){
			this._drawConnections(false);
			this.setZoomToData();
		} 
		this.highlightCall = this.currentHover? this.currentHover: this.myCall;
		this.ctx.clearRect(0,0, this.canvasElement.width, this.canvasElement.height);
		this._drawSea();
		if (this.mapres == 110) this._drawLand(landPolys110m);
		if (this.mapres == 50) this._drawLand(landPolys50m);
		this._drawConnections(true);	
	}
	
	onMouseMove(e){
		let hovering_over = null;
		const ptrCanv = this.getCanv(this.getPtrNDC(e));
			
		for (const [call, dc] of this.drawnCalls.entries()) { 
			const pCanv = dc.canv;
			if(Math.abs(ptrCanv.x - pCanv.x) < 5 && Math.abs(ptrCanv.y - pCanv.y) < 5) {
				this.canvasElement.style = 'cursor:default;';
				this.canvasElement.title = call;
				hovering_over = call;
				break;
			}
		}
		if (hovering_over !== this.currentHover) {
			this.currentHover = hovering_over;
			this.highlightCall = this.currentHover? this.currentHover: this.myCall;
			this.invalidate();
		}
	}
	
	getNDC(latlon){
		if (this.projection == 'EqRect') {
			return {'x':latlon.lon/180, 'y':latlon.lat/90};
		}
		if (this.projection == 'AzEq') {
			const KmDeg = latlonToKmDeg(this.latlonCentre, latlon);
			const scl = this.earthHalfCircumference;
			return {'x':KmDeg.km * Math.sin(KmDeg.deg * Math.PI/180) / scl, 'y':KmDeg.km * Math.cos(KmDeg.deg * Math.PI/180) / scl};
		}
	}
	getPtrNDC(e) {	
		const rect = this.canvasElement.getBoundingClientRect();
		const vp = this.viewNDC;
		return {'x': vp.x0 + vp.w*(e.clientX - rect.left) / (rect.right-rect.left), 
				'y': vp.y0 + vp.h*(rect.bottom - e.clientY)/ (rect.bottom-rect.top)};
	}
	getCanv(pNDC) {
		const vp = this.viewNDC;
		const cv = {'w':this.canvasElement.width, 'h':this.canvasElement.height };
		return {'x':cv.w * (pNDC.x - vp.x0)/vp.w, 'y':cv.h - cv.h * (pNDC.y - vp.y0)/vp.h};
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
	
	setZoomToData(){
		if (this.drawnCalls.size > 0) {
			let usedNDC = {'x0':1, 'x1':-1, 'y0':1, 'y1':-1}; 
			for (const [call, dc] of this.drawnCalls.entries()) { 
				usedNDC.x0 = Math.min(usedNDC.x0, dc.ndc.x);
				usedNDC.y0 = Math.min(usedNDC.y0, dc.ndc.y);
				usedNDC.x1 = Math.max(usedNDC.x1, dc.ndc.x);
				usedNDC.y1 = Math.max(usedNDC.y1, dc.ndc.y);
			}
			const usedNDCCentre = {'x': (usedNDC.x0 + usedNDC.x1)/2, 'y':(usedNDC.y0 + usedNDC.y1)/2};
			this.viewNDC = {'x0':usedNDC.x0, 'y0':usedNDC.y0, 'w':usedNDC.x1 - usedNDC.x0, 'h':usedNDC.y1 - usedNDC.y0};
			this.viewNDC.w = Math.max(this.viewNDC.w, this.viewNDC.h, 0.01);
			this.viewNDC.h = Math.max(this.viewNDC.h, this.viewNDC.w, 0.01);
			this.setZoom(0.8, usedNDCCentre);
		}
	}
	
	zoomFullEarth(){
		this.viewNDC = {'x0':-1, 'w':2, 'y0':-1, 'h':2};
	}
	
	zoomToPointerPos(e, zoomFactor){
		let xy = this.getPtrNDC(e);
		this.setZoom(zoomFactor, xy);
	}
	
	_hasReciprocal(connections, connection){
		for (const conn of connections){
			if (conn.s == connection.r && conn.r == connection.s) return true;
		}
		return false;
	}
	
	_drawConnections(updateCanvas){
		const srRecords = this.dataVignette.getsrRecords();	
		const connections = this.dataVignette.getconnections();
		let homeCalls = new Set();
		for (const connection of connections){
			const [txRecord, rxRecord] = [srRecords.get(connection.s), srRecords.get(connection.r)];
			let vis = false; 
			vis |= (txRecord.isInHome && document.getElementById('homeTx').checked); 
			vis |= (rxRecord.isInHome && document.getElementById('homeRx').checked);
			if (txRecord.isInHome) homeCalls.add(connection.s);
			if (rxRecord.isInHome) homeCalls.add(connection.r);
			if (vis){	
				let epCanv = [];
				let showConnection = false;    
				for (const epRecord of [txRecord, rxRecord]) {
					const pNDC = this.getNDC(epRecord.latlong);
					const pCanv = this.getCanv(pNDC);
					this.drawnCalls.set(epRecord.call, {'canv':pCanv, 'ndc':pNDC});
					if (updateCanvas) {
						epCanv.push(pCanv)
						this.ctx.beginPath();
						this.ctx.arc(pCanv.x, pCanv.y, 6, 0, 6.282);
						this.ctx.fillStyle = (epRecord.tx && epRecord.rx)? colours.txrx: (epRecord.tx? colours.tx: colours.rx);
						this.ctx.fill();
						if (epRecord.call == this.highlightCall){
							showConnection = true;
							this.ctx.strokeStyle = (connection.reciprocal)? colours.txrx: ((epRecord.call == connection.s)? colours.tx: colours.rx);
						}
						if (this.showReciprocalConnections && this._hasReciprocal(connections, connection)){
							showConnection = true;
							this.ctx.strokeStyle = colours.txrx;
						}						
						if (this.showAllConnections){
							showConnection = true;
							let origin = connection.s.isInHome? connection.s:connection.r;
							this.ctx.strokeStyle = connectionColours[[...homeCalls].indexOf(origin) % connectionColours.length];
						}					
					}
				}

				if (showConnection) {
					const epts = {'s':epCanv[0], 'r':epCanv[1]};
					this.ctx.lineWidth=4;
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
		}
	}
	
	_unitCircle(n){
		let xy = [];
		const s = 2*Math.PI/n;
		for (let i = 0; i<n; i++){
			xy.push([Math.cos(s*i), Math.sin(s*i)]);
		}
		return xy;
	}
	
	_drawSea(){
		this.ctx.fillStyle = mapcolours.sea;
		this.ctx.beginPath();
		if (this.projection == 'EqRect'){	
			[[-1,-1],[-1,1],[1,1],[1,-1]].forEach(([x, y]) => {
				const pCanv = this.getCanv({'x':x,'y':y});
				this.ctx.lineTo(pCanv.x, pCanv.y);
			});	
		}
		if (this.projection == 'AzEq'){	
			if (!this.unitCircle) this.unitCircle = this._unitCircle(64);
			this.unitCircle.forEach(([x, y]) => {
				const pCanv = this.getCanv({'x':x,'y':y});
				this.ctx.lineTo(pCanv.x, pCanv.y);
			});
		}					
		this.ctx.fill();	
	}

	_drawLand(landPolys){
		this.ctx.fillStyle = mapcolours.land;
		this.ctx.lineWidth = 2;
		landPolys?.features.forEach(feature => {
			const geom = feature.geometry;
			if (geom.type === 'Polygon') {
				geom.coordinates.forEach(poly => {
					this.ctx.beginPath();
					poly.forEach(([lon, lat]) => {
						const pNDC = this.getNDC({'lat':lat, 'lon':lon});
						const pCanv = this.getCanv(pNDC);
						this.ctx.lineTo(pCanv.x, pCanv.y);
					});				
					this.ctx.fill();
				});
			}
		});
	}



}

