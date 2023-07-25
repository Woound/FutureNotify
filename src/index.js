const { Client, IntentsBitField } = require('discord.js');
const dotenv = require('dotenv');
const eventHandler = require('./handlers/eventHandler');
const mongoose = require('mongoose');
dotenv.config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

eventHandler(client);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB.');
    client.login(process.env.BOT_TOKEN);
  })
  .catch(error => {
    console.log(error);
  });
