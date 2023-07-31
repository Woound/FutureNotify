const OneTimeReminder = require('../../models/OneTimeReminder');
const ms = require('ms');
const cronstrue = require('cronstrue');
const cron = require('node-cron');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
} = require('discord.js');
const TimeBasedReminder = require('../../models/TimeBasedReminder');
const RecurringReminder = require('../../models/RecurringReminder');
let timeout = [];

module.exports = {
  name: 'reminders-list',
  description: 'Lists all of your reminders',
  options: [
    {
      name: 'reminders-type',
      description: 'The type of reminders to list e.g. one-time.',
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: 'One time reminders',
          value: 'one-time',
        },
        {
          name: 'Recurring reminders',
          value: 'recurring',
        },
        {
          name: 'Time-based reminders',
          value: 'time-based',
        },
      ],
    },
  ],

  callback: async (client, interaction) => {
    const memberId = interaction.user.id;

    // // Cooldown for the command in order to prevent spam.
    // if (timeout.includes(memberId))
    //   return await interaction.reply({
    //     content: 'You are on a cooldown, try again in 1 minute.',
    //     ephemeral: false,
    //   });
    // timeout.push(memberId);
    // setTimeout(() => {
    //   timeout.shift();
    // }, 60000);

    let start = 0; // Will be used to display different reminders.
    try {
      const reminderListType = interaction.options.get('reminders-type')?.value;
      let userReminders = [];

      if (reminderListType) {
        if (reminderListType === 'one-time') {
          // Retrieve all one-time reminders made by the user.
          const oneTimeReminders = await OneTimeReminder.find({
            authorId: memberId,
          }).exec();
          userReminders = [...oneTimeReminders];
        } else if (reminderListType === 'recurring') {
          // Retrieve all time-based reminders made by the user.
          const recurringReminders = await RecurringReminder.find({
            authorId: memberId,
          }).exec();
          userReminders = [...recurringReminders];
        } else {
          // Retrieve all time-based reminders made by the user.
          const timeBasedReminders = await TimeBasedReminder.find({
            authorId: memberId,
          }).exec();
          userReminders = [...timeBasedReminders];
        }
      } else {
        // Retrieve all one-time reminders made by the user.
        const oneTimeReminders = await OneTimeReminder.find({
          authorId: memberId,
        }).exec();

        // Retrieve all time-based reminders made by the user.
        const timeBasedReminders = await TimeBasedReminder.find({
          authorId: memberId,
        }).exec();

        // Retrieve all time-based reminders made by the user.
        const recurringReminders = await RecurringReminder.find({
          authorId: memberId,
        }).exec();

        userReminders = [
          ...oneTimeReminders,
          ...timeBasedReminders,
          ...recurringReminders,
        ];
      }

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

      row.components.push(
        new ButtonBuilder()
          .setCustomId(`delete_`)
          .setLabel('Delete')
          .setStyle(ButtonStyle.Danger)
      );

      const createEmbed = async i => {
        const reminderListEmbed = new EmbedBuilder()
          .setColor('#29A3F0')
          .setTitle(`@${interaction.user.username}'s Reminders`);
        // Change customId of delete button to reflect current reminder's ID.
        row.components[2].data.custom_id = `delete_${userReminders[i].reminderId}`;
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
                : cron.validate(userReminders[i].interval)
                ? `${cronstrue.toString(
                    userReminders[i].interval
                  )}\nType: Time-based`
                : `Every ${ms(parseInt(userReminders[i].interval), {
                    long: true,
                  })}\nType: Recurring`,
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
        interaction.customId === 'next' ||
        interaction.customId === 'previous' ||
        interaction.customId.startsWith('delete_');

      // Listening for interactions on message components in this case the buttons.
      const collector = interaction.channel.createMessageComponentCollector({
        filter: collectorFilter,
        time: 60000,
        max: userReminders.length * 5,
      });

      collector.on('collect', async interaction => {
        if (!interaction.customId.startsWith('delete_')) {
          if (
            interaction.customId === 'next' &&
            start !== userReminders.length
          ) {
            start += 1;
          } else if (interaction.customId === 'previous') {
            if (start === 0) return;
            start -= 1;
          }
          await interaction.deferUpdate(); // Acknowledge the interaction to avoid an ephemeral message
          await createEmbed(start);
        } else {
          try {
            const remindertoDelete = interaction.customId.split('_')[1];
            OneTimeReminder.findOne({ reminderId: remindertoDelete }).then(
              async reminderReturned => {
                if (!reminderReturned) return;
                await OneTimeReminder.deleteOne({
                  reminderId: remindertoDelete,
                });
                await interaction.reply('Reminder Succesfully Deleted!');
              }
            );
            RecurringReminder.findOne({ reminderId: remindertoDelete }).then(
              async reminderReturned => {
                if (!reminderReturned) return;
                await RecurringReminder.deleteOne({
                  reminderId: remindertoDelete,
                });
                await interaction.reply('Reminder Succesfully Deleted!');
              }
            );
            TimeBasedReminder.findOne({ reminderId: remindertoDelete }).then(
              async reminderReturned => {
                if (!reminderReturned) return;
                await TimeBasedReminder.deleteOne({
                  reminderId: remindertoDelete,
                });
                await interaction.reply('Reminder Succesfully Deleted!');
              }
            );
          } catch (error) {
            await interaction.reply('Error deleting reminder!');
            console.log('Error deleting reminder: ', error);
          }
        }
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
