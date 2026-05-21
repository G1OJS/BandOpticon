
import {loadConfig} from './config.js';
import {connectToFeed} from './mqtt.js';

let bands = '+';

let url = new URL(window.location.href);
let params = new URLSearchParams(url.search);
if (params){
	let b = params.get("b");
	if (b){
		{bands = b.split(',');}
	}
}
setInterval(() => {
	let vh	=  window.innerHeight || document.documentElement.clientHeight;
	let app =  parseInt(document.getElementById('app').offsetHeight);
	let rib =  parseInt(document.getElementById('ribbon').offsetHeight);
	let tray=  parseInt(document.getElementById('mainViewTray').offsetHeight);
	let foot=  parseInt(document.getElementById('footer').offsetHeight);
	let tgCont =  parseInt(document.getElementById('tilesGridScrollContainer').offsetHeight);
	let misc=  100;
	let maxh = vh-rib-tray-foot-misc;

	document.getElementById('tilesGridScrollContainer').style.maxHeight = maxh+"px";
	
}, 1100);

document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  connectToFeed(bands);
});
