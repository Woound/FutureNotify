const { EmbedBuilder } = require('discord.js');
const RecurringReminder = require('../../models/RecurringReminder');

module.exports = async client => {
  // Retrieve all pending one-time reminders from the database.
  const dueReminders = await RecurringReminder.find({
    status: 'pending',
  }).exec();

  // Schedule all new reminders.
  for (const reminder of dueReminders) {
    try {
      await sendRecurringReminder(client, reminder);
      reminder.status = 'scheduled';
      await reminder.save();
    } catch (error) {
      console.log('Error Scheduling Reminders:', error);
    }
  }
};

const sendRecurringReminder = (client, reminder) => {
  const {
    authorId,
    guildId,
    channelId,
    interval,
    message,
    targetRole,
    reminderId,
  } = reminder;

  // Fetch the guild and channel objects using their IDs
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(channelId);
  const user = client.users.cache.get(authorId);
  const role = guild.roles.cache.get(targetRole);

  const reminderEmbed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('🔔 Reminder 🔔')
    .addFields({
      name: 'Message',
      value: `**${message}**`,
    });

  // Schedule the next reminder after the specified interval
  setTimeout(() => {
    RecurringReminder.findOne({ reminderId: reminderId })
      .exec()
      .then(reminderFound => {
        if (!reminderFound) {
          return;
        }
        console.log('Reminder Found!');
        sendRecurringReminder(client, reminder);
        // Send the reminder to the channel
        channel.send({
          content: role ? `${role}` : `${user}`,
          embeds: [reminderEmbed.setTimestamp()],
        });
      })
      .catch(error => {
        console.log(
          'An error occured when rescheduling recurring reminders.',
          error
        );
      });
  }, interval);
};
