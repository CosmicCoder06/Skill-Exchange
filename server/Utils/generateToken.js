const jwt = require('jsonwebtoken');

// Short-lived access token — API calls ke liye
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

// Long-lived refresh token — naya access token lene ke liye
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
