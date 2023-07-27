const { EmbedBuilder } = require('discord.js');
const OneTimeReminder = require('../../models/OneTimeReminder');

module.exports = async client => {
  // Get the bot's restart time
  const botRestartTime = Date.now();
  // If bot restarts, schedule existing reminders.
  const existingReminders = await OneTimeReminder.find({
    status: 'scheduled',
  }).exec();

  // If there are no existing reminders, return.
  if (existingReminders.length === 0) return;

  // Schedule all existing reminders on bot restart.
  for (const reminder of existingReminders) {
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

      // Calculate the time remaining until the reminder should be triggered
      const timeElapsedSinceCreation =
        botRestartTime - reminder.createdAt.getTime();
      const timeRemaining = time - timeElapsedSinceCreation;
      console.log(parseInt(timeRemaining) / 60000);

      // Schedule sending the reminder using setTimeout.
      setTimeout(() => {
        channel.send({
          content: `${user}`,
          embeds: [reminderEmbed],
        });
        reminder.status = 'done';
        reminder.save();
      }, timeRemaining);
    } catch (error) {
      console.log('Error Scheduling Reminders:', error);
    }
  }
};
