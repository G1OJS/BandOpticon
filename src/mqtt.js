import {mhToLatLong, squareIsInHome} from './geo.js';
import {squaresArr} from './config.js';
import mqtt from 'https://unpkg.com/mqtt/dist/mqtt.esm.js';

export var connectionsMap = {};
export var callLocations = {};

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

	addSpot(spot);
}
// how can I best merge these two (^ and v)?
function addSpot(spot){
	updateCallLocactions(spot.sc, spot.sl);
	updateCallLocactions(spot.rc, spot.rl);
	if(squareIsInHome(spot.sl)) updateConnectionsMap(spot.b, spot.md, spot.sc, true, spot.rc, spot.t);	
	if(squareIsInHome(spot.rl)) updateConnectionsMap(spot.b, spot.md, spot.rc, false, spot.sc, spot.t);	
}

function updateCallLocactions(call, square){
	if (!callLocations[call]){
		let ll = mhToLatLong(square);
		callLocations[call] = {x:ll[1], y:ll[0]};
	}
}

function updateConnectionsMap(band, mode, homeCall, homeIsTx, otherCall, tstamp){
	let cm = connectionsMap;
	if(!cm[band]) cm[band] = {};
	if(!cm[band][mode]) cm[band][mode] = {};
	if(!cm[band][mode][homeCall]) cm[band][mode][homeCall] = {heard_by:[], heard:[]};
	
	let hcStatus = cm[band][mode][homeCall];
	if (!hcStatus.heard_by[otherCall] && homeIsTx) hcStatus.heard_by[otherCall] = tstamp;
	if (!hcStatus.heard[otherCall] && !homeIsTx) hcStatus.heard[otherCall] = tstamp;
}

export function connectToTest(){
	for (const b of ["20m","40m", "10m", "15m"]) {
		addSpot( {'sc':'G1OJS','rc':'PA0RL','sl':'IO90','rl':'JO03bu','rp':-17,'b':b,'md':'FT8','t':1e30});
		addSpot( {'sc':'G1OJS','rc':'SA0PU','sl':'IO90','rl':'JO03ka','rp':-12,'b':b,'md':'FT8','t':1e30});
		addSpot( {'sc':'G1OJS','rc':'F3GGG','sl':'IO90','rl':'JO03rr','rp':-2,'b':b,'md':'FT8','t':1e30});
		addSpot( {'sc':'G1OJS','rc':'2E0IRL','sl':'IO90','rl':'JO02gg','rp':-20,'b':b,'md':'FT8','t':1e30});
		addSpot( {'sc':'G1OJS','rc':'K0EEE','sl':'IO90','rl':'nn02aa','rp':-17,'b':b,'md':'FT8','t':1e30});
		
		addSpot( {'rc':'G1OJS','sc':'PA0RL','sl':'JO03bu','rl':'IO90','rp':-7,'b':b,'md':'FT8','t':1e30});
		addSpot( {'rc':'G1OJS','sc':'SA0PU','sl':'JO03ka','rl':'IO90','rp':-2,'b':b,'md':'FT8','t':1e30});
		addSpot( {'rc':'G1OJS','sc':'F3GGG','sl':'JO03rr','rl':'IO90','rp':-12,'b':b,'md':'FT8','t':1e30});
		addSpot( {'rc':'G1OJS','sc':'2E0IRL','sl':'JO02gg','rl':'IO90','rp':-22,'b':b,'md':'FT8','t':1e30});
		addSpot( {'rc':'G1OJS','sc':'K0EEE','sl':'nn02aa','rl':'IO90','rp':-13,'b':b,'md':'FT8','t':1e30});	
	}
}