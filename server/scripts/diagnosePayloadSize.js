const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

async function diagnose() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const usersCol = db.collection("users");
  const bookingsCol = db.collection("bookings");

  console.log("Connected to MongoDB.");

  // Find tester1
  const users = await usersCol.find({
    $or: [
      { email: { $regex: /tester1/i } },
      { name: { $regex: /tester1/i } }
    ]
  }).toArray();

  console.log("Matching users for tester1:", users.map(u => ({ id: u._id.toString(), email: u.email, name: u.name, role: u.role })));

  if (users.length === 0) {
    const allUsers = await usersCol.find({}, { projection: { email: 1, name: 1, role: 1 } }).limit(10).toArray();
    console.log("Sample users in DB:", allUsers);
    await mongoose.disconnect();
    return;
  }

  const tester1 = users[0];
  const userId = tester1._id;

  // Run exact query as getBookings
  const Booking = require("../models/Booking");
  const User = require("../Backend Configuration/Models/UserSchema/user");

  const rawBookings = await Booking.find({
    $or: [{ learner: userId }, { mentor: userId }]
  })
    .select("-payment.screenshot -payment.logs")
    .populate("mentor learner", "name email role avatarUrl")
    .sort({ date: -1, time: -1, createdAt: -1 })
    .lean();

  console.log(`\nFound ${rawBookings.length} bookings for tester1 (${tester1.email}, id: ${userId})`);

  const fullJson = JSON.stringify(rawBookings);
  const totalBytes = Buffer.byteLength(fullJson, "utf8");
  console.log(`Total JSON response size: ${(totalBytes / 1024).toFixed(2)} KB (${(totalBytes / (1024 * 1024)).toFixed(2)} MB, ${totalBytes.toLocaleString()} bytes)`);

  // Measure per field across all bookings
  const fieldSizes = {};
  const dataImageFields = [];
  const userAvatarMap = new Map();

  function recordField(prefix, value) {
    if (value === undefined || value === null) return;
    const jsonStr = JSON.stringify(value);
    const bytes = Buffer.byteLength(jsonStr, "utf8");
    fieldSizes[prefix] = (fieldSizes[prefix] || 0) + bytes;

    if (typeof value === "string" && value.startsWith("data:image")) {
      dataImageFields.push({ field: prefix, bytes, preview: value.slice(0, 50) + "..." });
    }
  }

  for (let i = 0; i < rawBookings.length; i++) {
    const b = rawBookings[i];
    for (const [key, val] of Object.entries(b)) {
      if (key === "mentor" || key === "learner") {
        if (typeof val === "object" && val !== null) {
          for (const [subKey, subVal] of Object.entries(val)) {
            recordField(`${key}.${subKey}`, subVal);
            if (subKey === "avatarUrl" && subVal) {
              const uId = val._id?.toString() || val.email || "unknown";
              const arr = userAvatarMap.get(uId) || { email: val.email, name: val.name, count: 0, bytes: Buffer.byteLength(String(subVal), "utf8") };
              arr.count += 1;
              userAvatarMap.set(uId, arr);
            }
          }
        } else {
          recordField(key, val);
        }
      } else if (key === "payment" && typeof val === "object" && val !== null) {
        for (const [pKey, pVal] of Object.entries(val)) {
          recordField(`payment.${pKey}`, pVal);
        }
      } else {
        recordField(key, val);
      }
    }
  }

  // Sort fields by total size
  const sortedFields = Object.entries(fieldSizes).sort((a, b) => b[1] - a[1]);

  console.log("\n--- TOP 10 LARGEST FIELDS IN BOOKINGS RESPONSE ---");
  sortedFields.slice(0, 15).forEach(([f, bytes], idx) => {
    const kb = (bytes / 1024).toFixed(2);
    const mb = (bytes / (1024 * 1024)).toFixed(3);
    const pct = ((bytes / totalBytes) * 100).toFixed(1);
    console.log(`  ${idx + 1}. ${f.padEnd(25)}: ${mb} MB (${kb} KB, ${bytes.toLocaleString()} B) -> ${pct}% of total payload`);
  });

  console.log("\n--- REPEATED USER AVATAR ANALYSIS ---");
  let totalAvatarBytesInPayload = 0;
  let uniqueAvatarBytes = 0;
  for (const [uId, info] of userAvatarMap.entries()) {
    const userTotalBytesInPayload = info.bytes * info.count;
    totalAvatarBytesInPayload += userTotalBytesInPayload;
    uniqueAvatarBytes += info.bytes;
    console.log(`  User: ${info.email || info.name} (${uId})`);
    console.log(`    Single Avatar Size : ${(info.bytes / 1024).toFixed(2)} KB (${info.bytes.toLocaleString()} bytes)`);
    console.log(`    Occurrences        : ${info.count} times in ${rawBookings.length} bookings`);
    console.log(`    Total Payload Share: ${(userTotalBytesInPayload / 1024).toFixed(2)} KB (${(userTotalBytesInPayload / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`    Redundant Duplicate: ${((userTotalBytesInPayload - info.bytes) / 1024).toFixed(2)} KB duplicate bytes`);
  }

  const redundantBytes = totalAvatarBytesInPayload - uniqueAvatarBytes;
  console.log(`\nTotal Avatar data in response: ${(totalAvatarBytesInPayload / (1024 * 1024)).toFixed(2)} MB (${totalAvatarBytesInPayload.toLocaleString()} bytes)`);
  console.log(`Unique Avatar bytes          : ${(uniqueAvatarBytes / (1024 * 1024)).toFixed(2)} MB (${uniqueAvatarBytes.toLocaleString()} bytes)`);
  console.log(`REPEATED/DUPLICATE bytes     : ${(redundantBytes / (1024 * 1024)).toFixed(2)} MB (${redundantBytes.toLocaleString()} bytes, ${((redundantBytes / totalBytes) * 100).toFixed(1)}% of total response)`);

  // Also check /profile/me size for tester1
  console.log("\n--- /profile/me SIZE FOR tester1 ---");
  const fullUserProfile = await User.findById(userId).lean();
  const profileJson = JSON.stringify({ success: true, profile: fullUserProfile });
  const profileBytes = Buffer.byteLength(profileJson, "utf8");
  console.log(`Current /profile/me JSON size: ${(profileBytes / 1024).toFixed(2)} KB (${profileBytes.toLocaleString()} bytes)`);
  if (fullUserProfile.avatarUrl) {
    const avBytes = Buffer.byteLength(String(fullUserProfile.avatarUrl), "utf8");
    console.log(`  avatarUrl alone            : ${(avBytes / 1024).toFixed(2)} KB (${((avBytes / profileBytes) * 100).toFixed(1)}% of /profile/me)`);
  }
  if (fullUserProfile.coverImageUrl) {
    const covBytes = Buffer.byteLength(String(fullUserProfile.coverImageUrl), "utf8");
    console.log(`  coverImageUrl alone        : ${(covBytes / 1024).toFixed(2)} KB (${((covBytes / profileBytes) * 100).toFixed(1)}% of /profile/me)`);
  }

  await mongoose.disconnect();
}

diagnose().catch(err => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
