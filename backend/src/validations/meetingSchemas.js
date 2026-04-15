const Joi = require('joi');

const createMeetingRequestSchema = Joi.object({
  post_id: Joi.number().integer().positive().required(),
  message: Joi.string().max(2000).optional().allow('', null),
  nda_accepted: Joi.boolean().optional(),
});

const proposeSlotsSchema = Joi.object({
  slots: Joi.array()
    .items(
      Joi.object({
        slot_datetime: Joi.date().iso().greater('now').required().messages({
          'date.greater': 'Each slot must be in the future.',
        }),
      })
    )
    .min(1)
    .max(5)
    .required(),
});

module.exports = { createMeetingRequestSchema, proposeSlotsSchema };
