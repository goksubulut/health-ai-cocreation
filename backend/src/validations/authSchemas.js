const Joi = require('joi');

const EDU_EMAIL_BLOCKLIST = ['gmail.edu', 'yahoo.edu', 'hotmail.edu', 'outlook.edu'];

const isValidInstitutionalEduEmail = (email) => {
  const eduIntl = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu(\.[a-z]{2})?$/i;
  const eduTr = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.tr$/i;
  return eduIntl.test(email) || eduTr.test(email);
};

const eduEmailBlocklist = (value, helpers) => {
  const domain = value.split('@')[1]?.toLowerCase();
  if (domain && EDU_EMAIL_BLOCKLIST.includes(domain)) {
    return helpers.error('any.invalid');
  }
  if (!isValidInstitutionalEduEmail(value)) {
    return helpers.error('string.pattern.base');
  }
  return value;
};

const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .custom(eduEmailBlocklist)
    .messages({
      'any.invalid': 'This email domain is not allowed.',
      'string.pattern.base': 'Only institutional .edu or .edu.tr email addresses are accepted.',
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*[0-9])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long.',
      'string.pattern.base': 'Password must contain at least one uppercase letter and one digit.',
    }),
  role: Joi.string().valid('engineer', 'healthcare').required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  institution: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  expertise: Joi.string().max(255).optional().allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*[0-9])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long.',
      'string.pattern.base': 'Password must contain at least one uppercase letter and one digit.',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
