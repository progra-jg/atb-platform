import json, asyncio, threading
import paho.mqtt.client as mqtt
from handlers.weight_handler import WeightHandler
from handlers.drone_handler import DroneHandler

class MQTTListener:
    WEIGHT_TOPIC = "balance/+/weight"
    STATUS_TOPIC = "balance/+/status"
    DRONE_TELEMETRY = "drone/+/telemetry"
    DRONE_IMAGE = "drone/+/image"

    def __init__(self):
        self.client = mqtt.Client(client_id="atb-listener")
        self.weight_handler = WeightHandler()
        self.drone_handler = DroneHandler()
        self.loop = asyncio.new_event_loop()

    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected to MQTT broker with result code {rc}")
        client.subscribe(self.WEIGHT_TOPIC)
        client.subscribe(self.STATUS_TOPIC)
        client.subscribe(self.DRONE_TELEMETRY)
        client.subscribe(self.DRONE_IMAGE)

    def on_message(self, client, userdata, msg):
        topic = msg.topic
        payload = json.loads(msg.payload.decode())

        if "balance" in topic and "weight" in topic:
            asyncio.run_coroutine_threadsafe(self.weight_handler.handle_weight(payload), self.loop)
        elif "balance" in topic and "status" in topic:
            asyncio.run_coroutine_threadsafe(self.weight_handler.handle_status(payload), self.loop)
        elif "drone" in topic and "telemetry" in topic:
            self.drone_handler.handle_telemetry(payload)
        elif "drone" in topic and "image" in topic:
            self.drone_handler.handle_image(payload)

    def start(self, host: str = "localhost", port: int = 1883):
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(host, port, 60)
        thread = threading.Thread(target=self.loop.run_forever, daemon=True)
        thread.start()
        self.client.loop_forever()
