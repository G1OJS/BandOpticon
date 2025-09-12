import {squareIsInHome} from './geo.js';
import {squaresArr, myCall} from './config.js';
import {addSpot} from './plots.js'
import mqtt from 'https://unpkg.com/mqtt/dist/mqtt.esm.js';

var mqttClient = null;

export function connectToFeed() {
    //pskr/filter/v2/{band}/{mode}/{sendercall}/{receivercall}/{senderlocator}/{receiverlocator}/{sendercountry}/{receivercountry}
    mqttClient = mqtt.connect("wss://mqtt.pskreporter.info:1886");
    mqttClient.onSuccess = subscribe();
    mqttClient.on("message", (filter, message) => {
        onMessage(message.toString());
    });
}

function subscribe() {
    //pskr/filter/v2/{band}/{mode}/{sendercall}/{receivercall}/
    //{senderlocator}/{receiverlocator}/{sendercountry}/{receivercountry}

    // find the level 4 squares we need to subscribe to in order to get messages for our squares in squaresArr
    let subs = new Set;
    for (let i = 0; i < squaresArr.length; i++) {
        subs.add(squaresArr[i].substring(0, 4));
    }
    let subsArr = Array.from(subs);

    // now subscribe to the level 4 squares
    subsArr.forEach((sq) => {
        var topic = 'pskr/filter/v2/+/+/+/+/' + sq + '/+/+/#';
        console.log("Subscribe to " + topic);
        mqttClient.subscribe(topic, (error) => {
            if (error) {
                console.error('subscription failed to ' + topic, error)
            }
        });
        var topic = 'pskr/filter/v2/+/+/+/+/+/' + sq + '/+/#';
        console.log("Subscribe to " + topic);
        mqttClient.subscribe(topic, (error) => {
            if (error) {
                console.error('subscription failed to ' + topic, error)
            }
        });
    });
}

// process MQTT messages - add to "connectivity_Band_Mode_HomeCall" data structure
function onMessage(msg) {
    // message format:
    // sq:sequence number b:band f:frequency md:mode rp:report (snr) t:seconds since 1970-01-01
    // sc/rc:sender call/receiver call sl/rl:sender locator/receiver locator sa/ra:sender ADIF/receiver ADIF
    // first, build spot object for this msg using same keys as PSKR MQTT:
    const spot = {};
    msg.slice(1, -1).replaceAll('"', '').split(',')
    .forEach(function (v) {
        let kvp = v.split(":");
        spot[kvp[0]] = kvp[1];
    });

	let sh = squareIsInHome(spot.sl);
	let rh = squareIsInHome(spot.rl);
	if(sh || rh) addSpot(spot, sh, rh);
}

