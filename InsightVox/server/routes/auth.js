const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
});

// @route   POST /api/auth/signup
// @desc    Register a new student or staff account
//          Staff accounts require a valid STAFF_SIGNUP_CODE
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, department, staffCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const finalRole = role === 'staff' ? 'staff' : 'student';

    if (finalRole === 'staff') {
      if (!staffCode || staffCode !== process.env.STAFF_SIGNUP_CODE) {
        return res.status(403).json({ message: 'Invalid staff access code' });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      department: department || '',
    });

    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error during signup', error: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Log in and receive a JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get the currently logged-in user
router.get('/me', protect, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;
