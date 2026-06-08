import os
import paho.mqtt.client as mqtt

class MQTTBroker:
    """MQTT broker configuration for IoT device communication."""

    def __init__(self):
        self.broker_host = os.getenv("MQTT_HOST", "localhost")
        self.broker_port = int(os.getenv("MQTT_PORT", "1883"))
        self.client = mqtt.Client(client_id="atb-iot-bridge")

        # TLS configuration
        self.client.tls_set(
            ca_certs=os.getenv("MQTT_CA_CERT", "certs/ca.crt"),
            certfile=os.getenv("MQTT_CERT", "certs/server.crt"),
            keyfile=os.getenv("MQTT_KEY", "certs/server.key"),
        )

        # Authentication
        self.client.username_pw_set(
            os.getenv("MQTT_USER", "atb-iot"),
            os.getenv("MQTT_PASS", "atb-iot-secret"),
        )

    def connect(self):
        self.client.connect(self.broker_host, self.broker_port, 60)
        self.client.loop_start()

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
