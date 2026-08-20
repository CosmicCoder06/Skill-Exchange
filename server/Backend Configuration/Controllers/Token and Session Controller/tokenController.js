const jwt = require("jsonwebtoken");
const User = require("../../Models/UserSchema/user");
const { generateAccessToken, generateRefreshToken } = require("../../../../Utils/generateToken");

const refreshCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 };
const clearRefreshCookie = (res) => res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token is required" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken || user.isActive === false) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Refresh token is invalid" });
    }
    const nextRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = nextRefreshToken;
    await user.save();
    res.cookie("refreshToken", nextRefreshToken, refreshCookieOptions);
    return res.json({ accessToken: generateAccessToken(user._id, user.role), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Refresh token is invalid or expired" });
  }
};

const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  clearRefreshCookie(res);
  return res.status(204).send();
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -refreshToken");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
};

module.exports = {
  refreshAccessToken,
  logoutUser,
  getMe,
};
// @teamcosmiccoders
