require('dotenv').config();
const mqtt = require('mqtt');
const randomCoordinates = require('random-coordinates');

const config = {
    port: 8883,
    username: process.env.USR,
    password: process.env.AIO_KEY
};
const client = mqtt.connect(process.env.HOST, config);


client.on('connect', () => {
    setInterval(() => {
        const coordinates = randomCoordinates();
        client.publish('steno87/feeds/coordinates', coordinates);
        console.log('Sending coordinates: ', coordinates);
    }, 20000);
});

client.on('error', (error) => {
    console.log(config);
    console.log('MQTT Client Errored');
    console.log(error);
    client.end();
});