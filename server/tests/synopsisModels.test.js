const test = require("node:test");
const assert = require("node:assert/strict");
const SkillCategory = require("../models/SkillCategory");
const ActivityLog = require("../models/ActivityLog");
const Setting = require("../models/Setting");

test("skill category requires a name", () => {
  const category = new SkillCategory({});
  const error = category.validateSync();
  assert.ok(error.errors.name);
});

test("activity log requires an action and an entity type", () => {
  const activity = new ActivityLog({});
  const error = activity.validateSync();
  assert.ok(error.errors.action);
  assert.ok(error.errors.entityType);
});

test("setting requires a key and value", () => {
  const setting = new Setting({});
  const error = setting.validateSync();
  assert.ok(error.errors.key);
  assert.ok(error.errors.value);
});
