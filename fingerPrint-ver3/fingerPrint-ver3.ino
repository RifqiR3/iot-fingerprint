#include <Adafruit_Fingerprint.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

// #if (defined(__AVR__) || defined(ESP8266)) && !defined(__AVR_ATmega2560__)
// For UNO and others without hardware serial, we must use software serial...
// pin #2 is IN from sensor (GREEN wire)
// pin #3 is OUT from arduino  (WHITE wire)
// Set up the serial port to use softwareserial..
// SoftwareSerial mySerial(12, 13);


// #else

// #define mySerial Serial1

// #endif

// Set pengaturan LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);
// WiFi credentials
const char* ssid = "xxx";
const char* password = "xxx";

// ======================== MQTT broker settings ========================
const char* mqtt_server = "xxx"; // IP Broker
const int mqtt_port = 1883; // Default MQTT port
const char* mqtt_username = "xxx";
const char* mqtt_password = "xxx";
const char* mqtt_topic = "/finger/xxx"; // ini ganti UID sesuai di web
// ======================================================================

// ======================== Setup HTTPClient ============================
const char* id_node = "xxx"; // Ini ganti sesuai di web
const char* serverAddress = "http://xxx"; // IP Server
const int serverPort = 3000;
const char* serverRoute = "/fingerprint/absen";
// ======================================================================

HardwareSerial mySerial(2);
WiFiClient espClient;
PubSubClient client(espClient);
// MqttClient mqttClient(espClient);

Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// ID Finger
uint8_t id = 0;
uint8_t menu;
uint8_t mode = 0;
int newMode = 0;

void setup_wifi() {
    delay(10);
    Serial.println();
    Serial.print("Menghubungkan ke ");
    Serial.println(ssid);

    // Koneksi WiFi
    WiFi.begin(ssid, password);
    // Jika WiFi tidak terkoneksi
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi terhubung!");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Attempting MQTT connection...");
        // Inisialisasi Client ID
        String clientId = "ESP8266Client-";
        clientId += String(random(0xffff), HEX);

        if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
            Serial.println("connected");
            client.subscribe(mqtt_topic);
        } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

void setup() {
    // while (!Serial);
    Serial.begin(9600);
    setup_wifi();
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
    Serial.println("Daftar Fingerprint");
    finger.begin(57600);

    if(finger.verifyPassword()) {
        Serial.println("Fingerprint ditemukan!");
    } else {
        Serial.println("Yah fingerprint tidak ada :(");
        while (1);
    }
}

void callback(char* topic, byte* message, unsigned int length) {
    Serial.print("Topic: ");
    Serial.println(topic);
    Serial.print("Message: ");
    for (int i = 0; i < length; i++) {
        Serial.print((char)message[i]);
    }
    Serial.println();

    // Ubah pesan menjadi string
    message[length] = '\0';
    newMode = atoi((char*)message);
    Serial.print("Received newMode: ");
    Serial.println(newMode);
    if (hitungDigit(newMode) > 3)
    {
        newMode = tigaDigitPertama(newMode);
    }
    Serial.println(newMode);
    // CATATAN! Update mode node berdasarkan pesan yang masuk
    // 128 : Enroll
    // 129 : Absensi
    if (newMode == 128 || newMode == 129) {
        mode = newMode;
        Serial.print("Mode menjadi: ");
        if (mode == 128)
        {
           Serial.println("Enroll");
        } else if (mode == 129) {
            Serial.println("Absensi");
        }
    } else if (newMode < 128 || newMode > 129 && mode != 128) {
        if (hitungDigit(newMode) >= 3)
        {
            newMode = digitPertama(newMode);
        }
        id = newMode;
        Serial.print("Received ID: ");
        Serial.println(id);
    } else {
        Serial.println("Mode Invalid!");
    }

    newMode = 0;
}

int hitungDigit(int number){
    int hitung = 0;
    while (number != 0){
        number = number / 10;
        hitung++;
    }
    return hitung;
}

int digitPertama (int number){
    while (number >= 10){
        number = number / 10;
    }
    return number;
}

int tigaDigitPertama(int number) {
    if (number < 0) {
        number = -number;
    }
    while (number >= 1000) {
        number = number / 10;
    }
    return number;
}

uint8_t readnumber(void) {
    uint8_t num = 0;

    while (num == 0) {
        while (! Serial.available());
        num = Serial.parseInt();
    }
    return num;
}

void loop() {
    if(!client.connected()){
        reconnect();
    }
    client.loop();
    Serial.print("Mode sekarang: "); Serial.println(mode);
    Serial.print("ID sekarang: "); Serial.println(id);
    if (mode == 0)
    {
        Serial.println("Menunggu mode dari server...");
    }
    delay(1000);
    switch (mode) {
        case 128:
            // Mode 1: Enrollment
            if (id != 0)
            {
                getFingerprintEnroll();
                id = 0;
            } else {
                checkID();
            }
            break;
        case 129:
            // Mode 2: Verify fingerprint
            getFingerprintID();
            id = 0;
            break;
        default:
            break;
    }
}

uint8_t checkID(){
    unsigned long startTime = millis();
    unsigned long timeout = 10000;
    Serial.print("Menunggu ID dari server..."); Serial.println(".");
    while ((millis() - startTime) < timeout){
        if ((millis() - startTime) % 1000 == 0) {
            client.loop();
        }
    }

    return true;
}

uint8_t getFingerprintEnroll() {
    int p = -1;
    Serial.print("Menunggu jari untuk ID - "); Serial.println(id);
    while (p != FINGERPRINT_OK){
        p = finger.getImage(); // Capture gambar jari
        switch (p) {
        case FINGERPRINT_OK:
            Serial.println("Gambar jari didapat!");
            break;
        case FINGERPRINT_NOFINGER:
            Serial.print(".");
            break;
        case FINGERPRINT_PACKETRECIEVEERR:
            Serial.println("Komunikasi error!");
            break;
        case FINGERPRINT_IMAGEFAIL:
            Serial.println("Gambar error!");
            break;
        default:
            Serial.println("Error tidak diketahui!");
            break;
        }
    }

    p = finger.image2Tz(1); // Ubah gambar menjadi template
    switch (p) {
        case FINGERPRINT_OK:
        Serial.println("Gambar jari telah diubah!");
        break;
        case FINGERPRINT_IMAGEMESS:
        Serial.println("Gambar jari tidak bisa dibaca!");
        return p;
        case FINGERPRINT_PACKETRECIEVEERR:
        Serial.println("Komunikasi error");
        return p;
        case FINGERPRINT_FEATUREFAIL:
        Serial.println("Jari tidak bisa dibaca!");
        return p;
        case FINGERPRINT_INVALIDIMAGE:
        Serial.println("Jari tidak bisa dibaca!");
        return p;
        default:
        Serial.println("Error tidak diketahui!");
        return p;
    }

    // Dari sini kita bandingkan fingerprint pertama dengan fingerprint kedua
    Serial.println("Angkat jari");
    delay(2000);
    p = 0;
    while (p != FINGERPRINT_NOFINGER) {
        p = finger.getImage();
    }
    Serial.print("ID - "); Serial.println(id);
    p = -1;
    Serial.println("Pasang jari lagi");
    while (p != FINGERPRINT_OK) {
        p = finger.getImage();
        switch (p) {
        case FINGERPRINT_OK:
        Serial.println("Gambar jari didapat!");
        break;
        case FINGERPRINT_NOFINGER:
        Serial.print(".");
        break;
        case FINGERPRINT_PACKETRECIEVEERR:
        Serial.println("Komunikasi error!");
        break;
        case FINGERPRINT_IMAGEFAIL:
        Serial.println("Gambar error!");
        break;
        default:
        Serial.println("Error tidak diketahui!");
        break;
        }
    }

    p = finger.image2Tz(2); // Finger kedua dimasukkan ke slot 2
    switch (p) {
        case FINGERPRINT_OK:
        Serial.println("Gambar jari telah diubah!");
        break;
        case FINGERPRINT_IMAGEMESS:
        Serial.println("Gambar jari tidak bisa dibaca!");
        return p;
        case FINGERPRINT_PACKETRECIEVEERR:
        Serial.println("Komunikasi error");
        return p;
        case FINGERPRINT_FEATUREFAIL:
        Serial.println("Jari tidak bisa dibaca!");
        return p;
        case FINGERPRINT_INVALIDIMAGE:
        Serial.println("Jari tidak bisa dibaca!");
        return p;
        default:
        Serial.println("Error tidak diketahui!");
        return p;
    }

    // Bandingkan dua fingerprint tadi, kalau sama kita buat modelnya kemudian kita simpan ke database lokal fingerprint
    Serial.print("Membuat model untuk jari dengan ID - "); Serial.println(id);
    p = finger.createModel(); // Buat model
    if (p == FINGERPRINT_OK) {
        Serial.println("Kedua data jari sama!");
    } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
        Serial.println("Komunikasi error!");
        return p;
    } else if (p == FINGERPRINT_ENROLLMISMATCH) {
        Serial.println("Fingerprint tidak sama!");
        return p;
    } else {
        Serial.println("Error tidak diketahui!");
        return p;
    }

    Serial.print("ID - "); Serial.println(id);
    p = finger.storeModel(id);
    if (p == FINGERPRINT_OK) {
        Serial.println("Fingerprint tersimpan!");
        client.publish(mqtt_topic, "enroll");
        client.loop();
    } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
        Serial.println("Komunikasi error!");
        return p;
    } else if (p == FINGERPRINT_BADLOCATION) {
        Serial.println("Fingerprint tidak bisa disimpan di lokasi tersebut!");
        return p;
    } else if (p == FINGERPRINT_FLASHERR) {
        Serial.println("Error saat menyimpan data ke memori!");
        return p;
    } else {
        Serial.println("Error tidak diketahui!");
        return p;
    }
    
    return true;
}


uint8_t getFingerprintID() {
    int p = -1;
    unsigned long startTime = millis();
    unsigned long timeout = 10000;

    Serial.println("Menunggu jari...");
    while (p != FINGERPRINT_OK && (millis() - startTime) < timeout) {
        p = finger.getImage();
        switch (p) {
            case FINGERPRINT_OK:
                Serial.println("Image taken");
                break;
            case FINGERPRINT_NOFINGER:
                Serial.print(".");
                break;
            case FINGERPRINT_PACKETRECIEVEERR:
                Serial.println("Communication error");
                return p;
            case FINGERPRINT_IMAGEFAIL:
                Serial.println("Imaging error");
                return p;
            default:
                Serial.println("Unknown error");
                return p;
        }
    }

    // OK success!
    p = finger.image2Tz();

    switch (p) {
        case FINGERPRINT_OK:
            Serial.println("Image converted");
            break;
        case FINGERPRINT_IMAGEMESS:
            Serial.println("Image too messy");
            return p;
        case FINGERPRINT_PACKETRECIEVEERR:
            Serial.println("Communication error");
            return p;
        case FINGERPRINT_FEATUREFAIL:
            Serial.println("Could not find fingerprint features");
            return p;
        case FINGERPRINT_INVALIDIMAGE:
            Serial.println("Could not find fingerprint features");
            return p;
        default:
            Serial.println("Unknown error");
            return p;
    }

    // OK converted!
    p = finger.fingerSearch();
    

    if (p == FINGERPRINT_OK) {
        Serial.println("Found a print match!");
        char jari[6];
        itoa(finger.fingerID, jari, 10);
        // client.publish(mqtt_topic, jari);
        sendFingerprintID(jari);
        client.loop();
    } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
        Serial.println("Communication error");
        return p;
    } else if (p == FINGERPRINT_NOTFOUND) {
        Serial.println("Anda tidak terdaftar di kelas ini");
        return p;
    } else {
        Serial.println("Unknown error");
        return p;
    }
    
    // found a match!
    Serial.print("Data ditemkukan ID #"); Serial.print(finger.fingerID);
    Serial.print(" dengan nilai keakuratan "); Serial.println(finger.confidence);
    delay(2000);
    return finger.fingerID;
}

void sendFingerprintID(char *fingerprintID) {
    // Buat object HTTPClient
    HTTPClient http;
    // URL Untuk kirim data
    String url = String(serverAddress) + ":" + String(serverPort) + serverRoute;
  
    // Mulai koneksi HTTP
    http.begin(url);
    // Set Header
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    // Set data yang mau dikirim
    String postData = "id_finger=" + String(fingerprintID);
    postData += "&id_node=" + String(id_node);

    // Kirim request POST
    int httpResponseCode = http.POST(postData);
  
    // Periksa respon HTTP dari server
    if (httpResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        // Parsing respon JSON yang diterima
        DynamicJsonDocument jsonBuffer(1024);
        deserializeJson(jsonBuffer, http.getString());
        // Ambil respon dari server
        const char* status = jsonBuffer["status"];
        // Cetak respon
        Serial.print("Dari server: ");
        Serial.println(status);
    } else {
        Serial.print("HTTP Request failed: ");
        Serial.println(httpResponseCode);
    }
  
    // Tutup koneksi
    http.end();
}