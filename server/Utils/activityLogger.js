const ActivityLog = require("../models/ActivityLog");
const recordActivity = ({ actor, action, entityType, entityId = null, metadata = {} }) =>
  ActivityLog.create({ actor, action, entityType, entityId, metadata })
    .catch((error) => console.error("Unable to record activity:", error.message));
module.exports = { recordActivity };
