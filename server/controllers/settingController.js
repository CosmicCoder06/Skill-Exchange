const Setting = require("../models/Setting");
const { recordActivity } = require("../Utils/activityLogger");

const listSettings = async (req, res) => res.json({ settings: await Setting.find().sort({ key: 1 }) });

const upsertSetting = async (req, res) => {
  const key = String(req.body?.key || "").trim();
  if (!key || req.body?.value === undefined) return res.status(400).json({ message: "key and value are required" });
  const setting = await Setting.findOneAndUpdate(
    { key },
    { value: req.body.value, description: String(req.body.description || "").trim(), updatedBy: req.user.id },
    { new: true, upsert: true, runValidators: true }
  );
  recordActivity({ actor: req.user.id, action: "setting.updated", entityType: "Setting", entityId: setting._id, metadata: { key } });
  return res.json({ setting });
};

module.exports = { listSettings, upsertSetting };
