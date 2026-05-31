localStorage.setItem('colours', JSON.stringify({tx:'rgba(200, 30, 30, 0.1)', 	rx:'rgba(30, 200, 30, 0.1)',	txrx:'rgba(51, 153, 255, 0.1)'}));
localStorage.setItem('connectioncolours', JSON.stringify({tx:'rgba(200, 30, 30, 1)', 	rx:'rgba(30, 200, 30, 1)',	txrx:'rgba(51, 153, 255, 1)'}));
localStorage.setItem('mapcolours', JSON.stringify({land:'rgba(180,200,180,0.5)', sea:'rgba(180,210,250,0.3)'}));

import {loadApp} from './pageMgr.js';

document.addEventListener('DOMContentLoaded', () => {
	loadApp();
});
