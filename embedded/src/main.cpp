#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ==================== Данные Wi-Fi ====================
const char *ssid = "WIFI_NAME_NETWORK"; //Подставьте имя вашего роутера например Xiaomi_2285
const char *password = "WIFI_PASSWORD"; //Подставьте пароль вашего роутера например 13151719

// ==================== Данные сервера ====================
const char *serverUrl = "localhost_url"; //Укажите ссылку на сервер, локально часто https://<your_ip>:3000/data например http://192.168.31.191:3000/data

// ==================== Адрес датчика ====================
#define SHT21_ADDR 0x40

// ==================== Функции для датчика ====================
float readTemperature()
{
  Wire.beginTransmission(SHT21_ADDR);
  Wire.write(0xF3); // команда измерения температуры
  Wire.endTransmission();
  delay(85);

  Wire.requestFrom(SHT21_ADDR, 2);
  if (Wire.available() == 2)
  {
    uint16_t t = Wire.read() << 8 | Wire.read();
    t &= ~0x0003;
    return -46.85 + 175.72 * t / 65536.0;
  }
  return NAN;
}

float readHumidity()
{
  Wire.beginTransmission(SHT21_ADDR);
  Wire.write(0xF5); // команда измерения влажности
  Wire.endTransmission();
  delay(29);

  Wire.requestFrom(SHT21_ADDR, 2);
  if (Wire.available() == 2)
  {
    uint16_t h = Wire.read() << 8 | Wire.read();
    h &= ~0x0003;
    return -6 + 125.0 * h / 65536.0;
  }
  return NAN;
}

// ==================== Функция подключения к Wi-Fi ====================
void connectWiFi()
{
  Serial.print("Подключение к Wi-Fi");
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30)
  {
    delay(1000);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println();
    Serial.print("Wi-Fi подключен! IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Сигнал RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  }
  else
  {
    Serial.println();
    Serial.println("Не удалось подключиться к Wi-Fi");
  }
}

// ==================== Функция проверки сервера ====================
void checkServerAvailability()
{
  HTTPClient http;
  http.begin(serverUrl);
  http.setTimeout(5000);

  int httpCode = http.GET();
  if (httpCode > 0)
  {
    Serial.print("Сервер доступен, код: ");
    Serial.println(httpCode);
  }
  else
  {
    Serial.print("Сервер недоступен, код: ");
    Serial.println(httpCode);
    Serial.print("Ошибка: ");
    Serial.println(http.errorToString(httpCode));
  }
  http.end();
}

// ==================== Функция отправки POST ====================
void sendData(float temperature, float humidity)
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Wi-Fi не подключен! Переподключаемся...");
    connectWiFi();
    return;
  }

  HTTPClient http;

  // Настройка таймаутов
  http.setConnectTimeout(10000);
  http.setTimeout(10000);

  Serial.print("Подключаемся к серверу: ");
  Serial.println(serverUrl);

  if (!http.begin(serverUrl))
  {
    Serial.println("Не удалось начать HTTP соединение");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");

  String postData = "{\"temperature\":" + String(temperature, 2) +
                    ",\"humidity\":" + String(humidity, 2) + "}";

  Serial.print("Отправляемые данные: ");
  Serial.println(postData);

  int httpResponseCode = http.POST(postData);

  if (httpResponseCode > 0)
  {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Ответ сервера: ");
    Serial.println(http.getString());
  }
  else
  {
    Serial.print("Ошибка POST запроса: ");
    Serial.println(httpResponseCode);
    Serial.print("Описание ошибки: ");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
}

// ==================== setup() ====================
void setup()
{
  Serial.begin(115200);
  delay(2000); // Даем время для инициализации последовательного порта

  Serial.println("Инициализация датчика...");
  Wire.begin(21, 22); // SDA, SCL

  Serial.println("Подключение к Wi-Fi...");
  connectWiFi();

  Serial.println("Проверка доступности сервера...");
  checkServerAvailability();

  Serial.println("Система готова к работе!");
}

// ==================== loop() ====================
void loop()
{
  // Проверяем соединение Wi-Fi
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Потеряно соединение Wi-Fi, переподключаемся...");
    connectWiFi();
    delay(2000);
    return;
  }

  float temperature = readTemperature();
  float humidity = readHumidity();

  if (!isnan(temperature) && !isnan(humidity))
  {
    Serial.print("Температура: ");
    Serial.print(temperature);
    Serial.print("°C, Влажность: ");
    Serial.print(humidity);
    Serial.println("%");
    Serial.println("-----------------------");

    sendData(temperature, humidity);
  }
  else
  {
    Serial.println("Ошибка чтения данных с датчика!");
  }

  delay(30000); // каждые 10 секунд
}