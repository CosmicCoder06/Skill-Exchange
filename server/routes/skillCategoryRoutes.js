const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const authorize = require("../Backend Configuration/Configuration Folders/Middleware Configuration/roleSpecificMiddleware");
const { listCategories, createCategory, updateCategory } = require("../controllers/skillCategoryController");
const router = express.Router();
router.get("/skill-categories", verifyToken, listCategories);
router.post("/skill-categories", verifyToken, authorize("admin"), createCategory);
router.patch("/skill-categories/:id", verifyToken, authorize("admin"), updateCategory);
module.exports = router;
