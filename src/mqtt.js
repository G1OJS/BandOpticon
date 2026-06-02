import {parseSquares, squareIsInHome} from './geoFuncs.js';
import {addSpot} from './dataMgr.js'

import mqtt from 'https://unpkg.com/mqtt/dist/mqtt.esm.js';
let L4squares = null;
var mqttClient = null;
export var mqttStatus = 'Connecting';

export function connectToFeed(squaresList, bands) {
    //pskr/filter/v2/{band}/{mode}/{sendercall}/{receivercall}/{senderlocator}/{receiverlocator}/{sendercountry}/{receivercountry}
	if (squaresList){
		mqttClient = mqtt.connect("wss://mqtt.pskreporter.info:1886");
		mqttClient.onSuccess = subscribe(squaresList, bands);
		mqttClient.on("message", (filter, message) => {
			onMessage(message.toString());
		});
	} else {
		mqttStatus = 'Please enter home square(s)'
	}
}

function validate_band(band){
	let valid = true;
	valid = valid && band.endsWith('m');
	return (valid);
}

function subscribe(squaresList, bands) {
    let topics = new Set;
	L4squares = parseSquares(squaresList);
	for (const b of bands) {
		if (validate_band(b) || b=='+') {
			for (const L4square of L4squares) {
				topics.add('pskr/filter/v2/'+b+'/+/+/+/' + L4square + '/+/+/#');
				topics.add('pskr/filter/v2/'+b+'/+/+/+/+/' + L4square + '/+/#');
			}
		}
	}
	for (const t of topics){
		console.log("Subscribe to " + t);
		mqttClient.subscribe(t, (error) => {
			if (error) {
				mqttStatus = 'MQTT subscription error';
				console.error('subscription failed to ' + t, error)
			} else {
				mqttStatus = 'Subscribed, waiting for data';
			}
		});
	}
}

function onMessage(msg) {
    const spot = {};
    msg.slice(1, -1).replaceAll('"', '').split(',')
    .forEach(function (v) {
        let kvp = v.split(":");
        spot[kvp[0]] = kvp[1];
    });
	let sh = squareIsInHome(spot.sl, L4squares);
	let rh = squareIsInHome(spot.rl, L4squares);
	if(sh || rh) addSpot(spot, sh, rh);
	mqttStatus = 'Receiving';
}
