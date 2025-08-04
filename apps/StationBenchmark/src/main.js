const refresh_mSeconds = 5000;
var watchedMode = "FT8";

import * as UI from './ui.js';
import Ribbon from '../../../src/app/ribbon.js'
import * as CONNSDATA from '../../../src/live-data/conns-data.js';
import * as MQTT from '../../../src/live-data/mqtt.js';
import * as STORAGE from '../../../src/app/store-cfg.js';


const ribbon = new Ribbon({
  onModeChange: UI.writeStatsForAllBands,
  onConfigChange: UI.writeStatsForAllBands
});
UI.setRibbon(ribbon);


STORAGE.loadConfig();
setInterval(() => ribbon.updateClock(), 1000);
setInterval(() => ribbon.writeModeButtons(), refresh_mSeconds);
setInterval(UI.writeStatsForAllBands, refresh_mSeconds);
setInterval(CONNSDATA.purgeConnections, 30000);
MQTT.connectToFeed();

