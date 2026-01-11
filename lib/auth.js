const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'gumusqr-secret-key';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const comparePassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const authenticate = (req) => {
  const token = getTokenFromHeader(req);
  if (!token) return null;
  return verifyToken(token);
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getTokenFromHeader,
  authenticate
};
