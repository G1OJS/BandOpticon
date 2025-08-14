import paho.mqtt.client as mqtt

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    sq = "IO90"
    topic1 = 'pskr/filter/v2/+/+/+/+/+/' + sq + '/+/#';
    topic2 = 'pskr/filter/v2/+/+/+/+/' + sq + '/+/+/#';
    client.subscribe(topic1)
    client.subscribe(topic2)

def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))

mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttc.on_connect = on_connect
mqttc.on_message = on_message

mqttc.connect("mqtt.pskreporter.info", 1883, 60)

mqttc.loop_forever()
