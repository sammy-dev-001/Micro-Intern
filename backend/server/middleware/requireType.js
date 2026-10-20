function requireType(...allowedTypes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
    }

    if (!allowedTypes.includes(req.user.type)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires user type: ${allowedTypes.join(' or ')}. Your account is '${req.user.type}'.`
      });
    }

    next();
  };
}

module.exports = requireType;
