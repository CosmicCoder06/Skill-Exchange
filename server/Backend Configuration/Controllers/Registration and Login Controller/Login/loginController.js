const User = require("../../../Models/UserSchema/user");

const {
  generateAccessToken,
  generateRefreshToken,
} = require('../../../../Utils/generateToken');

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Contact an administrator.',
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Login failed',
      error: error.message,
    });
  }
};

module.exports = {
  loginUser,
};
