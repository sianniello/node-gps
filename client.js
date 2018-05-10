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
        const lat = coordinates.split(', ')[0];
        const lng = coordinates.split(', ')[1];
        const timestamp = new Date().toLocaleString();
        const obj = lat + '|' + lng + '|' + timestamp;
        const message = obj;
        client.publish('steno87/feeds/coordinates', message);
        console.log('Sending coordinates: ', message);
    }
}, 20000);

client.on('error', err => {
    console.error(err, 'trying to reconnect...');
    setTimeout(() => {
        client.reconnect();
    }, 30000);
});