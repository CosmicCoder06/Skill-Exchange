const express = require("express");

const {
    loginUser
} = require("../../../Controllers/Registration and Login Controller/Login/loginController");

const router = express.Router();

router.post("/loginRoute/api", loginUser);

module.exports = router;