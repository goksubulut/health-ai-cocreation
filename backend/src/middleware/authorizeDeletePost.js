const authorize = require('./authorize');
const { Post } = require('../models');

/**
 * Post sahibi veya admin DELETE yetkisi.
 * Başarılı olursa req.postToDelete = Post instance.
 */
const authorizeDeletePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    if (post.userId === req.user.id) {
      req.postToDelete = post;
      return next();
    }
    return authorize('admin')(req, res, () => {
      req.postToDelete = post;
      next();
    });
  } catch (err) {
    next(err);
  }
};

module.exports = authorizeDeletePost;
