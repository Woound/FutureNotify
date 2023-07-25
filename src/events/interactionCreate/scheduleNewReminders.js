const { EmbedBuilder } = require('discord.js');
const OneTimeReminder = require('../../models/OneTimeReminder');

module.exports = async client => {
  // Retrieve all pending one-time reminders from the database.
  const dueReminders = await OneTimeReminder.find({
    status: 'pending',
  }).exec();

  // Schedule all new reminders.
  for (const reminder of dueReminders) {
    const { authorId, guildId, channelId, time, message } = reminder;
    try {
      // Fetch the guild and channel objects using their IDs.
      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.cache.get(channelId);
      const user = await client.users.fetch(authorId);

      const reminderEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🔔 Reminder 🔔')
        .addFields({
          name: 'Message',
          value: `**${message}**`,
        })
        .setTimestamp();
      reminder.status = 'scheduled';
      reminder.save();

      // Schedule sending the reminder using setTimeout.
      setTimeout(() => {
        channel.send({
          content: `${user}`,
          embeds: [reminderEmbed],
        });
        reminder.status = 'done';
        reminder.save();
      }, time);
    } catch (error) {
      console.log('Error Scheduling Reminders:', error);
    }
  }
};
