const { EmbedBuilder } = require('discord.js');
const OneTimeReminder = require('../../models/OneTimeReminder');
const TimeBasedReminder = require('../../models/TimeBasedReminder');
const cron = require('node-cron');
const cronstrue = require('cronstrue');
const RecurringReminder = require('../../models/RecurringReminder');
const ms = require('ms');

module.exports = async client => {
  await scheduleExisTimeBasedReminders(client);
  await scheduleExisRecurringReminders(client);
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

const scheduleExisTimeBasedReminders = async client => {
  const existingTimeBasedReminders = await TimeBasedReminder.find({
    status: 'pending',
  }).exec();

  if (existingTimeBasedReminders.length === 0) return;

  for (const existingTimeBasedReminder of existingTimeBasedReminders) {
    const { authorId, guildId, channelId, interval, message, targetRole } =
      existingTimeBasedReminder;
    try {
      // Fetch the guild and channel objects using their IDs.
      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.cache.get(channelId);
      const user = await client.users.fetch(authorId);
      const reminderEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`🔔 Reminder 🔔`)
        .addFields({
          name: 'Message',
          value: `**${message}**`,
        })
        .setFooter({
          text: `Created On: ${existingTimeBasedReminder.createdAt
            .toISOString()
            .slice(0, 10)}\nSet For: ${cronstrue.toString(interval)}`,
        });

      cron.schedule(interval, async () => {
        await channel.send({
          content: `${targetRole ? `<@&${targetRole}>` : `${user}`}`,
          embeds: [reminderEmbed],
        });
      });
    } catch (error) {
      console.log('Error scheduling existing recurring-reminders', error);
    }
  }
};

const scheduleExisRecurringReminders = async client => {
  const existingRecurringReminders = await RecurringReminder.find({
    status: 'scheduled',
  }).exec();

  if (existingRecurringReminders.length === 0) return;

  for (const existingRecurringReminder of existingRecurringReminders) {
    const { authorId, guildId, channelId, interval, message, targetRole } =
      existingRecurringReminder;
    try {
      // Fetch the guild and channel objects using their IDs.
      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.cache.get(channelId);
      const user = await client.users.fetch(authorId);
      const reminderEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`🔔 Reminder 🔔`)
        .addFields({
          name: 'Message',
          value: `**${message}**`,
        })
        .setFooter({
          text: `Created On: ${existingRecurringReminder.createdAt
            .toISOString()
            .slice(0, 10)}\nSet For: Every ${ms(parseInt(interval), {
            long: true,
          })}`,
        });

      await sendRecurringReminder(
        client,
        reminderEmbed,
        channel,
        user,
        interval
      );
    } catch (error) {
      console.log('Error scheduling existing recurring-reminders', error);
    }
  }
};

const sendRecurringReminder = (
  client,
  reminderEmbed,
  channel,
  user,
  interval
) => {
  // Schedule the next reminder after the specified interval
  setTimeout(() => {
    sendRecurringReminder(client, reminderEmbed, channel, user, interval);
    // Send the reminder to the channel
    channel.send({
      content: `${user}`,
      embeds: [reminderEmbed.setTimestamp()],
    });
  }, interval);
};
