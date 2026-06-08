import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgres://atb:atb_dev_2024@localhost:5432/atb_agritrace")
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "atb-iot")
MQTT_PASS = os.getenv("MQTT_PASS", "atb-iot-secret")
