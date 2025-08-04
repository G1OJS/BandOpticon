
import * as STORAGE from '/src/app/store-cfg.js';
import * as CONNSDATA from '/src/live-data/conns-data.js';
import * as MQTT from '/src/live-data/mqtt.js';
import * as UI from './ui-core.js';

STORAGE.loadConfig();
MQTT.connectToFeed();
UI.loadView('overview');  // default view


setInterval(CONNSDATA.purgeConnections, 30000);
