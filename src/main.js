
import {loadConfig} from './config.js';
import {connectToFeed} from './mqtt.js';

setInterval(() => {
	let vh	=  window.innerHeight || document.documentElement.clientHeight;
	let app =  parseInt(document.getElementById('app').offsetHeight);
	let rib =  parseInt(document.getElementById('ribbon').offsetHeight);
	let tray=  parseInt(document.getElementById('mainViewTray').offsetHeight);
	let foot=  parseInt(document.getElementById('footer').offsetHeight);
	let tgCont =  parseInt(document.getElementById('tilesGridScrollContainer').offsetHeight);
	let misc=  100;
	let maxh = vh-rib-tray-foot-misc;

	document.getElementById('sideBar').style.maxHeight = maxh+"px";	
	document.getElementById('tilesGridScrollContainer').style.maxHeight = maxh+"px";
	
	let sbh = parseInt(document.getElementById('sideBarHeader').offsetHeight);
	document.getElementById('homeCallsList').style.maxHeight = (maxh-sbh)+"px";
}, 1100);

document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  connectToFeed();
});
