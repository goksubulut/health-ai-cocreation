/**
 * Rol bazlı erişim kontrolü (RBAC).
 * Kullanım: authorize('admin') veya authorize('engineer', 'healthcare')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Kimlik doğrulaması gerekli.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Bu işlem için yetkiniz bulunmuyor.',
      });
    }

    next();
  };
};

module.exports = authorize;
