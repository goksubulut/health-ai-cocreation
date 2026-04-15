const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticate = require('../middleware/authenticate');
const authorizeDeletePost = require('../middleware/authorizeDeletePost');
const validate = require('../middleware/validate');
const { createPostSchema, updatePostSchema, updateStatusSchema } = require('../validations/postSchemas');

// Tüm post route'ları kimlik doğrulaması gerektirir
router.use(authenticate);

// GET /api/posts/mine   — Kendi postlarım (/:id'den önce tanımlanmalı)
router.get('/mine', postController.getMyPosts);

// GET /api/posts/matches — Şehir/alan bazlı eşleşmeler
router.get('/matches', postController.getMatches);

// GET /api/posts         — Filtreli liste
router.get('/', postController.getPosts);

// GET /api/posts/:id     — Detay
router.get('/:id', postController.getPostById);

// POST /api/posts        — Yeni ilan
router.post('/', validate(createPostSchema), postController.createPost);

// PUT /api/posts/:id     — Güncelle
router.put('/:id', validate(updatePostSchema), postController.updatePost);

// PATCH /api/posts/:id/status — Durum değiştir
router.patch('/:id/status', validate(updateStatusSchema), postController.updatePostStatus);

// DELETE /api/posts/:id  — Sil (sahip veya admin; authorizeDeletePost)
router.delete('/:id', authorizeDeletePost, postController.deletePost);

module.exports = router;
