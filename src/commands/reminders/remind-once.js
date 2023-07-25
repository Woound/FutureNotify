const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const convertUserInputToMs = require('../../utils/convertUserInputToMs');
const OneTimeReminder = require('../../models/OneTimeReminder');
const scheduleNewReminders = require('../../events/interactionCreate/scheduleNewReminders');

module.exports = {
  name: 'remind-once',
  description: 'Creates a ONE-time reminder.',
  options: [
    {
      name: 'in',
      description: 'When the reminder should be given. e.g. 5 hours',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'message',
      description: 'Content of the reminder.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    const time = interaction.options.get('in').value.trim();
    const message = interaction.options.get('message').value.trim();
    const memberId = interaction.user.id;
    const user = interaction.guild.members.cache.get(memberId);

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

      // Construct the response embed and reply to the command
      const replyEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Reminder Created!')
        .setDescription(
          `Your reminder has been scheduled.\n\nTime: ${time}\n\nMessage: "${message}"`
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [replyEmbed],
        ephemeral: false,
      });

      // Store reminder details in database.
      const newReminder = new OneTimeReminder({
        authorId: interaction.user.id,
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        createdAt: new Date(),
        time: cronExpression,
        message: message,
      });

      newReminder
        .save()
        .then(() => {
          console.log('Reminder saved to MongoDB.');
          scheduleNewReminders(client);
        })
        .catch(error => {
          interaction.editReply('An error occured!');
          console.log('Database error:', error);
        });
    } catch (error) {
      console.log(error);
    }
  },
};

//////////// Functions ////////////

const isCronExpressionInvalid = async cronExpression => {
  // Check if the cron expression is invalid; if it is, respond with an error embed
  if (!cronExpression) {
    const embed = await new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Incorrect Format!')
      .setDescription('Please use one of the following formats for the time:')
      .addFields(
        { name: 'Minutes', value: 'x minutes', inline: true },
        { name: 'Hours', value: 'x hours', inline: true },
        { name: 'Days', value: 'x days', inline: true },
        { name: ' ', value: ' ' },
        { name: 'Weeks', value: 'For weeks just do days', inline: true },
        { name: 'Months', value: 'x months', inline: true },
        { name: "Years (Please don't ;0 )", value: 'x years', inline: true }
      )
      .addFields(
        {
          name: ' ',
          value: ' ',
        },
        {
          name: 'Specific Days of the Week',
          value:
            'You can also use specific days of the week like "Monday", "Tuesday", etc.',
        },
        {
          name: ' ',
          value: ' ',
        }
      )
      .setTimestamp();
    return embed;
  }
  return false;
};
