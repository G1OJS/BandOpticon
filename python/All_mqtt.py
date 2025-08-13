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
        
def all_to_MQTT(fpath,  last_sent, home_square):
    global client
    with open(fpath) as f:
        lines = f.readlines()
    for l in lines:
        if(len(l)>100):
            continue
        dt = parse_line_datetime(l).timestamp()
        if(last_sent == None):
            continue
        if(dt < last_sent):
            continue
        decode = parse_line(l)
        if decode:
            client.publish("topic/all", "Hello world!");

    return dt


def loop():
    global last_sent_main, last_sent_sec
    import time;
    while(True):
        last_sent_main = all_to_MQTT(all_main, last_sent_main, home_square)
        last_sent_sec = all_to_MQTT(all_secondary, last_sent_sec, secondary_square)
        time.sleep(1)


config = get_config()
all_main = get_config_option(config, "input", "all_main", "")
all_secondary = get_config_option(config, "input", "all_secondary", "")
home_square = get_config_option(config, "analysis", "home_square", "")
secondary_square = get_config_option(config, "analysis", "secondary_square", home_square)

last_sent_main = None
last_sent_sec = None

import paho.mqtt.client as mqtt
client = mqtt.Client()
client.connect("localhost",1886,60)



loop();



