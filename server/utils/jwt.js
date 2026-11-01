const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'smart_library_secret_key_2026',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = {
  generateToken,
};

