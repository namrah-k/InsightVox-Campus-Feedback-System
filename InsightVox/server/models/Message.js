const mongoose = require('mongoose');

// Every private conversation is anchored to a student (the "student" field).
// A student only ever has one thread with "the staff team" - any staff member
// can reply in it. This keeps the chat simple while still being 1:1 in spirit
// (one student <-> staff), matching the original chat.html / app.js design.
const messageSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'staff'],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ student: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
