const mongoose = require("mongoose");
const activityLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  action: { type: String, required: true, trim: true, maxlength: 100 },
  entityType: { type: String, required: true, trim: true, maxlength: 50 },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
module.exports = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
