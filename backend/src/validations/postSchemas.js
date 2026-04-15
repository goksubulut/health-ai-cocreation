const Joi = require('joi');

const createPostSchema = Joi.object({
  title: Joi.string().min(5).max(255).required().messages({
    'string.min': 'Başlık en az 5 karakter olmalıdır.',
  }),
  domain: Joi.string().max(100).required(),
  description: Joi.string().min(20).max(5000).required().messages({
    'string.min': 'Açıklama en az 20 karakter olmalıdır.',
  }),
  requiredExpertise: Joi.string().max(255).optional().allow('', null),
  projectStage: Joi.string()
    .valid('idea', 'concept_validation', 'prototype', 'pilot', 'pre_deployment')
    .optional()
    .allow(null),
  commitmentLevel: Joi.string()
    .valid('advisor', 'co_founder', 'research_partner')
    .optional()
    .allow(null),
  confidentiality: Joi.string().valid('public', 'meeting_only').default('public'),
  city: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  expiryDate: Joi.date().iso().greater('now').optional().allow(null).messages({
    'date.greater': 'Son geçerlilik tarihi gelecekte bir tarih olmalıdır.',
  }),
  autoClose: Joi.boolean().default(false),
  status: Joi.string().valid('draft', 'active').default('draft'),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  domain: Joi.string().max(100).optional(),
  description: Joi.string().min(20).max(5000).optional(),
  requiredExpertise: Joi.string().max(255).optional().allow('', null),
  projectStage: Joi.string()
    .valid('idea', 'concept_validation', 'prototype', 'pilot', 'pre_deployment')
    .optional()
    .allow(null),
  commitmentLevel: Joi.string()
    .valid('advisor', 'co_founder', 'research_partner')
    .optional()
    .allow(null),
  confidentiality: Joi.string().valid('public', 'meeting_only').optional(),
  city: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  expiryDate: Joi.date().iso().greater('now').optional().allow(null),
  autoClose: Joi.boolean().optional(),
}).min(1); // En az bir alan güncellenmeli

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'active', 'meeting_scheduled', 'partner_found', 'expired')
    .required(),
});

module.exports = { createPostSchema, updatePostSchema, updateStatusSchema };
