const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts. Supports ?sort=trending|recent and ?status=
//          Available to any logged-in user (student or staff)
router.get('/', protect, async (req, res) => {
  try {
    const { sort = 'recent', status } = req.query;

    const match = {};
    if (status) match.status = status;

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments',
        },
      },
      {
        $addFields: {
          supportCount: { $size: '$supports' },
          disagreeCount: { $size: '$disagrees' },
          commentCount: { $size: '$comments' },
          score: { $subtract: [{ $size: '$supports' }, { $size: '$disagrees' }] },
        },
      },
      {
        $project: {
          comments: 0,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      {
        $project: {
          'author.password': 0,
        },
      },
    ];

    if (sort === 'trending') {
      pipeline.push({ $sort: { score: -1, commentCount: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    const posts = await Post.aggregate(pipeline);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts', error: err.message });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post with its author and comments populated
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role department')
      .populate('supports', 'name')
      .populate('disagrees', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });

    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch post', error: err.message });
  }
});

// @route   POST /api/posts
// @desc    Create a new complaint post (students only), optional image/video
router.post('/', protect, restrictTo('student'), upload.single('media'), async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const post = await Post.create({
      title,
      description,
      category: category || 'General',
      mediaUrl,
      mediaType,
      author: req.user._id,
    });

    const populated = await post.populate('author', 'name email role department');

    res.status(201).json({ post: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post. Allowed for the post's author or any staff member
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isStaff = req.user.role === 'staff';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post', error: err.message });
  }
});

// @route   PUT /api/posts/:id/support
// @desc    Toggle "support" vote for the current user on a post
router.put('/:id/support', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id.toString();
    const alreadySupported = post.supports.some((id) => id.toString() === userId);

    if (alreadySupported) {
      post.supports = post.supports.filter((id) => id.toString() !== userId);
    } else {
      post.supports.push(req.user._id);
      post.disagrees = post.disagrees.filter((id) => id.toString() !== userId);
    }

    await post.save();
    res.json({
      supportCount: post.supports.length,
      disagreeCount: post.disagrees.length,
      supported: !alreadySupported,
      disagreed: false,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update support', error: err.message });
  }
});

// @route   PUT /api/posts/:id/disagree
// @desc    Toggle "disagree" vote for the current user on a post
router.put('/:id/disagree', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id.toString();
    const alreadyDisagreed = post.disagrees.some((id) => id.toString() === userId);

    if (alreadyDisagreed) {
      post.disagrees = post.disagrees.filter((id) => id.toString() !== userId);
    } else {
      post.disagrees.push(req.user._id);
      post.supports = post.supports.filter((id) => id.toString() !== userId);
    }

    await post.save();
    res.json({
      supportCount: post.supports.length,
      disagreeCount: post.disagrees.length,
      supported: false,
      disagreed: !alreadyDisagreed,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update disagree', error: err.message });
  }
});

// @route   PUT /api/posts/:id/status
// @desc    Update a complaint's status (staff only)
router.put('/:id/status', protect, restrictTo('staff'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const post = await Post.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

module.exports = router;
