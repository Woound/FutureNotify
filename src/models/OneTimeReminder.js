const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

const oneTimeReminderSchema = new Schema(
  {
    reminderId: {
      type: String,
      default: randomUUID,
    },
    authorId: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      // "pending", "scheduled", "done", "cancelled",
      default: 'pending',
    },
    createdAt: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = model('OneTimeReminder', oneTimeReminderSchema);
