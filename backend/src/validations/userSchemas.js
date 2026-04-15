const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName:   Joi.string().min(2).max(100).optional(),
  lastName:    Joi.string().min(2).max(100).optional(),
  institution: Joi.string().max(255).optional().allow('', null),
  city:        Joi.string().max(100).optional().allow('', null),
  country:     Joi.string().max(100).optional().allow('', null),
  expertise:   Joi.string().max(255).optional().allow('', null),
}).min(1);

const deleteAccountSchema = Joi.object({
  password: Joi.string().required().messages({
    'any.required': 'Hesap silmek için şifrenizi girmelisiniz.',
  }),
});

module.exports = { updateProfileSchema, deleteAccountSchema };
