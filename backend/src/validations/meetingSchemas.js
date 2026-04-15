const Joi = require('joi');

const createMeetingRequestSchema = Joi.object({
  postId: Joi.number().integer().positive().required(),
  message: Joi.string().max(1000).optional().allow('', null),
  ndaAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Toplantı talebinde bulunmak için NDA\'yı kabul etmelisiniz.',
  }),
});

const proposeTimeSchema = Joi.object({
  proposedTime: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Önerilen zaman gelecekte bir tarih/saat olmalıdır.',
  }),
});

const confirmTimeSchema = Joi.object({
  confirmedSlot: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Onaylanan zaman gelecekte bir tarih/saat olmalıdır.',
  }),
});

module.exports = { createMeetingRequestSchema, proposeTimeSchema, confirmTimeSchema };
