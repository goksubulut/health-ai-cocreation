const Joi = require('joi');

const PROJECT_STAGES = ['idea', 'concept_validation', 'prototype', 'pilot', 'pre_deployment'];
const COMMITMENT_LEVELS = ['advisor', 'co_founder', 'research_partner'];

const createPostSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  domain: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(50).max(5000).required(),
  required_expertise: Joi.string().max(255).optional().allow('', null),
  project_stage: Joi.string()
    .valid(...PROJECT_STAGES)
    .optional()
    .allow(null),
  commitment_level: Joi.string()
    .valid(...COMMITMENT_LEVELS)
    .optional()
    .allow(null),
  confidentiality: Joi.string().valid('public', 'meeting_only').default('public'),
  status: Joi.string().valid('draft', 'active').default('draft'),
  city: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  expiry_date: Joi.date().iso().greater('now').optional().allow(null).messages({
    'date.greater': 'expiry_date must be in the future.',
  }),
  auto_close: Joi.boolean().optional(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  domain: Joi.string().min(1).max(100).optional(),
  description: Joi.string().min(50).max(5000).optional(),
  required_expertise: Joi.string().max(255).optional().allow('', null),
  project_stage: Joi.string()
    .valid(...PROJECT_STAGES)
    .optional()
    .allow(null),
  commitment_level: Joi.string()
    .valid(...COMMITMENT_LEVELS)
    .optional()
    .allow(null),
  confidentiality: Joi.string().valid('public', 'meeting_only').optional(),
  city: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  expiry_date: Joi.date().iso().greater('now').optional().allow(null).messages({
    'date.greater': 'expiry_date must be in the future.',
  }),
  auto_close: Joi.boolean().optional(),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'active', 'partner_found').required(),
});

module.exports = { createPostSchema, updatePostSchema, updateStatusSchema };
