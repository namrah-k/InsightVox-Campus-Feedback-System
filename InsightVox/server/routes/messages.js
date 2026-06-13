const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Staff only: list every student who has an active chat thread,
//          with their most recent message
router.get('/conversations', protect, restrictTo('staff'), async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$student',
          lastMessage: { $first: '$text' },
          lastImage: { $first: '$image' },
          lastSenderRole: { $first: '$senderRole' },
          lastAt: { $first: '$createdAt' },
        },
      },
      { $sort: { lastAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: '$_id',
          _id: 0,
          name: '$student.name',
          email: '$student.email',
          lastMessage: 1,
          lastImage: 1,
          lastSenderRole: 1,
          lastAt: 1,
        },
      },
    ]);

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
  }
});

// @route   GET /api/messages/:studentId
// @desc    Get the full chat thread for a student.
//          Students can only fetch their own thread; staff can fetch any.
router.get('/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'You can only view your own conversation' });
    }

    if (req.user.role === 'student') {
      const messages = await Message.find({ student: studentId }).sort({ createdAt: 1 });
      return res.json({ messages });
    }

    // staff: confirm the target user is actually a student
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const messages = await Message.find({ student: studentId }).sort({ createdAt: 1 });
    res.json({ messages, student: { id: student._id, name: student.name, email: student.email } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
});

// @route   POST /api/messages
// @desc    Send a message.
//          Students send to "the staff team" (no studentId needed).
//          Staff must include { studentId } to specify which thread to reply in.
router.post('/', protect, async (req, res) => {
  try {
    const { text, image } = req.body;
    let { studentId } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: 'Message must contain text or an image' });
    }

    if (req.user.role === 'student') {
      studentId = req.user._id;
    } else {
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: 'studentId is required for staff replies' });
      }
      const student = await User.findOne({ _id: studentId, role: 'student' });
      if (!student) return res.status(404).json({ message: 'Student not found' });
    }

    const message = await Message.create({
      student: studentId,
      sender: req.user._id,
      senderRole: req.user.role,
      text: text || '',
      image: image || null,
    });

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
});

module.exports = router;
