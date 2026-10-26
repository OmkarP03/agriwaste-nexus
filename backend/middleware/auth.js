const jwt = require('jsonwebtoken');

/**
 * Every protected route goes through requireAuth, which reads the bearer
 * token and puts the caller's own id on the request. Routes then compare
 * that id to whatever they are about to touch — the id in the URL is
 * never trusted on its own.
 */

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set — refusing to sign or verify tokens.');
  }
  return secret;
}

function signToken(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role },
    getSecret(),
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please sign in to continue.',
    });
  }

  try {
    const payload = jwt.verify(token, getSecret());

    // Password-reset tokens must never work as session tokens
    if (payload.purpose) {
      return res.status(401).json({ success: false, message: 'Invalid session token.' });
    }

    req.userId = String(payload.id);
    req.userRole = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please sign in again.',
    });
  }
}

/** Optional auth: sets req.userId when a valid token is present, never blocks. */
function attachUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (token) {
    try {
      const payload = jwt.verify(token, getSecret());
      if (!payload.purpose) {
        req.userId = String(payload.id);
        req.userRole = payload.role;
      }
    } catch { /* ignore — this route works signed out too */ }
  }
  next();
}

/**
 * The :param in the URL must be the caller's own id.
 * Admins are allowed through, since the admin dashboard reads across accounts.
 */
function requireSelf(param = 'userId') {
  return (req, res, next) => {
    if (req.userRole === 'admin') return next();

    if (String(req.params[param]) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own data.',
      });
    }
    next();
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to do that.',
      });
    }
    next();
  };
}

/** Loads a document and checks the caller owns it (via `ownerField`). */
function requireOwnership(Model, ownerField = 'userId') {
  return async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Not found.' });
      }
      if (req.userRole !== 'admin' && String(doc[ownerField]) !== String(req.userId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only change your own records.',
        });
      }
      req.doc = doc;
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

module.exports = {
  signToken,
  requireAuth,
  attachUser,
  requireSelf,
  requireRole,
  requireOwnership,
};
