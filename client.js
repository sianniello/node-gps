require('dotenv').config();
const mqtt = require('mqtt');
const randomCoordinates = require('random-coordinates');

const config = {
    port: 8883,
    username: process.env.USR,
    password: process.env.AIO_KEY
};
const client = mqtt.connect(process.env.HOST, config);

const routine = setInterval(() => {
    if (client.connected) {
    const coordinates = randomCoordinates();
    client.publish('steno87/feeds/coordinates', coordinates);
    console.log('Sending coordinates: ', coordinates);
    }
}, 20000);

client.on('error', err => {
    console.error(err, 'trying to reconnect...');
    setTimeout(() => {
        client.reconnect();
    }, 30000);
});