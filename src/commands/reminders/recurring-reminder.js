const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const convertUserInputToMs = require('../../utils/convertUserInputToMs');
const isCronExpressionInvalid = require('../../utils/isCronExpressionInvalid');
const RecurringReminder = require('../../models/RecurringReminder');
const scheduleRecurringReminder = require('../../events/interactionCreate/scheduleRecurringReminder');

module.exports = {
  name: 'recurring-reminder',
  description: 'Creates a new recurring reminder',
  options: [
    {
      name: 'interval',
      description: 'How often the reminder should be sent. E.g. 5 hours',
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
      name: 'target-role',
      description: 'The role ID to ping in the reminder.',
      type: ApplicationCommandOptionType.String,
      permissionsRequired: [PermissionFlagsBits.Administrator],
      required: false,
    },
  ],
  callback: async (client, interaction) => {
    const time = interaction.options.get('interval').value.trim();
    const message = interaction.options.get('message').value.trim();
    const targetRoleId = interaction.options.get('target-role')?.value?.trim();

    try {
      // Converting user's time input into cron.
      const cronExpression = await convertUserInputToMs(time);
      // Checking if the time entered by the user results in a valid cron expression.
      const checkCronExpression = await isCronExpressionInvalid(cronExpression);
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

      // Construct the response embed and reply to the command
      const replyEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Reminder Created!')
        .setDescription(
          `Your reminder has been scheduled.\n\nTime: Every ${time}\n\nMessage: "${message}"`
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [replyEmbed],
        ephemeral: false,
      });

      // Store reminder details in database.
      const newReminder = new RecurringReminder({
        authorId: interaction.user.id,
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        createdAt: new Date(),
        interval: cronExpression,
        message: message,
        targetRole: targetRoleId ? targetRoleId : null,
      });

      newReminder
        .save()
        .then(() => {
          console.log('Reminder saved to MongoDB.');
        })
        .catch(error => {
          interaction.editReply('An error occured!');
          console.log('Database error:', error);
        });

      await scheduleRecurringReminder(client);
    } catch (error) {
      console.log(error);
    }
  },
};
