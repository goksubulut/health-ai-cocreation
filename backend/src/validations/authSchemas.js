const Joi = require('joi');

const eduEmailRule = Joi.string()
  .email({ tlds: { allow: false } })
  .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu(\.[a-z]{2})?$/i)
  .messages({
    'string.pattern.base': 'Sadece kurumsal .edu e-posta adresleri kabul edilir.',
  });

const registerSchema = Joi.object({
  email: eduEmailRule.required(),
  password: Joi.string()
    .min(5)
    .required()
    .messages({
      'string.min': 'Şifre en az 5 karakter olmalıdır.',
    }),
  role: Joi.string().valid('engineer', 'healthcare').required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  institution: Joi.string().max(255).optional(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  expertise: Joi.string().max(255).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(5)
    .required()
    .messages({
      'string.min': 'Şifre en az 5 karakter olmalıdır.',
    }),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
