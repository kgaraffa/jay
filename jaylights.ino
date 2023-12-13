#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <Adafruit_NeoPixel.h>
#include <TimeLib.h>

const char *ssid = "Garaffa";
const char *password = "1fourkids";

const int LED_PIN = D7;
const int LED_COUNT = 130;  // Adjust the number of LEDs in your strip

Adafruit_NeoPixel pixels(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

unsigned long previousMillisGet = 0;
unsigned long previousMillisLED = 0;
bool alternateColorFlags[LED_COUNT][2] = {false};  // An array to store individual alternateColorFlag for each LED
String mostRecentPayload;  // Store the most recent payload globally

// New function to set system time from server
void setSystemTime() {
  std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  client->setInsecure();

  HTTPClient https;

  Serial.print("[HTTPS] Getting timestamp...\n");
  if (https.begin(*client, "https://jaypeaktrailmapled.firebaseapp.com/jay-date/")) {
    Serial.print("[HTTPS] GET...\n");
    int httpCode = https.GET();
    if (httpCode > 0) {
      Serial.printf("[HTTPS] GET... code: %d\n", httpCode);
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
        String timestamp = https.getString();
        Serial.println("Timestamp received: " + timestamp);

        // Convert the timestamp to time_t
        time_t receivedTime = timestamp.toInt();
        setTime(receivedTime);  // Set the system time
        Serial.println("System time set!");

        // You can print the current time to verify if it's set correctly
        Serial.print("Current Time after setting: ");
        Serial.println(now());
      }
    } else {
      Serial.printf("[HTTPS] GET... failed, error: %s\n", https.errorToString(httpCode).c_str());
    }

    https.end();
  } else {
    Serial.printf("[HTTPS] Unable to connect\n");
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }

  // Set system time from the server
  setSystemTime();

  pixels.begin();
  pixels.show();           // Initialize all pixels to 'off'
  pixels.setBrightness(50); // Set brightness

  // Wait for 1 minute upon initial load
  delay(5000);

  // Perform the first GET request
  performHTTPGET();
}

void loop() {
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
  controlNeoPixel(mostRecentPayload);
}

void controlNeoPixel(String payload) {
  // Reset LED state before processing new pattern
  // resetLEDState();

  for (int i = 0; i < 72; i++) {
    int dataPoint = payload.charAt(i) - '0'; // Convert character to integer
    int j;
    int x = 64; // start lift LED
    int flyer = 8;
    int metro = 6;
    int tram = 10;
    int village = 4;
    int taxi = 4;
    int bonnie = 8;
    int jet = 6;

    if (i == 64) { // flyer
      switch (dataPoint) {
        case 3: // Open
          for (j = 0; j < flyer; j++) { 
            blinkChairliftPixelColor(x + j, 255, 255, 0, j * 1000, flyer * 1000, 0);
          }
          break;
        case 4: // Closed
          for (j = 0; j < flyer; j++) { 
            setPixelColor(x + j, 255, 0, 0); // Red
          }
          break;
        case 5: // On Hold
          for (j = 0; j < flyer; j++) { 
            setPixelColor(x + j, 0, 0, 255); // Blue
          }
          break;
        default:
          break;
      }
    } else if (i == 65) { // metro
      switch (dataPoint) {
        case 3: // Open
          for (j = 0; j < metro; j++) {
            blinkChairliftPixelColor(x + flyer + j, 255, 255, 0, j * 1000, metro * 1000, 0);
          }
          break;
        case 4: // Closed
          for (j = 0; j < metro; j++) { 
            setPixelColor(x + flyer + j, 255, 0, 0); // Red
          }
          break;
        case 5: // On Hold
          for (j = 0; j < metro; j++) { 
            setPixelColor(x + flyer + j, 0, 0, 255); // Blue
          }
          break;
        default:
          break;
      }
    } else if (i == 66) { // tram
      switch (dataPoint) {
        case 3: // Open
          for (j = 0; j < tram; j++) {
            blinkChairliftPixelColor(x + flyer + metro + j, 255, 255, 0, j * 1000, tram * 1000, 0);
          }
          break;
        case 4: // Closed
          for (j = 0; j < tram; j++) { 
            setPixelColor(x + flyer + metro + j, 255, 0, 0); // Red
          }
          break;
        case 5: // On Hold
          for (j = 0; j < tram; j++) { 
            setPixelColor(x + flyer + metro + j, 0, 0, 255); // Blue
          }
          break;
        default:
          break;
      }
    } else if (i == 67) { // village
      switch (dataPoint) {
        case 3: // Open
          for (j = 0; j < village; j++) { 
            blinkChairliftPixelColor(x + flyer + metro + tram + j, 255, 255, 0, j * 1000, village * 1000, 0);
            setPixelColor(x + flyer + metro + tram + j, 255, 255, 0); // Yellow
          }
          break;
        case 4: // Closed
          for (j = 0; j < village; j++) { 
            setPixelColor(x + flyer + metro + tram + j, 255, 0, 0); // Red
          }
          break;
        case 5: // On Hold
          for (j = 0; j < village; j++) { 
            setPixelColor(x + flyer + metro + tram + j, 0, 0, 255); // Blue
          }
          break;
        default:
          break;
      }
    } else if (i == 68) { // taxi
      switch (dataPoint) {
        case 3: // Open
          for (j = 0; j < taxi; j++) { 
            blinkChairliftPixelColor(x + flyer + metro + tram + village + j, 255, 255, 0, j * 1000, taxi * 1000, 0);
          }
          break;
        case 4: // Closed
          for (j = 0; j < taxi; j++) { 
            setPixelColor(x + flyer + metro + tram + village + j, 255, 0, 0); // Red
          }
          break;
        case 5: // On Hold
          for (j = 0; j < taxi; j++) { 
            setPixelColor(x + flyer + metro + tram + village + j, 0, 0, 255); // Blue
          }
          break;
        default:
          break;
      }
    } else if (i == 69) { // bonnie
      switch (dataPoint) {
        case 3: // Open
          for (j = 0; j < bonnie; j++) { 
            blinkChairliftPixelColor(x + flyer + metro + tram + village + taxi + j, 255, 255, 0, j * 1000, bonnie * 1000, 0);
          }
          break;
        case 4: // Closed
          for (j = 0; j < bonnie; j++) { 
            setPixelColor(x + flyer + metro + tram + village + taxi + j, 255, 0, 0); // Red
          }
          break;
        case 5: // On Hold
          for (j = 0; j < bonnie; j++) { 
            setPixelColor(x + flyer + metro + tram + village + taxi + j, 0, 0, 255); // Blue
          }
          break;
        default:
          break;
      }
    } else if (i == 70) { // jet
      switch (dataPoint) {
        case 3: // Open
          for (j = 0; j < jet; j++) { 
            blinkChairliftPixelColor(x + flyer + metro + tram + village + taxi + bonnie + j, 255, 255, 0, j * 1000, jet * 1000, 0);
          }
          break;
        case 4: // Closed
          for (j = 0; j < jet; j++) { 
            setPixelColor(x + flyer + metro + tram + village + taxi + bonnie + j, 255, 0, 0); // Red
          }
          break;
        case 5: // On Hold
          for (j = 0; j < jet; j++) { 
            setPixelColor(x + flyer + metro + tram + village + taxi + bonnie + j, 0, 0, 255); // Blue
          }
          break;
        default:
          break;
      }
    } else {
      switch (dataPoint) {
        case 0: // Closed
          setPixelColor(i, 255, 0, 0); // Red
          break;
        case 1: // Open
          setPixelColor(i, 0, 255, 0); // Green
          break;
        case 2: // Groomed
          blinkPixelColor(i, 0, 255, 0, 500, 0, dataPoint); // Blinking Green every 500 milliseconds
          break;
        case 6: // Partially Open
          setPixelColor(i, 255, 255, 0); // Yellow
          break;
        default:
          break;
      }
    }
  }

  pixels.show();
}

void setPixelColor(int index, uint8_t r, uint8_t g, uint8_t b) {
  pixels.setPixelColor(index, pixels.Color(r, g, b));
}

void blinkPixelColor(int index, uint8_t r, uint8_t g, uint8_t b, unsigned long interval, int flagIndex, int blinkValue) {
  static unsigned long *previousMillisBlink = nullptr;

  if (!previousMillisBlink) {
    previousMillisBlink = new unsigned long[LED_COUNT];
    memset(previousMillisBlink, 0, sizeof(unsigned long) * LED_COUNT);
  }

  unsigned long currentMillis = millis();

  if (blinkValue == 2) {
    if (currentMillis - previousMillisBlink[index] >= interval) {
      previousMillisBlink[index] = currentMillis;

      if (alternateColorFlags[index][flagIndex]) {
        setPixelColor(index, 0, 0, 0); // Turn off
      } else {
        setPixelColor(index, r, g, b); // Turn on
      }

      alternateColorFlags[index][flagIndex] = !alternateColorFlags[index][flagIndex];
    }
  } else {
    // If not blinking, turn off the LED
    setPixelColor(index, 0, 0, 0);
  }
}

void blinkChairliftPixelColor(int index, uint8_t r, uint8_t g, uint8_t b, unsigned long delayBeforeBlink, unsigned long intervalBetweenBlinks, int flagIndex) {
  static unsigned long *previousMillisBlink = nullptr;
  static unsigned long *startMillisDelay = nullptr;

  if (!previousMillisBlink) {
    previousMillisBlink = new unsigned long[LED_COUNT];
    memset(previousMillisBlink, 0, sizeof(unsigned long) * LED_COUNT);
  }

  if (!startMillisDelay) {
    startMillisDelay = new unsigned long[LED_COUNT];
    memset(startMillisDelay, 0, sizeof(unsigned long) * LED_COUNT);
  }

  unsigned long currentMillis = millis();
  if (startMillisDelay[index] == 0) {
    // First time, initialize the delay start time
    startMillisDelay[index] = currentMillis;
  }

  if (currentMillis - startMillisDelay[index] >= delayBeforeBlink) {
    if (currentMillis - previousMillisBlink[index] >= intervalBetweenBlinks) {
      previousMillisBlink[index] = currentMillis;

      if (alternateColorFlags[index][flagIndex]) {
        setPixelColor(index, 0, 0, 0); // Turn off
      } else {
        setPixelColor(index, r, g, b); // Turn on
      }

      alternateColorFlags[index][flagIndex] = !alternateColorFlags[index][flagIndex];
    }
  } else {
    // Before the first blink, turn off the LED
    setPixelColor(index, 0, 0, 0);
  }

}