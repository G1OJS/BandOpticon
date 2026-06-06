import {mhToLatLong, latlonToKmDeg} from './geoFuncs.js';
import {getViewParams} from './pageMgr.js';

const colours = JSON.parse(localStorage.getItem('colours'));
const colourSequence = ['black','red','green','blue','purple','yellow','orange','cyan','grey'];

let landPolys110m = null;
let landPolys50m = null;
export var views = new Map();

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson').then(resp => resp.json()).then(data => {
	console.log("GeoJSON loaded:", data);
	landPolys110m = data;
});

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson').then(resp => resp.json()).then(data => {
	console.log("GeoJSON loaded:", data);
	landPolys50m = data;
});

export function getView(viewName, canvas, dataVignette, canvasWidth, mapres, drawUnhighlightedConnections){
	let view = views.get(viewName);
	if (!view) {
		view = new GeoView(dataVignette, canvas, canvasWidth, mapres, drawUnhighlightedConnections);	
		views.set(viewName, view);
	}
	view.viewParams = getViewParams();
	return view;
}

export function clearAllViews() {views = new Map()};

class GeoView{
	constructor(dataVignette, canvasElement, canvasWidth, mapres, drawUnhighlightedConnections) {
		this.dataVignette = dataVignette;
		this.canvasElement = canvasElement;
		this.canvasElement.width = canvasWidth;
		this.mapres = mapres;
		this.drawUnhighlightedConnections = drawUnhighlightedConnections;
		this.currentHover = null;
		this.viewNDC = {'x0':-1, 'w':2, 'y0':-1, 'h':2};
		this.dirty = false;
		this.redrawPending = false;
		this.unitCircle = null;
		this.earthHalfCircumference = latlonToKmDeg({'lat':0,'lon':0}, {'lat':0,'lon':180}).km;
		this.pointsToDraw = new Map();
		this.connectionsToDraw = new Set();
	}

	invalidate(){
		//console.log("Redraw request for " + this.canvasElement.closest('.tile').dataset.bm);
        this.dirty=true;
        if(this.redrawPending) return;
		this.viewParams = getViewParams();
		//console.log(this.viewParams.setZoomToDataCarousel, this.viewParams.setZoomToDataMain, this.viewParams.showAllConnections,this.viewParams.highlightDuplexConnections,this.viewParams.highlightMyCall);
		const canvasHeightNeeded = this.viewParams.AzEq? this.canvasElement.width: this.canvasElement.width/2;
		if (this.canvasElement.height != canvasHeightNeeded) this.canvasElement.height = canvasHeightNeeded;
		this.ctx = this.canvasElement.getContext('2d');
		this._setItemsToDraw();
        this.redrawPending=true;
        requestAnimationFrame(()=>{
            this.redrawPending=false;
            if(this.dirty){
                this.dirty=false;
				this.ctx.clearRect(0,0, this.canvasElement.width, this.canvasElement.height);
				this._drawMap((this.mapres == 110)? landPolys110m:landPolys50m);
				this._drawData();
            }
        });
    }
		
	onMouseMove(e){
		let hovering_over = null;
		const ptrCanv = this.getCanv(this.getPtrNDC(e));
			
		for (const [call, pt] of this.pointsToDraw.entries()) { 
			if (pt.pCanv){
				if(Math.abs(ptrCanv.x - pt.pCanv.x) < 5 && Math.abs(ptrCanv.y - pt.pCanv.y) < 5) {
					this.canvasElement.style = 'cursor:default;';
					hovering_over = call;
				}
			}
			if (hovering_over) break;
		}
		if (hovering_over !== this.currentHover) {
			this.currentHover = hovering_over;
			this.canvasElement.title = this.currentHover? this.currentHover:'';
			this.invalidate();
		}
	}
	
	onClick(e){
		if (e.target.id == 'zoomFullEarthBtn') this.setZoomFullEarth();
		if (e.target.id == 'setZoomToDataBtn') this.setZoomToData();
		if (e.target.id == 'zoomOutBtn') this.setZoom(1/1.2, null);
		if (e.target.id == 'mainCanvas') this.setZoom(1.2, this.getPtrNDC(e));
	}
	
	getNDC(latlon){
		if (this.viewParams.AzEq) {
			const KmDeg = latlonToKmDeg(this.viewParams.latlonCentre, latlon);
			const scl = this.earthHalfCircumference;
			return {'x':KmDeg.km * Math.sin(KmDeg.deg * Math.PI/180) / scl, 'y':KmDeg.km * Math.cos(KmDeg.deg * Math.PI/180) / scl};
		} else {			
			return {'x':latlon.lon/180, 'y':latlon.lat/90};
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
		if (this.pointsToDraw.size < 1) this._setItemsToDraw();
		if (this.currentHover) {
			return;
		}
		let usedNDC = {'x0':1, 'x1':-1, 'y0':1, 'y1':-1}; 
		let pointsExist = false;
		let highlightExists = false;
		for (const ptd of this.pointsToDraw.values()) { 
			if (ptd.highlight) {
				highlightExists = true;
				break;
			}
		}
		for (const ptd of this.pointsToDraw.values()) { 
			if (ptd.highlight || !highlightExists){
				usedNDC.x0 = Math.min(usedNDC.x0, ptd.pNDC.x);
				usedNDC.y0 = Math.min(usedNDC.y0, ptd.pNDC.y);
				usedNDC.x1 = Math.max(usedNDC.x1, ptd.pNDC.x);
				usedNDC.y1 = Math.max(usedNDC.y1, ptd.pNDC.y);
				pointsExist = true;
			}
		}
		if (pointsExist) {
			const usedNDCCentre = {'x': (usedNDC.x0 + usedNDC.x1)/2, 'y':(usedNDC.y0 + usedNDC.y1)/2};
			this.viewNDC = {'x0':usedNDC.x0, 'y0':usedNDC.y0, 'w':usedNDC.x1 - usedNDC.x0, 'h':usedNDC.y1 - usedNDC.y0};
			this.viewNDC.w = Math.max(this.viewNDC.w, this.viewNDC.h, 0.01);
			this.viewNDC.h = Math.max(this.viewNDC.h, this.viewNDC.w, 0.01);
			this.setZoom(0.8, usedNDCCentre);
		} 
	}
	
	setZoomFullEarth(){
		this.viewNDC = {'x0':-1, 'w':2, 'y0':-1, 'h':2};
	}
	
	setZoomByPointerPos(e, zoomFactor){
		let xy = this.getPtrNDC(e);
		this.setZoom(zoomFactor, xy);
	}
	
	_setItemsToDraw(){
		const srRecords = this.dataVignette.srRecords;	
		let connections = new Set();
		for (const conn of this.dataVignette.connections){
			const [s, r] = conn.split('|');
			connections.add({'s':s,'r':r});
		}
		for (const conn of this.dataVignette.duplexConnections){
			const [s, r] = conn.split('|');
			connections.add({'s':s,'r':r,'duplex':true});
		}
		this.pointsToDraw = new Map();
		this.connectionsToDraw = new Set();
		let highlightConnection = false;
		const vp = this.viewParams;
		for (const connection of connections){
			const [txRecord, rxRecord] = [srRecords.get(connection.s), srRecords.get(connection.r)];
			const connectionInvolvesMyCall = (txRecord.call == vp.myCall || rxRecord.call == vp.myCall);
			if(	  (txRecord.isInHome && document.getElementById('homeTx').checked)
				||(rxRecord.isInHome && document.getElementById('homeRx').checked) ) {	
				let lineParams = {};
				for (const epRecord of [txRecord, rxRecord]) {
					let pNDC = this.getNDC(epRecord.latlong);
					let pColour = (epRecord.tx && epRecord.rx)? vp.txrx: (epRecord.tx? vp.tx: vp.rx);
					if (this.currentHover) {
						highlightConnection = (txRecord.call == this.currentHover || rxRecord.call == this.currentHover);
					} else {
						const highlightBecauseDuplex = vp.highlightDuplexConnections && (connection.duplex === true);
						const highlightBecaseMyCall = vp.highlightMyCall && connectionInvolvesMyCall
						highlightConnection = highlightBecauseDuplex || highlightBecaseMyCall;
					}
					const highlightEndpoint = highlightConnection || (this.pointsToDraw.get(epRecord.call)?.highlight === true);
					this.pointsToDraw.set(epRecord.call, {'pNDC':pNDC, 'highlight':highlightEndpoint, 'pColour':pColour,
						alpha: highlightEndpoint? this.viewParams.spotAlphaHL : this.viewParams.spotAlpha, 
						size: highlightEndpoint? this.viewParams.spotSizeHL : this.viewParams.spotSize
					});
				}
				lineParams.colour = (connection.duplex)? vp.txrx: ((txRecord.isInHome)? vp.tx: vp.rx);
				lineParams.sCall = txRecord.call;
				lineParams.rCall = rxRecord.call;
				lineParams.highlight = highlightConnection;
				lineParams.width = highlightConnection? this.viewParams.lineWidthHL:this.viewParams.lineWidth;
				this.connectionsToDraw.add(lineParams);
			}
		}
	}

	_drawData(){
		for (const pt of this.pointsToDraw.values()){
			pt.pCanv = this.getCanv(pt.pNDC);
			this.ctx.globalAlpha = pt.alpha;
			this.ctx.beginPath();
			this.ctx.arc(pt.pCanv.x, pt.pCanv.y, pt.size, 0, 6.282);
			this.ctx.fillStyle = pt.pColour;
			this.ctx.fill();
			this.ctx.globalAlpha = 1.0;
		}	
		
		var lowAlphaCanvas = document.createElement('canvas');
		lowAlphaCanvas.width = this.canvasElement.width;
		lowAlphaCanvas.height = this.canvasElement.height;

		var ctxLo = lowAlphaCanvas.getContext('2d');
		this.ctx.globalAlpha = this.viewParams.lineAlphaHL;
		for (const conn of this.connectionsToDraw){
			let ctx = conn.highlight? this.ctx:ctxLo;
			ctx.strokeStyle = conn.colour;
			ctx.lineWidth = conn.width;
			ctx.beginPath();
			let sCanv = this.pointsToDraw.get(conn.sCall).pCanv;
			let rCanv = this.pointsToDraw.get(conn.rCall).pCanv;
			ctx.moveTo(sCanv.x, sCanv.y);
			ctx.lineTo(rCanv.x, rCanv.y);
			ctx.stroke();
		}
		
		this.ctx.globalAlpha = this.viewParams.lineAlpha;
		this.ctx.drawImage(lowAlphaCanvas,0,0, this.canvasElement.width, this.canvasElement.height);
		this.ctx.globalAlpha = 1.0;
	}
	
	_unitCircle(n){
		let xy = [];
		const s = 2*Math.PI/n;
		for (let i = 0; i<n; i++){
			xy.push([Math.cos(s*i), Math.sin(s*i)]);
		}
		return xy;
	}
	
	_drawMap(mapdata){
		this.ctx.globalAlpha = this.viewParams.mapAlpha;
		this.ctx.fillStyle = this.viewParams.sea;
		this.ctx.beginPath();
		if (this.viewParams.AzEq){	
			if (!this.unitCircle) this.unitCircle = this._unitCircle(64);
			this.unitCircle.forEach(([x, y]) => {
				const pCanv = this.getCanv({'x':x,'y':y});
				this.ctx.lineTo(pCanv.x, pCanv.y);
			});
		} else {
			[[-1,-1],[-1,1],[1,1],[1,-1]].forEach(([x, y]) => {
				const pCanv = this.getCanv({'x':x,'y':y});
				this.ctx.lineTo(pCanv.x, pCanv.y);
			});	
		}
		this.ctx.fill();	

		this.ctx.fillStyle = this.viewParams.land;
		mapdata.features.forEach(feature => {
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
		
		this.ctx.globalAlpha = 1.0;
	}



}

