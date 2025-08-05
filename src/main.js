
import * as STORAGE from './BandOpticon/src/lib/store-cfg.js';
import * as CONNSDATA from './BandOpticon/src/lib/conns-data.js';
import * as MQTT from './BandOpticon/src/lib/mqtt.js';
import * as UI from './BandOpticon/src/ui-core.js';

STORAGE.loadConfig();
MQTT.connectToFeed();
UI.loadView('overview');  // default view


setInterval(CONNSDATA.purgeConnections, 30000);
