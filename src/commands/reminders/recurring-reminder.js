const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const cron = require('node-cron');
const cronstrue = require('cronstrue');
const isCronExpressionInvalid = require('../../utils/isCronExpressionInvalid');
const convertHumanInpuToCron = require('../../utils/convertHumanInpuToCron');
const RecurringReminder = require('../../models/RecurringReminder');

module.exports = {
  name: 'recurring-reminder',
  description: 'Creates a new recurring reminder.',
  options: [
    {
      name: 'interval',
      description: 'How often the remainder should be given.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'message',
      description: 'Content of the reminder.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'start-time',
      description:
        'Time at which the reminder should be issued. (24 hour format)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'target-role',
      description: 'The role ID to ping in the reminder.',
      type: ApplicationCommandOptionType.String,
      permissionsRequired: [PermissionFlagsBits.Administrator],
      required: false,
    },
  ],

  callback: async (client, interaction) => {
    // Retrieving all the options the user entered.
    const time = interaction.options.get('interval').value.trim();
    const message = interaction.options.get('message').value.trim();
    const startTime = interaction.options.get('start-time')?.value?.trim();
    const targetRoleId = interaction.options.get('target-role')?.value?.trim();

    // Convert user input into chron format.
    const cronExpression = await convertHumanInpuToCron(time, startTime);

    try {
      const checkCronExpression = await isCronExpressionInvalid(cronExpression);
      // Checking if the time entered by the user results in a valid cron expression.
      if (checkCronExpression) {
        await interaction.reply({
          embeds: [checkCronExpression],
          ephemeral: false,
        });
        return;
      }

      const memberId = interaction.user.id;
      const user = interaction.guild.members.cache.get(memberId);

      // Checking if the user has the necessary permissions to use the target-role option.
      if (targetRoleId) {
        const requiredPemissions = targetRoleId.permissionsRequired;
        const hasPermissions = user.permissions.any(requiredPemissions);

        if (!hasPermissions) {
          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Permission Denied!')
            .setDescription(
              'You do not have the required permissions to use the `target-role` option.'
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: false });
          return;
        }

        // Checking if the role with the given ID exists.
        const role = interaction.guild.roles.cache.get(targetRoleId);
        if (!role) {
          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Invalid Role ID!')
            .setDescription(
              'The specified role ID does not exist in this server. Please provide a valid role ID.'
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: false });
          return;
        }
      }
      // If all the checks pass, we can move onto storing reminder details in our database.
      const newReminder = await new RecurringReminder({
        authorId: memberId,
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        createdAt: new Date(),
        interval: cronExpression,
        message: message,
      });

      newReminder
        .save()
        .then(() => {
          console.log('Reminder saved to MongoDB.');
        })
        .catch(error => {
          interaction.reply('An error occured!', error);
        });

      // Schedule the reminder using node-cron.
      cron.schedule(cronExpression, () => {
        newReminder.lastExecuted = new Date();
        newReminder.save();

        const reminderEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(`🔔 Reminder 🔔`)
          .addFields({
            name: 'Message',
            value: `**${message}**`,
          })
          .setTimestamp();

        interaction.channel.send({
          content: `${targetRoleId ? `<@&${targetRoleId}>` : `${user}`}`,
          embeds: [reminderEmbed],
        });
      });

      // Construct the response embed and reply to the command.
      const replyEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Reminder Created!')
        .setDescription(
          `Your reminder has been scheduled for:\n\n"${cronstrue.toString(
            cronExpression
          )}"\n\nMessage: "${message}"${
            targetRoleId ? `\n\nRole: ${`<@&${targetRoleId}>`}` : ''
          }`
        )
        .setTimestamp();

      interaction.reply({
        embeds: [replyEmbed],
        ephemeral: false,
      });
    } catch (error) {
      console.log(error);
    }
  },
};
