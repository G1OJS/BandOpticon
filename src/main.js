localStorage.setItem('colours', JSON.stringify(
	{tx:'rgb(200, 30, 30)', 	rx:'rgb(30, 200, 30)',	txrx:'rgb(51, 153, 255)', 
	 land:'rgba(180,200,180,0.5)', sea:'rgba(180,210,250,0.3)'}
));

import {loadApp} from './pageMgr.js';

document.addEventListener('DOMContentLoaded', () => {
	loadApp();
});
