
import * as STORAGE from '/src/lib/store-cfg.js';
import * as CONNSDATA from '/src/lib/conns-data.js';
import * as MQTT from '/src/lib/mqtt.js';
import * as UI from '/src/ui-core.js';

STORAGE.loadConfig();
MQTT.connectToFeed();
UI.loadView('overview');  // default view


setInterval(CONNSDATA.purgeConnections, 30000);
