const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require('discord.js');
const isCronExpressionInvalid = require('../../utils/isCronExpressionInvalid');
const convertHumanInpuToCron = require('../../utils/convertHumanInpuToCron');

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
    const cronExpression = await convertHumanInpuToCron;

    try {
      isCronExpressionInvalid();
    } catch (error) {
      console.log(error);
    }
  },
};
