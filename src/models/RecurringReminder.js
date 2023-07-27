const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

const recurringReminderSchema = new Schema(
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
  },
  { timestamps: true }
);

module.exports = model('RecurringReminder', recurringReminderSchema);
