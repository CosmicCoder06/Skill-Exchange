const express = require("express");

const {
  registerUser,
} = require("../../../Controllers/Registration and Login Controller/Registration/registrationController");

const router = express.Router();

// POST /api/registration/api
router.post("/registration/api", registerUser);

module.exports = router;