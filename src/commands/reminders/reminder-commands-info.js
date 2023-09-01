const { EmbedBuilder } = require('discord.js');
const ms = require('ms');
let timeout = [];

module.exports = {
  name: 'reminders-info',
  description: 'Get information about reminder commands.',
  callback: async (client, interaction) => {
    const memberId = interaction.user.id;
    const cooldown = 20000; // Cooldown, can be changed to accomodate user preference.

    // Cooldown for the command in order to prevent spam.
    if (timeout.includes(memberId))
      return await interaction.reply({
        content: `You are on a cooldown, try again in ${ms(cooldown, {
          long: true,
        })}`,
        ephemeral: false,
      });
    timeout.push(memberId);
    setTimeout(() => {
      timeout.shift();
    }, cooldown);

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('Reminder Commands')
      .setDescription(
        'Here is information about the different reminder commands:'
      )
      .addFields(
        {
          name: '1. Remind Once',
          value:
            'Description: Will create a one-time reminder sent after the specified time has elapsed.',
        },
        {
          name: ' ',
          value: ' ',
        },
        {
          name: '2. Time-based Reminder',
          value:
            'Description: Will schedule a reminder with precise time settings for specific times every day or on selected days of the week.\n\nExamples: 4 minutes: Every 4th minute of the hour, 2 hours: Every 2nd hour of the day, Thursday: Every Thursday of the week etc...',
        },
        {
          name: ' ',
          value: ' ',
        },
        {
          name: '3. Recurring Reminder',
          value:
            'Description: Will create a new recurring reminder with customizable intervals. Different from Time-based-reminder as it will execute the reminder starting from when the user creates it.',
        }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
