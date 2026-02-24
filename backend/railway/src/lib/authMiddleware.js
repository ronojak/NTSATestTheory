const { verifyToken } = require('./jwt');

async function requireAuth(req, res, next) {
  try {
    const authz = req.headers?.authorization;
    if (!authz || !authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const token = authz.substring('Bearer '.length);
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized', detail: e.message });
  }
}

async function requireAdmin(req, res, next) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!req.user?.email || !adminEmails.includes(req.user.email)) return res.status(403).json({ error: 'forbidden' });
  return next();
}

module.exports = { requireAuth, requireAdmin };