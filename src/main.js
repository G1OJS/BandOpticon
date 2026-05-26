localStorage.setItem('colours', JSON.stringify({tx:'rgba(200, 30, 30, 0.5)', 	rx:'rgba(30, 200, 30, 0.5)',	txrx:'rgba(51, 153, 255, 0.5)', conn:'rgba(20, 20, 20, 1)'}));
localStorage.setItem('mapcolours', JSON.stringify({land:'rgba(180,200,180,0.5)', sea:'rgba(240,240,250,0.5)'}));

import {connectToFeed} from './mqtt.js';
import {initialisePage} from './pageMgr.js';
import {mqttStatus} from './mqtt.js';

async function showMQTTInitialisation(){
	while (mqttStatus != 'receiving') {
		document.getElementById('mqttStatus').innerText = mqttStatus;
		await new Promise(r => setTimeout(r, 250));
	}
	document.getElementById('mqttStatus').innerText ='';	
}

let bands = '+';

let url = new URL(window.location.href);
let params = new URLSearchParams(url.search);
if (params){
	let b = params.get("b");
	if (b){
		{bands = b.split(',');}
	}
}

document.addEventListener('DOMContentLoaded', () => {
  initialisePage();
  connectToFeed(bands); 
  showMQTTInitialisation();
});
