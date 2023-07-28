const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

const timeBasedReminderSchema = new Schema(
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
      // "pending", "ongoing", "cancelled",
      default: 'pending',
    },
    createdAt: {
      type: Date,
      required: true,
    },
    lastExecuted: {
      type: Date,
    },
    interval: {
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

module.exports = model('TimeBasedReminder', timeBasedReminderSchema);
