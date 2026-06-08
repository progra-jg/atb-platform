/*
 * ATB AgriTrace — Scale Firmware
 * Arduino-based connected scale for weighing harvests.
 * Reads load cell via HX711, displays on LCD, sends via MQTT.
 */

#include <HX711.h>
#include <LiquidCrystal_I2C.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Pins
const int LOADCELL_DOUT_PIN = D2;
const int LOADCELL_SCK_PIN = D3;

// WiFi
const char* WIFI_SSID = "ATB-IoT-Network";
const char* WIFI_PASS = "atb-iot-2024";

// MQTT
const char* MQTT_HOST = "iot-bridge";
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC_WEIGHT = "balance/scale_01/weight";
const char* MQTT_TOPIC_STATUS = "balance/scale_01/status";
const char* DEVICE_ID = "scale_01";

HX711 scale;
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

float calibration_factor = -7050.0;
unsigned long last_weight_send = 0;
const unsigned long SEND_INTERVAL = 5000; // Send every 5 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("ATB Scale Firmware v1.0");

  // Init LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("ATB AgriTrace");

  // Init scale
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibration_factor);
  scale.tare();

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  lcd.setCursor(0, 1);
  lcd.print("WiFi Connected   ");

  // Connect MQTT
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  connectMQTT();
}

void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  float weight = scale.get_units(5);
  if (weight < 0) weight = 0;

  // Display
  lcd.setCursor(0, 1);
  lcd.print("                ");
  lcd.setCursor(0, 1);
  lcd.print(weight, 1);
  lcd.print(" kg");

  // Send via MQTT
  if (millis() - last_weight_send > SEND_INTERVAL) {
    StaticJsonDocument<128> doc;
    doc["device_id"] = DEVICE_ID;
    doc["weight"] = weight;
    doc["unit"] = "kg";
    doc["timestamp"] = millis();

    char buffer[128];
    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_TOPIC_WEIGHT, buffer);
    last_weight_send = millis();

    Serial.print("Weight: ");
    Serial.print(weight, 1);
    Serial.println(" kg");
  }

  delay(200);
}

void connectMQTT() {
  while (!mqttClient.connected()) {
    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println("MQTT connected");

      // Publish status
      StaticJsonDocument<64> doc;
      doc["device_id"] = DEVICE_ID;
      doc["status"] = "online";
      char buffer[64];
      serializeJson(doc, buffer);
      mqttClient.publish(MQTT_TOPIC_STATUS, buffer);
    } else {
      delay(5000);
    }
  }
}
