/**
 * Joi şema doğrulama middleware'i.
 * Kullanım: validate(myJoiSchema)
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // Tüm hataları topla
      stripUnknown: true,  // Bilinmeyen alanları temizle
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ message: 'Doğrulama hatası.', errors: messages });
    }

    req.body = value; // Temizlenmiş değerleri kullan
    next();
  };
};

module.exports = validate;
