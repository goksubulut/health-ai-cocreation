const { Op } = require('sequelize');
const { Post, User } = require('../models');
const { logActivity } = require('../services/logService');

// Sahip kontrolü için yardımcı
const isOwner = (post, userId) => post.userId === userId;

// ── GET /api/posts ─────────────────────────────────────────────
// Filtreler: domain, city, country, stage, status, expertise, page, limit
const getPosts = async (req, res) => {
  try {
    const {
      domain, city, country, stage, status,
      expertise, page = 1, limit = 12,
    } = req.query;

    const where = {};

    // Kendi draft'larını görebilir, diğerlerinin sadece active olanları
    if (status) {
      where.status = status;
      // Draft'lar sadece kendi postlarında gösterilebilir
      if (status === 'draft') {
        where.userId = req.user.id;
      }
    } else {
      // Varsayılan: active olanlar + kendi tüm postları
      where[Op.or] = [
        { status: 'active' },
        { userId: req.user.id },
      ];
    }

    if (domain)    where.domain = { [Op.like]: `%${domain}%` };
    if (city)      where.city = { [Op.like]: `%${city}%` };
    if (country)   where.country = { [Op.like]: `%${country}%` };
    if (stage)     where.projectStage = stage;
    if (expertise) where.requiredExpertise = { [Op.like]: `%${expertise}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'institution', 'city', 'country'],
      }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit), 50), // Max 50 kayıt
      offset,
    });

    return res.json({
      posts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('getPosts hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/posts/mine ────────────────────────────────────────
const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ posts });
  } catch (err) {
    console.error('getMyPosts hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/posts/matches ─────────────────────────────────────
// Kullanıcının şehri/ülkesi ile eşleşen active postlar
const getMatches = async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.id, {
      attributes: ['city', 'country', 'role', 'expertise'],
    });

    const where = {
      status: 'active',
      userId: { [Op.ne]: req.user.id }, // Kendi postlarını gösterme
    };

    // Şehir veya ülke eşleşmesi
    if (currentUser.city || currentUser.country) {
      const locationCriteria = [];
      if (currentUser.city)    locationCriteria.push({ city: currentUser.city });
      if (currentUser.country) locationCriteria.push({ country: currentUser.country });
      where[Op.or] = locationCriteria;
    }

    const posts = await Post.findAll({
      where,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'institution', 'city', 'country'],
      }],
      order: [
        // Şehir eşleşmesi önce gelsin (MySQL CASE ile)
        [require('sequelize').literal(
          `CASE WHEN city = ${currentUser.city ? `'${currentUser.city}'` : 'NULL'} THEN 0 ELSE 1 END`
        ), 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit: 20,
    });

    return res.json({ posts, matchedOn: { city: currentUser.city, country: currentUser.country } });
  } catch (err) {
    console.error('getMatches hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/posts/:id ─────────────────────────────────────────
const getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'institution', 'city', 'country'],
      }],
    });

    if (!post) return res.status(404).json({ message: 'İlan bulunamadı.' });

    // Draft postları sadece sahibi görebilir
    if (post.status === 'draft' && !isOwner(post, req.user.id)) {
      return res.status(403).json({ message: 'Bu ilana erişim yetkiniz yok.' });
    }

    return res.json({ post });
  } catch (err) {
    console.error('getPostById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── POST /api/posts ────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const post = await Post.create({ ...req.body, userId: req.user.id });

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'POST_CREATE',
      targetEntity: 'post',
      targetId: post.id,
      ip: req.ip,
    });

    return res.status(201).json({ message: 'İlan başarıyla oluşturuldu.', post });
  } catch (err) {
    console.error('createPost hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PUT /api/posts/:id ─────────────────────────────────────────
const updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'İlan bulunamadı.' });
    if (!isOwner(post, req.user.id)) {
      return res.status(403).json({ message: 'Bu ilanı düzenleme yetkiniz yok.' });
    }

    // Kapalı veya süresi dolmuş ilanlar düzenlenemez
    if (['partner_found', 'expired'].includes(post.status)) {
      return res.status(400).json({ message: 'Kapatılmış veya süresi dolmuş ilanlar düzenlenemez.' });
    }

    await post.update(req.body);
    return res.json({ message: 'İlan güncellendi.', post });
  } catch (err) {
    console.error('updatePost hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PATCH /api/posts/:id/status ────────────────────────────────
const updatePostStatus = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'İlan bulunamadı.' });
    if (!isOwner(post, req.user.id)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    }

    const { status } = req.body;

    // Geçerli durum geçişlerini kontrol et
    const validTransitions = {
      draft:             ['active'],
      active:            ['draft', 'partner_found', 'expired'],
      meeting_scheduled: ['active', 'partner_found'],
    };

    if (!validTransitions[post.status]?.includes(status)) {
      return res.status(400).json({
        message: `'${post.status}' durumundan '${status}' durumuna geçiş yapılamaz.`,
      });
    }

    await post.update({ status });

    if (status === 'partner_found') {
      await logActivity({
        userId: req.user.id,
        role: req.user.role,
        actionType: 'POST_CLOSE',
        targetEntity: 'post',
        targetId: post.id,
        ip: req.ip,
      });
    }

    return res.json({ message: 'İlan durumu güncellendi.', post });
  } catch (err) {
    console.error('updatePostStatus hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── DELETE /api/posts/:id ──────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'İlan bulunamadı.' });

    // Sadece sahip veya admin silebilir
    if (!isOwner(post, req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu ilanı silme yetkiniz yok.' });
    }

    await post.destroy();
    return res.json({ message: 'İlan silindi.' });
  } catch (err) {
    console.error('deletePost hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { getPosts, getMyPosts, getMatches, getPostById, createPost, updatePost, updatePostStatus, deletePost };
