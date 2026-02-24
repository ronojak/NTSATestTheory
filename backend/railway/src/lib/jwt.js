const jwt = require('jsonwebtoken');

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name || null },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };