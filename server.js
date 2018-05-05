require('dotenv').config();
const mqtt = require('mqtt');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: true
});

const config = {
  port: 8883,
  username: process.env.USR,
  password: process.env.AIO_KEY
};
console.log(config);
const client = mqtt.connect(process.env.HOST, config);
client.on('connect', () => client.subscribe('steno87/feeds/coordinates'));

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  client.on('message', (topic, message) => {
    console.log(message.toString());
    const coordinates = { 
      lat: message.toString().split(', ')[0],
      lng: message.toString().split(', ')[1],
    };
    const d = calcCrow(process.env.HOME_LAT, process.env.HOME_LNG, coordinates.lat, coordinates.lng);
    console.log(d);
    if (d <= 1.5)
      bot.sendMessage(chatId, `Distance: ${d} Km`);
  });

});

bot.on('error', (err) => console.error(err) );

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) 
{
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
function toRad(Value) 
{
    return Value * Math.PI / 180;
}