module.exports = {
  name: 'reminders-list',
  description: 'Lists your active reminders',
  callback: async (client, interaction) => {
    const memberId = interaction.user.id;
    try {
    } catch (error) {
      console.log('Error retrieving user reminder details: ', error);
    }
  },
};
