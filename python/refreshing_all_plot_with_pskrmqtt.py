# this code is a very rough hack and needs refactoring!

from math import radians, degrees, sin, cos, atan2, sqrt
import paho.mqtt.client as mqtt
import datetime
import os
import configparser
import argparse
import sys
import matplotlib.pyplot as plt
import matplotlib as mpl
import time
import operator

def get_config():
    DEFAULT_INI_FILE = "ab_all.ini"
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--config", default = DEFAULT_INI_FILE)
    args, _ = parser.parse_known_args()
    config_filepath = args.config
    print(config_filepath, DEFAULT_INI_FILE, config_filepath != DEFAULT_INI_FILE)
    if not os.path.exists(config_filepath):
        if config_filepath != DEFAULT_INI_FILE:
            print(f"Config file not found: {config_filepath}. Is there a typo?")
            sys.exit(1)

    print(f"Reading options from {config_filepath}")
    config = configparser.ConfigParser()
    config.read(config_filepath)
    return config

def get_config_option(config, section, option, default):
    if (config.has_option(section, option)):
        return config.get(section, option)
    else:
        return default

def sq2ll(sq):
    sq = sq.upper()
    lat = 10* (ord(sq[1])-ord('A'))
    lon = 20* (ord(sq[0])-ord('A'))
    if(len(sq)>2):
        lat += int(sq[3]) + 0.5
        lon += 2*int(sq[2]) + 1
    else:
        lat += 5
        lon += 10
    return lat, lon
    
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return round(R * c)

def bearing_deg(lat1, lon1, lat2, lon2):
    y = sin(radians(lon2 - lon1)) * cos(radians(lat2))
    x = cos(radians(lat1))*sin(radians(lat2)) - sin(radians(lat1))*cos(radians(lat2))*cos(radians(lon2 - lon1))
    b = atan2(y, x)
    return round((degrees(b) + 360) % 360)

def sq_km_deg(sq, home_square):
    import re
    if(re.search("[A-R][A-R][0-9][0-9]",sq) and sq != "RR73"):
        lat1, lon1 = sq2ll(home_square)
        lat2, lon2 = sq2ll(sq)
        km = haversine_distance(lat1, lon1, lat2, lon2)
        deg = bearing_deg(lat1, lon1, lat2, lon2)
        return km, deg
    else:
        return False



def safe_json_decode(msg_bytes):
    """Decode a bytes payload to a Python dict. Returns None on empty/invalid JSON."""
    import json
    if not msg_bytes:
        return None
    try:
        return json.loads(msg_bytes.decode('utf-8').strip())
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"Warning: failed to decode JSON: {e!r}")
        return None


def on_message(client, userdata, msg):
    global time_live
    msg = safe_json_decode(msg.payload)
    if(int(msg['t']) < time.time() - time_live):
        return
    if(abs(float(msg['f'])-14074000)<10000):
        decode ={
            "dt": msg['t'],
            "f": float(msg['f']),
            "sc": msg['sc'],
            "rc": msg['rc'],
            "rp": msg['rp'],
            "sl": msg['sl'],
            "rl": msg['rl'],
            "km": None,
            "deg":None
        }
        decodes_mqtt.append(decode)
    
def parse_line_datetime(line):
    ## includes kludge to convert to BST
     return datetime.datetime(2000+int(line[0:2]),int(line[2:4]),int(line[4:6]),
                             int(line[7:9])+1, int(line[9:11]), int(line[11:13]) ).timestamp()

def parse_line(line):
    import re
    dt = parse_line_datetime(line)
    ls = line.split()
    if len(ls) == 10:
        sq = ls[9]
        if(re.search("[A-R][A-R][0-9][0-9]",sq) and sq != "RR73"):            
            return {
                "dt": dt,
                "f": float(ls[1])*1e6,
                "sc": ls[8],
                "rc": "G1OJS",
                "rp": float(ls[4]),
                "sl": ls[9],
                "rl": "IO90",
                "km": None,
                "deg":None
            }
        
def read_ALLTXT(fpath, dt_first, home_square):
   # print(f"{fpath}")
    with open(fpath) as f:
        lines = f.readlines()
    decodes_all = []

    km = {}
    deg = {}
    nrecs = 0
    for l in lines:
        if(len(l)>100):
            continue
        dt = parse_line_datetime(l)
        if(dt < dt_first):
            continue
        decode = parse_line(l)
        if decode:
            sc = decode["sc"]
            if(sc not in km):
                kmdeg = sq_km_deg(decode["sl"], home_square)
                if(kmdeg):
                    km[sc], deg[sc] = kmdeg
            decodes_all.append(decode)
            nrecs += 1
  #    print(f"Read {len(lines)} lines with {nrecs} decodes in session time window\n")

    return decodes_all

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    for i in range(5,10):
        for j in range(0,10):
            rxsq = f"IO{i}{j}"
            print(rxsq)
            topic1 = 'pskr/filter/v2/+/+/+/+/+/' + rxsq + '/+/#';
            client.subscribe(topic1)


import matplotlib.colors as mcolors

# create a dict to store colors for each callsign
tx_colors = {}

def get_color_for_tx(tx):
    if tx not in tx_colors:
        # pick a color from matplotlib's tab20 palette, cycling if needed
        all_colors = list(mcolors.TABLEAU_COLORS.values())
        tx_colors[tx] = all_colors[len(tx_colors) % len(all_colors)]
    return tx_colors[tx]


mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttc.on_connect = on_connect
mqttc.on_message = on_message

mqttc.connect("mqtt.pskreporter.info", 1883, 60)
    
config = get_config()
all_main = get_config_option(config, "input", "all_main", "")
home_square = get_config_option(config, "analysis", "home_square", "")


decodes_mqtt = []
decodes_allfile = []
fig, ax = plt.subplots()
plt.ion()

time_live = 300

while(True):
    for i in range(100):
        mqttc.loop(timeout=0.5)

    decodes_allfile = read_ALLTXT(all_main, time.time() - time_live , home_square)

    print(f"local: {len(decodes_allfile)} mqtt: {len(decodes_mqtt)}")
    decodes_allfile_currband =[]
    decodes_mqtt_currband =[]
    f_all = 14074000
    rxcalls = set()
    for i, d in enumerate(decodes_allfile):
        if(abs(float(d['f'])-f_all)<10000):
            decodes_allfile_currband.append(d)
            rxcalls.add(d['rc'])
    for i, d in enumerate(decodes_mqtt):
        if(abs(float(d['f'])-f_all)<10000):
            decodes_mqtt_currband.append(d)
            rxcalls.add(d['rc']+"-"+d['rl'])

    decodes = decodes_allfile + decodes_mqtt
    print(f"local_currband: {len(decodes_allfile_currband)} mqtt_currband: {len(decodes_mqtt_currband)}")
    print("Rx calls:")
    for c in sorted(list(rxcalls)):
        print(c)

    rx_reports = {}
    for i, d in enumerate(decodes):
        tx=d['sc']
        rx=d['rc']

        report = {'tx':tx,'rp':int(d['rp'])}
        rx_reports.setdefault(rx, []).append(report)

    sorted_rx = sorted(rx_reports.keys(), key=lambda rx: max(report['rp'] for report in rx_reports[rx]), reverse=True)

    x_vals = []
    y_vals = []
    cols = []
    for i, rx in enumerate(sorted_rx):
        for report in rx_reports[rx]:
            x_vals.append(rx)
            y_vals.append(report['rp'])
            cols.append(get_color_for_tx(report['tx']))

    plt.cla()
    ax.scatter(x_vals, y_vals, c = cols, alpha=0.7)

    ax.tick_params("x", rotation=90, labelsize=6)


    plt.pause(5)







