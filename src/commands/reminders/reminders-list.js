const OneTimeReminder = require('../../models/OneTimeReminder');
const ms = require('ms');
const cronstrue = require('cronstrue');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const TimeBasedReminder = require('../../models/TimeBasedReminder');
const RecurringReminder = require('../../models/RecurringReminder');
let timeout = [];

module.exports = {
  name: 'reminders-list',
  description: 'Lists all of your reminders',
  callback: async (client, interaction) => {
    const memberId = interaction.user.id;

    // Cooldown for the command in order to prevent spam.
    if (timeout.includes(memberId))
      return await interaction.reply({
        content: 'You are on a cooldown, try again in 1 minute.',
        ephemeral: false,
      });
    timeout.push(memberId);
    setTimeout(() => {
      timeout.shift();
    }, 60000);

    let start = 0; // Will be used to display different reminders.
    try {
      // Retrieve all one-time reminders made by the user.
      const oneTimeReminders = await OneTimeReminder.find({
        authorId: memberId,
      }).exec();

      // Retrieve all time-based reminders made by the user.
      const TimeBasedReminders = await TimeBasedReminder.find({
        authorId: memberId,
      }).exec();

      // Retrieve all time-based reminders made by the user.
      const recurringReminders = await RecurringReminder.find({
        authorId: memberId,
      }).exec();

      const userReminders = [
        ...oneTimeReminders,
        ...TimeBasedReminders,
        ...recurringReminders,
      ];

      if (userReminders.length === 0) {
        await interaction.reply('You have no reminders!');
        return;
      }

      const row = new ActionRowBuilder();

      row.components.push(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
      );

      row.components.push(
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
      );

      const createEmbed = async i => {
        const reminderListEmbed = new EmbedBuilder()
          .setColor('#29A3F0')
          .setTitle(`@${interaction.user.username}'s Reminders`);

        try {
          // Create a new reminder embed which will display an overview of the user's reminders.
          reminderListEmbed.addFields(
            {
              name: `Reminder ${i + 1}/${userReminders.length}`,
              value: `Status: ${userReminders[i].status}`,
            },
            {
              name: 'Message',
              value: userReminders[i].message,
            },
            {
              name: 'Created On',
              value: `Date: ${userReminders[i].createdAt
                .toISOString()
                .slice(0, 10)}\nTime: ${userReminders[i].createdAt
                .toISOString()
                .slice(11, 16)} (UTC)`,
              inline: true,
            },
            {
              name: ' ',
              value: ' ',
              inline: true,
            },
            {
              name: 'Scheduled for',
              value: userReminders[i].time
                ? `${ms(parseInt(userReminders[i].time), {
                    long: true,
                  })}\nType: One-Time`
                : `${cronstrue.toString(
                    userReminders[i].interval
                  )}\nType: Time-based`,
              inline: true,
            }
          );

          await updateReply(interaction, reminderListEmbed, row);
        } catch (error) {
          console.log(error);
        }
      };

      await createEmbed(start);

      // Will indicate if the interaction matches the click on the next button.
      const collectorFilter = interaction =>
        interaction.customId === 'next' || interaction.customId === 'previous';

      // Listening for interactions on message components in this case the buttons.
      const collector = interaction.channel.createMessageComponentCollector({
        filter: collectorFilter,
        time: 60000,
        max: userReminders.length * 4,
      });

      collector.on('collect', async interaction => {
        if (interaction.customId === 'next' && start !== userReminders.length) {
          start += 1;
        } else {
          if (start === 0) return;
          start -= 1;
        }
        await interaction.deferUpdate(); // Acknowledge the interaction to avoid an ephemeral message
        await createEmbed(start);
      });

      collector.on('end', collected => {
        // Handle any necessary cleanup or end-of-collection actions.
      });
    } catch (error) {
      console.log('Error retrieving user reminder details: ', error);
    }
  },
};

const updateReply = async (interaction, embed, row) => {
  if (interaction.replied) {
    await interaction.editReply({ embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
