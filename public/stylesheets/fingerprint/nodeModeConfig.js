console.log(mqtt);
// Setup Mqtt
const url = "<%= url %>";
console.log(url);
const options = {
    clean: true,
    connectTimeout: 4000,
    clientId: 'webServerFinger',
    username: 'rifqi',
    password: 'rifqi123',
};
// Koneksi Mqtt
const client = mqtt.connect(url, options)
// Kalau terkoneksi
client.on('connect', function() {
    for (let index = 0; index < data.length; index++) {
        publishNodeStatus("<%= data[index].uid");
    }
});

function publishNodeStatus(uid){
    client.publish(`/finger/${uid}`, function (err) {
        if (err) {
            console.error("Error Publish ke topic:", err);
            throw new Error(err);
        } else {
            console.log(`Publish ke topic: /finger/${uid} berhasil`);
        }
    });
}