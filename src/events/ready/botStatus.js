const { ActivityType } = require('discord.js');

module.exports = client => {
  client.user.setActivity({
    name: 'your reminder requests.',
    type: ActivityType.Listening,
  });
};
