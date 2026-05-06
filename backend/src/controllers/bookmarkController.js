const { Bookmark, Post, User } = require('../models');

// GET /api/bookmarks — kullanıcının kaydettiği ilanlar
exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Post,
        as: 'post',
        include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'institution'] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookmarks.map(b => b.post).filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/bookmarks { postId }
exports.addBookmark = async (req, res) => {
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ message: 'postId gerekli.' });
  try {
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: 'İlan bulunamadı.' });
    const [bookmark, created] = await Bookmark.findOrCreate({
      where: { userId: req.user.id, postId },
    });
    res.status(created ? 201 : 200).json({ bookmarked: true, id: bookmark.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/bookmarks/:postId
exports.removeBookmark = async (req, res) => {
  try {
    const deleted = await Bookmark.destroy({
      where: { userId: req.user.id, postId: req.params.postId },
    });
    if (!deleted) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
    res.json({ bookmarked: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/bookmarks/status/:postId — tek ilan için kayıt durumu
exports.getBookmarkStatus = async (req, res) => {
  try {
    const exists = await Bookmark.findOne({
      where: { userId: req.user.id, postId: req.params.postId },
    });
    res.json({ bookmarked: Boolean(exists) });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
