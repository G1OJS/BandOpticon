import {parseSquares, squareIsInHome} from './geoFuncs.js';
import {addSpot} from './dataMgr.js'

import mqtt from 'https://unpkg.com/mqtt/dist/mqtt.esm.js';
let squaresArr = null;
var mqttClient = null;
export var mqttStatus = 'connecting';

export function connectToFeed(bands) {
    //pskr/filter/v2/{band}/{mode}/{sendercall}/{receivercall}/{senderlocator}/{receiverlocator}/{sendercountry}/{receivercountry}
    mqttClient = mqtt.connect("wss://mqtt.pskreporter.info:1886");
    mqttClient.onSuccess = subscribe(bands);
    mqttClient.on("message", (filter, message) => {
        onMessage(message.toString());
    });
}

function validate_band(band){
	let valid = true;
	valid = valid && band.endsWith('m');
	return (valid);
}

function subscribe(bands) {
    // find the topics for the level 4 squares we need to subscribe to in order to get messages for our squares in squaresArr
    let topics = new Set;
	squaresArr = parseSquares(JSON.parse(localStorage.getItem('squaresList')));


	for (const b of bands) {
		if (validate_band(b) || b=='+') {
			for (let i = 0; i < squaresArr.length; i++) {
				topics.add('pskr/filter/v2/'+b+'/+/+/+/' + squaresArr[i].substring(0, 4) + '/+/+/#');
				topics.add('pskr/filter/v2/'+b+'/+/+/+/+/' + squaresArr[i].substring(0, 4) + '/+/#');
			}
		}
	}
    // now subscribe to the topics
	mqttStatus = 'subscribed - waiting for data';
	Array.from(topics).forEach((t) => {
		console.log("Subscribe to " + t);
		mqttClient.subscribe(t, (error) => {
			if (error) {
				mqttStatus = 'error';
				console.error('subscription failed to ' + t, error)
			}
		});
	});
	
}

function onMessage(msg) {
    const spot = {};
    msg.slice(1, -1).replaceAll('"', '').split(',')
    .forEach(function (v) {
        let kvp = v.split(":");
        spot[kvp[0]] = kvp[1];
    });
	let sh = squareIsInHome(spot.sl, squaresArr);
	let rh = squareIsInHome(spot.rl, squaresArr);
	if(sh || rh) addSpot(spot, sh, rh);
	mqttStatus = 'receiving';
}
