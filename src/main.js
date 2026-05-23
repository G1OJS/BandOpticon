
import {loadConfig} from './config.js';
import {connectToFeed} from './mqtt.js';
import {manageViews} from './viewMgr.js';

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
  loadConfig();
  connectToFeed(bands);
  setInterval(() => manageViews(), 900);
});
