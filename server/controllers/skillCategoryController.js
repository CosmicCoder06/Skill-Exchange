const SkillCategory = require("../models/SkillCategory");
const { recordActivity } = require("../Utils/activityLogger");

const listCategories = async (req, res) => {
  const query = req.user?.role === "admin" && req.query.includeInactive === "true" ? {} : { isActive: true };
  const categories = await SkillCategory.find(query).sort({ name: 1 });
  return res.json({ categories });
};

const createCategory = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ message: "Category name is required" });
  try {
    const category = await SkillCategory.create({ name, description: req.body?.description || "" });
    recordActivity({ actor: req.user.id, action: "skill_category.created", entityType: "SkillCategory", entityId: category._id });
    return res.status(201).json({ category });
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "A category with this name already exists" : "Invalid category data" });
  }
};

const updateCategory = async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
  if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
  if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
  try {
    const category = await SkillCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    recordActivity({ actor: req.user.id, action: "skill_category.updated", entityType: "SkillCategory", entityId: category._id });
    return res.json({ category });
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : 400).json({ message: "Unable to update category" });
  }
};

module.exports = { listCategories, createCategory, updateCategory };
