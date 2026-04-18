const { Op } = require('sequelize');
const { Post, User, MeetingRequest, NdaAcceptance, TimeSlot } = require('../models');
const { sequelize } = require('../config/database');
const { logActivity } = require('../services/logService');

const OWNER_ATTRIBUTES = ['id', 'firstName', 'lastName', 'institution', 'city', 'country'];

const isOwner = (post, userId) => post.userId === userId;

const serializeOwner = (owner) => {
  if (!owner) return undefined;
  const o = owner.get ? owner.get({ plain: true }) : owner;
  return {
    id: o.id,
    first_name: o.firstName,
    last_name: o.lastName,
    institution: o.institution,
    city: o.city,
    country: o.country,
  };
};

const serializePost = (postInstance, { descriptionOverride } = {}) => {
  const p = postInstance.get ? postInstance.get({ plain: true }) : postInstance;
  const desc =
    descriptionOverride !== undefined ? descriptionOverride : p.description;
  return {
    id: p.id,
    user_id: p.userId,
    title: p.title,
    domain: p.domain,
    description: desc,
    required_expertise: p.requiredExpertise,
    project_stage: p.projectStage,
    commitment_level: p.commitmentLevel,
    confidentiality: p.confidentiality,
    status: p.status,
    city: p.city,
    country: p.country,
    expiry_date: p.expiryDate,
    auto_close: p.autoClose,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    owner: p.owner ? serializeOwner(p.owner) : undefined,
  };
};

const mapCreateBodyToModel = (body) => ({
  title: body.title,
  domain: body.domain,
  description: body.description,
  requiredExpertise: body.required_expertise ?? null,
  projectStage: body.project_stage ?? null,
  commitmentLevel: body.commitment_level ?? null,
  confidentiality: body.confidentiality ?? 'public',
  status: body.status ?? 'draft',
  city: body.city ?? null,
  country: body.country ?? null,
  expiryDate: body.expiry_date ?? null,
  autoClose: body.auto_close ?? false,
});

const mapUpdateBodyToModel = (body) => {
  const out = {};
  if (body.title !== undefined) out.title = body.title;
  if (body.domain !== undefined) out.domain = body.domain;
  if (body.description !== undefined) out.description = body.description;
  if (body.required_expertise !== undefined) out.requiredExpertise = body.required_expertise;
  if (body.project_stage !== undefined) out.projectStage = body.project_stage;
  if (body.commitment_level !== undefined) out.commitmentLevel = body.commitment_level;
  if (body.confidentiality !== undefined) out.confidentiality = body.confidentiality;
  if (body.city !== undefined) out.city = body.city;
  if (body.country !== undefined) out.country = body.country;
  if (body.expiry_date !== undefined) out.expiryDate = body.expiry_date;
  if (body.auto_close !== undefined) out.autoClose = body.auto_close;
  return out;
};

const STATUS_TRANSITIONS = {
  draft: ['active'],
  active: ['partner_found', 'draft', 'meeting_scheduled'],
  meeting_scheduled: ['partner_found', 'active'],
};

const isValidStatusTransition = (from, to) =>
  STATUS_TRANSITIONS[from]?.includes(to) === true;

// ── GET /api/posts ─────────────────────────────────────────────
const getPosts = async (req, res) => {
  try {
    const {
      domain,
      city,
      country,
      stage,
      expertise,
      page = 1,
      limit = 10,
    } = req.query;

    const where = { status: { [Op.in]: ['active', 'meeting_scheduled'] } };

    if (domain) where.domain = { [Op.like]: `%${domain}%` };
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (country) where.country = { [Op.like]: `%${country}%` };
    if (stage) where.projectStage = stage;
    if (expertise) where.requiredExpertise = { [Op.like]: `%${expertise}%` };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: OWNER_ATTRIBUTES,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    const totalPages = Math.ceil(count / limitNum) || 0;

    return res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages,
      data: rows.map((row) => serializePost(row)),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── GET /api/posts/mine ────────────────────────────────────────
const getMyPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Post.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: OWNER_ATTRIBUTES,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    const totalPages = Math.ceil(count / limitNum) || 0;

    return res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages,
      data: rows.map((row) => serializePost(row)),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── GET /api/posts/matches ─────────────────────────────────────
const getMatches = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const currentUser = await User.findByPk(req.user.id, {
      attributes: ['city'],
    });

    if (!currentUser || !currentUser.city) {
      return res.json({
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        data: [],
        matchedOn: { city: null },
      });
    }

    const where = {
      status: { [Op.in]: ['active', 'meeting_scheduled'] },
      userId: { [Op.ne]: req.user.id },
      city: currentUser.city,
    };

    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: OWNER_ATTRIBUTES,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    const totalPages = Math.ceil(count / limitNum) || 0;

    return res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages,
      data: rows.map((row) => serializePost(row)),
      matchedOn: { city: currentUser.city },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── GET /api/posts/:id ─────────────────────────────────────────
const getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: OWNER_ATTRIBUTES,
        },
      ],
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.status === 'draft' && !isOwner(post, req.user.id)) {
      return res.status(403).json({ message: 'You do not have access to this post.' });
    }

    let descriptionOverride;
    const viewerIsOwner = isOwner(post, req.user.id);

    if (post.confidentiality === 'meeting_only' && !viewerIsOwner) {
      const accepted = await NdaAcceptance.findOne({
        where: { userId: req.user.id, postId: post.id },
      });
      if (!accepted) {
        descriptionOverride = 'This content requires NDA acceptance to view.';
      }
    }

    return res.json({
      data: serializePost(post, { descriptionOverride }),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── POST /api/posts ────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const payload = mapCreateBodyToModel(req.body);
    const post = await Post.create({
      ...payload,
      userId: req.user.id,
    });

    const withOwner = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: OWNER_ATTRIBUTES,
        },
      ],
    });

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'POST_CREATE',
      targetEntity: 'post',
      targetId: post.id,
      ip: req.ip,
    });

    return res.status(201).json({ data: serializePost(withOwner) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── PUT /api/posts/:id ─────────────────────────────────────────
const updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    if (!isOwner(post, req.user.id)) {
      return res.status(403).json({ message: 'You are not allowed to edit this post.' });
    }

    if (['partner_found', 'expired'].includes(post.status)) {
      return res.status(400).json({ message: 'Posts in partner_found or expired status cannot be edited.' });
    }

    const updates = mapUpdateBodyToModel(req.body);
    
    if (req.body.status && req.body.status !== post.status) {
      if (!isValidStatusTransition(post.status, req.body.status)) {
        return res.status(400).json({ message: 'Invalid status transition.' });
      }
      updates.status = req.body.status;
    }

    await post.update(updates);

    const refreshed = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: OWNER_ATTRIBUTES,
        },
      ],
    });

    return res.json({ data: serializePost(refreshed) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── PATCH /api/posts/:id/status ───────────────────────────────
const updatePostStatus = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    if (!isOwner(post, req.user.id)) {
      return res.status(403).json({ message: 'You are not allowed to change this post status.' });
    }

    const { status: nextStatus } = req.body;

    if (!isValidStatusTransition(post.status, nextStatus)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }

    await post.update({ status: nextStatus });

    if (nextStatus === 'partner_found') {
      await logActivity({
        userId: req.user.id,
        role: req.user.role,
        actionType: 'POST_CLOSE',
        targetEntity: 'post',
        targetId: post.id,
        ip: req.ip,
      });
    }

    const refreshed = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: OWNER_ATTRIBUTES,
        },
      ],
    });

    return res.json({ data: serializePost(refreshed) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── DELETE /api/posts/:id — req.postToDelete set by authorizeDeletePost
const deletePost = async (req, res) => {
  try {
    const post = req.postToDelete;

    await sequelize.transaction(async (t) => {
      const meetingRows = await MeetingRequest.findAll({
        where: { postId: post.id },
        attributes: ['id'],
        transaction: t,
      });
      const meetingIds = meetingRows.map((m) => m.id);
      if (meetingIds.length) {
        await TimeSlot.destroy({
          where: { meetingRequestId: { [Op.in]: meetingIds } },
          transaction: t,
        });
      }
      await NdaAcceptance.destroy({ where: { postId: post.id }, transaction: t });
      await MeetingRequest.destroy({ where: { postId: post.id }, transaction: t });
      await post.destroy({ transaction: t });
    });

    return res.json({ message: 'Post deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getPosts,
  getMyPosts,
  getMatches,
  getPostById,
  createPost,
  updatePost,
  updatePostStatus,
  deletePost,
};
