import {myCall, setMyCall, setSquaresList} from './config.js';
import {dataVignettes} from './dataMgr.js';

const mainView = document.querySelector('#mainView');
const tileTrayGrid = document.querySelector('#tileTrayGrid')
let vignetteViews = new Map();

document.getElementById('legendMarkerTx').style.background = colours.tx;
document.getElementById('legendMarkerRx').style.background = colours.rx;
document.getElementById('legendMarkerTxRx').style.background = colours.txrx;

document.getElementById('homeSquaresInput').addEventListener('change', () => {
	setSquaresList(); 
});

document.getElementById('myCallInput').addEventListener('change', () => {
	let myCallNew = document.getElementById('myCallInput').value.toUpperCase();
	document.getElementById('myCallInput').value = myCallNew;
	setMyCall(myCallNew); 
});

function modeFilter(md){
	let vis = false;
	vis |= (md == 'FT8' && document.getElementById('FT8').checked);
	vis |= (md == 'FT4' && document.getElementById('FT4').checked);
	vis |= (md == 'FT2' && document.getElementById('FT2').checked);
	vis |= (md == 'WSPR' && document.getElementById('WSPR').checked);
	vis |= ('FT8FT4FT2WSPR'.search(md) <0 && document.getElementById('Other').checked);
	return vis;
}

export function manageViews() {
	
	for (const dataVignette of dataVignettes){
		if(modeFilter(dataVignette.mode)) {
			if !tileTrayGrid.querySelector('#'+dataVignette.bandMode){
				console.log("Create tile "+dataVignette.bandMode);
				const tileElement = document.querySelector('#tileTemplate').content.cloneNode(true).querySelector('div');
				tileTrayGrid.append(tileElement);				
				tileElement.querySelector('.tileTitle').textContent = dataVignette.bandMode;  
				tileElement.id = dataVignette.bandMode;
			}
			const tileElement = tileTrayGrid.querySelector('#'+dataVignette.bandMode);
			const canvasElement = tileElement.querySelector('canvas');				
			let buttons = tileElement.querySelectorAll('.windowBarButton');
			for (const b of buttons){b.classList.add('hidden');}
			tileElement.classList.remove('hidden');
			renderView(dataVignette, canvasElement, 'tile')
		} else {
			tileElement.classList.add('hidden');
		}	
	}
	
	let mainElement = mainView.querySelector('.tile');
	if (mainElement) {
		let buttons = mainElement.querySelectorAll('.windowBarButton');
		for (const b of buttons){b.classList.remove('hidden');}
	}
	
	if (tiles.length && !mainElement) {
		document.getElementById('clickTileMessage').classList.remove('hidden');
	} 

}

function renderView(dataVignette, canvasElement, viewType){
	let vignetteView = vignetteViews.get(dataVignette.bandMode);
	// if none exist, make one
	
	
			if (document.getElementById('zoomTilesToActivity').checked){
				zoom('zoomToData', null);
			} else {
				zoom('zoomFullEarth', null);
			}	
	
}
