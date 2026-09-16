const mongoose = require("mongoose");
const skillCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 60 },
  description: { type: String, default: "", trim: true, maxlength: 240 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.models.SkillCategory || mongoose.model("SkillCategory", skillCategorySchema);
