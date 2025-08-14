from math import radians, degrees, sin, cos, atan2, sqrt
import datetime
import os
import configparser
import argparse
import sys

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

def parse_line_datetime(line):
     return datetime.datetime(2000+int(line[0:2]),int(line[2:4]),int(line[4:6]),
                             int(line[7:9]), int(line[9:11]), int(line[11:13]) )

def parse_line(line):
    import re
    dt = parse_line_datetime(line)
    ls = line.split()
    if len(ls) == 10:
        sq = ls[9]
        if(re.search("[A-R][A-R][0-9][0-9]",sq) and sq != "RR73"):            
            return {
                "dt": dt,
                "mhz": ls[1],
                "call": ls[8],
                "SN": float(ls[4]),
                "sq": ls[9],
                "km": None,
                "deg":None
            }
        
def read_ALLTXT(fpath, dt_first, home_square):
    print(f"{fpath}")
    with open(fpath) as f:
        lines = f.readlines()

    decodes_by_call = {}
    km = {}
    deg = {}
    nrecs = 0
    for l in lines:
        if(len(l)>100):
            continue
        dt = parse_line_datetime(l).timestamp()
        if(dt < dt_first):
            continue
        decode = parse_line(l)
        if decode:
            call = decode['call']
            if(call not in decodes_by_call):
                decodes_by_call[call]=[]
            if(call not in km):
                kmdeg = sq_km_deg(decode['sq'], home_square)
                if(kmdeg):
                    km[call], deg[call] = kmdeg
            decodes_by_call[call].append(decode)
            nrecs += 1
    print(f"Read {len(lines)} lines with {nrecs} decodes in session time window\n")

    for call in decodes_by_call:
        for i, decode in enumerate(decodes_by_call[call]):
            if(call in km):
                decode['km'] = km[call]
                decode['deg'] = deg[call]
                decodes_by_call[call][i] = decode

    return decodes_by_call

def merge_ab(decodes_by_call_a, decodes_by_call_b):
    records = []

    for call in sorted(set(decodes_by_call_a) | set(decodes_by_call_b)):
        # 0 = A, 1 = B
        for sn_index, dataset in enumerate((decodes_by_call_a, decodes_by_call_b)):
            if call not in dataset:
                continue
            for rec in dataset[call]:
                sn = rec['SN']
                rec.update({'sn_a':None, 'sn_b':None})
                rec.pop('SN')
                snkey=['sn_a','sn_b'][sn_index]
                rec[snkey]=sn
                records.append(rec)

    return records

def get_records():
    import time
    ut = time.time()
    dt_first = ut - 600-3600
    decodes_by_call_a = read_ALLTXT(all_main, dt_first , home_square)
    decodes_by_call_b = read_ALLTXT(all_secondary, dt_first, home_square)
    records = merge_ab(decodes_by_call_a, decodes_by_call_b)
    return records

def refreshingPlot():
    import pandas as pd
    import matplotlib.pyplot as plt
    plt.ion()
    l1 = None;
    fig, ax1 = plt.subplots()
    ax2 = ax1.twinx()
    ax1.set_xlabel("Callsign")
    ax1.set_ylabel("SNR (dB)")
    ax2.set_ylabel("Distance (km)")

    while(True):
        records = get_records()
        
        df = pd.json_normalize(records)
        df = df.groupby("call").agg("max")
        df = df.sort_values(by = ["sn_a" , "sn_b"], ascending=[False, True])
 
        for art in list(ax1.lines):
           art.remove()
        for art in list(ax2.lines):
           art.remove()
        
        df["sn_a"].plot(ax=ax1, label="snr A", color = "red", lw = 3)
        df["sn_b"].plot(ax=ax1, label="snr B", color = "blue", alpha = 0.5, lw = 2)
        df["km"].plot(ax=ax2, label="km", color="grey", alpha = 0.5)
        #df["deg"].plot(ax=ax2, label="deg", color="grey", alpha = 0.5)
        ax1.set_xticks(range(len(df)))
        ax1.set_xticklabels(df.index, rotation=90)
        ax1.set_xticklabels(ax1.get_xticklabels(), rotation=90, ha="right",  fontsize = 5)

        lines, labels = ax1.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        graph = ax1.legend(lines + lines2, labels + labels2, loc="best")

        plt.tight_layout()
        plt.pause(5)

config = get_config()
all_main = get_config_option(config, "input", "all_main", "")
all_secondary = get_config_option(config, "input", "all_secondary", "")
home_square = get_config_option(config, "analysis", "home_square", "")

refreshingPlot()



