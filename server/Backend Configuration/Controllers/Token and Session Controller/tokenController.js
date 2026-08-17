const refreshAccessToken = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Refresh Token API not implemented yet.",
  });
};

const logoutUser = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Logout API not implemented yet.",
  });
};

const getMe = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Get Profile API not implemented yet.",
  });
};

module.exports = {
  refreshAccessToken,
  logoutUser,
  getMe,
};