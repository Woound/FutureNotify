module.exports = async cronExpression => {
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
          name: 'Custom Time',
          value:
            'For example, if you want the reminder to trigger after 3 hours and 15 minutes from the time you set it, you can input the value as minutes: "195 minutes"',
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
