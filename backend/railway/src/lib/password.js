const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };