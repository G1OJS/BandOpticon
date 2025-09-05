var mqttClient = null;
var mqttClient2 = null;

import {squaresArr} from './store-cfg.js';
import {liveConnsData, addSpotToConnectivityMap} from './conns-data.js';
import mqtt from 'https://unpkg.com/mqtt/dist/mqtt.esm.js';

export function connectToFeed() {
    //pskr/filter/v2/{band}/{mode}/{sendercall}/{receivercall}/{senderlocator}/{receiverlocator}/{sendercountry}/{receivercountry}
    mqttClient = mqtt.connect("wss://mqtt.pskreporter.info:1886");
    mqttClient.onSuccess = subscribe();
    mqttClient.on("message", (filter, message) => {
        onMessage(message.toString());
    });

  //  mqttClient2 = mqtt.connect("localhost:1886");
 //   mqttClient2.onSuccess = subscribe_local();
 //   mqttClient2.on("message", (filter, message) => {
//		console.log("local ",message.toString())
      //  onMessage(message.toString());
  //  });

}

function subscribe_local(){
	var topic = 'topic/all';
	console.log("Subscribe to " + topic);
	mqttClient2.subscribe(topic, (error) => {
		if (error) {
			console.error('subscription failed to ' + topic, error)
		}
	});
}

// subscribe to needed squares
export function subscribe() {
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

	addSpotToConnectivityMap(liveConnsData, spot);
}


export function connectToTest(){

	
	addSpotToConnectivityMap(liveConnsData, {'sc':'G1OJS','rc':'PA0RL','sl':'IO90','rl':'JO03','rp':-17,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'sc':'G1OJS','rc':'SA0PU','sl':'IO90','rl':'JO03','rp':-12,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'sc':'G1OJS','rc':'F3GGG','sl':'IO90','rl':'JO03','rp':-2,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'sc':'G1OJS','rc':'2E0IRL','sl':'IO90','rl':'JO03','rp':-20,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'sc':'G1OJS','rc':'K0EEE','sl':'IO90','rl':'JO03','rp':-17,'b':'20m','md':'FT8','t':1e30});
	
	addSpotToConnectivityMap(liveConnsData, {'rc':'G1OJS','sc':'PA0RL','sl':'IO90','rl':'JO03','rp':-7,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'rc':'G1OJS','sc':'SA0PU','sl':'IO90','rl':'JO03','rp':-2,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'rc':'G1OJS','sc':'F3GGG','sl':'IO90','rl':'JO03','rp':-12,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'rc':'G1OJS','sc':'2E0IRL','sl':'IO90','rl':'JO03','rp':-22,'b':'20m','md':'FT8','t':1e30});
	addSpotToConnectivityMap(liveConnsData, {'rc':'G1OJS','sc':'K0EEE','sl':'IO90','rl':'JO03','rp':-13,'b':'20m','md':'FT8','t':1e30});	
	
}