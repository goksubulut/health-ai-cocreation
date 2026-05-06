const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const ctrl = require('../controllers/bookmarkController');

router.use(authenticate);

router.get('/',                    ctrl.getBookmarks);
router.post('/',                   ctrl.addBookmark);
router.delete('/:postId',          ctrl.removeBookmark);
router.get('/status/:postId',      ctrl.getBookmarkStatus);

module.exports = router;
