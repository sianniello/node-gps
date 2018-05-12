require('dotenv').config();
const mqtt = require('mqtt');
const TelegramBot = require('node-telegram-bot-api');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
  positions: []
}).write();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: true
});

let last_message = db.get('positions').takeRight(1).value() || null;
const config = {
  port: 8883,
  username: process.env.USR,
  password: process.env.AIO_KEY
};

const client = mqtt.connect(process.env.HOST, config);
client.on('connect', () => client.subscribe('steno87/feeds/coordinates'));
let active = false;

bot.on('message', msg => {
  const chatId = msg.chat.id;
  console.log("Message: ", msg.text);

  switch (msg.text) {
    case '/start':
      {
        if (!active) {
          active = true;
          bot.sendMessage(chatId, 'Service started');
          client.on('message', (topic, message) => {
            console.log(message.toString());
            const coordinates = {
              lat: message.toString().split('|')[0],
              lng: message.toString().split('|')[1],
              tms: message.toString().split('|')[2]
            };

            const d = calcCrow(process.env.HOME_LAT, process.env.HOME_LNG, coordinates.lat, coordinates.lng);
            console.log("Coordinates: ", coordinates.lat, coordinates.lng);
            console.log("Timestamp", coordinates.tms);
            console.log("Distance", d);
            last_message = coordinates;
            last_message.distance = d;
            if (d <= 1.5)
              bot.sendMessage(chatId, `Distance: ${d} Km`);
            
              save(coordinates);
          });

          client.on('error', err => {
            console.error(err, 'trying to reconnect...');
            setTimeout(() => {
              client.reconnect();
            }, 30000);
          });
        } else {
          bot.sendMessage(chatId, 'You have already stated the service');
        }
        break;
      }

    case '/position':
      {
        if (!active) {
          bot.sendMessage(chatId, 'You need to start the service first. Use /start.');
          break;
        }
        if (last_message) {
          bot.sendLocation(chatId, last_message.lat, last_message.lng);
          bot.sendMessage(chatId, `Last position: lat: ${last_message.lat} long: ${last_message.lng} timestamp: ${last_message.tms}`);
        } else
          bot.sendMessage(chatId, "Last position not available");
        break;
      }

    case '/stop':
      {
        active = false;
        client.unsubscribe('steno87/feeds/coordinates');
        break;
      }

  }

});

bot.on('error', (err) => console.error(err));

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  lat1 = toRad(lat1);
  lat2 = toRad(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return Value * Math.PI / 180;
}

function save(coordinates) {
  if (db.get('positions').size().value() === 10)
    db.get('positions').orderBy('timestamp', 'desc').pop().write();
  db.get('positions')
    .push({
      id: shortid.generate(),
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      timestamp: coordinates.tms
    }).write();
}