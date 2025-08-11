
import * as STORAGE from './lib/store-cfg.js';
import * as CONNSDATA from './lib/conns-data.js';
import * as MQTT from './lib/mqtt.js';
import * as UI from './ui-core.js';

STORAGE.loadConfig();
MQTT.connectToFeed();
UI.loadView('bandsOverview');  // default view


setInterval(CONNSDATA.purgeLiveConnections, 30000);
