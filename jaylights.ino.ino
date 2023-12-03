#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <Adafruit_NeoPixel.h>
#include <TimeLib.h>
const char *ssid = "Garaffa";
const char *password = "1fourkids";

const int LED_PIN = D7;
const int LED_COUNT = 71;  // Adjust the number of LEDs in your strip

Adafruit_NeoPixel pixels(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

unsigned long previousMillisGet = 0;
unsigned long previousMillisLED = 0;
bool alternateColorFlag = false;
String mostRecentPayload;  // Store the most recent payload globally

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }

  pixels.begin();
  pixels.show();           // Initialize all pixels to 'off'
  pixels.setBrightness(50); // Set brightness

  // Wait for 1 minute upon initial load
  delay(30000);

  // Perform the first GET request
  performHTTPGET();
}

void loop() {
  // Get the current time
  time_t currentTime = now();
  tmElements_t currentTimeElements;
  breakTime(currentTime, currentTimeElements);

  // Check if the current date is between December 15th and April 15th
  if ((currentTimeElements.Month == 12 && currentTimeElements.Day >= 15) ||
      (currentTimeElements.Month > 12 && currentTimeElements.Month < 4) ||
      (currentTimeElements.Month == 4 && currentTimeElements.Day <= 15)) {
    // Check if the current time is between 8 am and 4 pm Eastern Standard Time
    if (currentTimeElements.Hour >= 8 && currentTimeElements.Hour < 16) {
      // Update LEDs every 100 milliseconds
      if (millis() - previousMillisLED >= 100) {
        previousMillisLED = millis();
        updateLEDs();
      }

      // Perform GET request every 5 minutes after the initial GET
      if (WiFi.status() == WL_CONNECTED) {
        if (millis() - previousMillisGet >= 300000) {  // 5 minutes
          previousMillisGet = millis();
          performHTTPGET();
        }
      }
    }
  }
}


void performHTTPGET() {
  std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  client->setInsecure();

  HTTPClient https;

  Serial.print("[HTTPS] begin...\n");
  if (https.begin(*client, "https://jaypeaktrailmapled.firebaseapp.com/jay-ino/")) {
    Serial.print("[HTTPS] GET...\n");
    int httpCode = https.GET();
    if (httpCode > 0) {
      Serial.printf("[HTTPS] GET... code: %d\n", httpCode);
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
        mostRecentPayload = https.getString();
        Serial.println(mostRecentPayload);
      }
    } else {
      Serial.printf("[HTTPS] GET... failed, error: %s\n", https.errorToString(httpCode).c_str());
    }

    https.end();
  } else {
    Serial.printf("[HTTPS] Unable to connect\n");
  }
}

void updateLEDs() {
  // Your additional LED control logic goes here
  // ...

  // Control LEDs based on the most recent data
  controlNeoPixel(mostRecentPayload);
}

void controlNeoPixel(String payload) {
  for (int i = 0; i < LED_COUNT; i++) {
    int dataPoint = payload.charAt(i) - '0'; // Convert character to integer

    switch (dataPoint) {
      case 0:
        setPixelColor(i, 255, 0, 0); // Red
        break;
      case 1:
        setPixelColor(i, 0, 255, 0); // Green
        break;
      case 2:
        blinkPixelColor(i, 0, 255, 0, 500); // Blinking Green every 500 milliseconds
        break;
      case 3:
        setPixelColor(i, 255, 255, 0); // Yellow
        break;
      case 4:
        setPixelColor(i, 255, 0, 0); // Orange
        break;
      case 5:
        setPixelColor(i, 0, 0, 255); // Blue
        break;
      case 6:
        setPixelColor(i, 255, 255, 0); // Yellow
        break;
      default:
        break;
    }
  }

  pixels.show();
}

void setPixelColor(int index, uint8_t r, uint8_t g, uint8_t b) {
  pixels.setPixelColor(index, pixels.Color(r, g, b));
}

void blinkPixelColor(int index, uint8_t r, uint8_t g, uint8_t b, unsigned long interval) {
  static unsigned long previousMillis = 0;  // Make it static to persist its value between function calls
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (alternateColorFlag) {
      setPixelColor(index, 0, 0, 0); // Turn off
    } else {
      setPixelColor(index, r, g, b); // Turn on
    }

    alternateColorFlag = !alternateColorFlag;
  }
}

void alternatePixelColor(int index, uint8_t r1, uint8_t g1, uint8_t b1, uint8_t r2, uint8_t g2, uint8_t b2, unsigned long interval) {
  static unsigned long previousMillis = 0;  // Make it static to persist its value between function calls
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (alternateColorFlag) {
      setPixelColor(index, r1, g1, b1);
    } else {
      setPixelColor(index, r2, g2, b2);
    }

    alternateColorFlag = !alternateColorFlag;
  }
}
