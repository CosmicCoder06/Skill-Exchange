const mongoose = require("mongoose");
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String, default: "", trim: true, maxlength: 240 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
module.exports = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
