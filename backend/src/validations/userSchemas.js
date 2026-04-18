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

const newPasswordRules = Joi.string()
  .min(8)
  .pattern(/^(?=.*[A-Z])(?=.*[0-9])/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long.',
    'string.pattern.base': 'Password must contain at least one uppercase letter and one digit.',
    'any.required': 'New password is required.',
  });

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required.',
  }),
  newPassword: newPasswordRules,
}).custom((value, helpers) => {
  if (value.newPassword === value.currentPassword) {
    return helpers.message('New password must be different from your current password.');
  }
  return value;
});

module.exports = { updateProfileSchema, deleteAccountSchema, changePasswordSchema };
