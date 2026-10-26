const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../Backend Configuration/Configuration Folders/DB Configuration/dbConfig");
const User = require("../Backend Configuration/Models/UserSchema/user");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const ActivityLog = require("../models/ActivityLog");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

async function cleanupTestdomainUsers() {
  const isConfirm = process.argv.includes("--confirm");

  console.log("=== Skill Exchange: Testdomain Users Cleanup Script ===");
  console.log(`Mode: ${isConfirm ? "LIVE EXECUTION (--confirm provided)" : "DRY RUN (safe inspection only)"}`);

  await connectDB();

  // Find all users ending with @testdomain.com (case-insensitive)
  const testUsers = await User.find({ email: /@testdomain\.com$/i }).select("_id name email role createdAt");

  console.log(`\nFound ${testUsers.length} user(s) matching @testdomain.com:`);
  testUsers.forEach((u, idx) => {
    console.log(`  [${idx + 1}] ID: ${u._id} | Name: "${u.name}" | Email: "${u.email}" | Role: ${u.role} | Created: ${u.createdAt}`);
  });

  if (testUsers.length === 0) {
    console.log("\nNo @testdomain.com users found in database.");
    return;
  }

  const userIds = testUsers.map((u) => u._id);

  // Find associated records
  const bookingsCount = await Booking.countDocuments({
    $or: [{ learner: { $in: userIds } }, { mentor: { $in: userIds } }],
  });

  const reviewsCount = await Review.countDocuments({
    $or: [{ reviewer: { $in: userIds } }, { reviewee: { $in: userIds } }],
  });

  const activityCount = await ActivityLog.countDocuments({
    user: { $in: userIds },
  });

  const walletCount = await Wallet.countDocuments({
    user: { $in: userIds },
  });

  const walletTxCount = await WalletTransaction.countDocuments({
    user: { $in: userIds },
  });

  console.log("\nAssociated records summary:");
  console.log(`  - Bookings: ${bookingsCount}`);
  console.log(`  - Reviews: ${reviewsCount}`);
  console.log(`  - Activity Logs: ${activityCount}`);
  console.log(`  - Wallets: ${walletCount}`);
  console.log(`  - Wallet Transactions: ${walletTxCount}`);

  if (!isConfirm) {
    console.log("\n>>> [DRY RUN COMPLETE] <<<");
    console.log("No data was modified or deleted.");
    console.log("To permanently delete these records, run:");
    console.log("  node server/scripts/cleanupTestdomainUsers.js --confirm");
    return;
  }

  // If confirmed, proceed with deletion
  console.log("\n[CONFIRM RECEIVED] Deleting associated records and test users...");

  const delBookings = await Booking.deleteMany({
    $or: [{ learner: { $in: userIds } }, { mentor: { $in: userIds } }],
  });
  console.log(`  Deleted ${delBookings.deletedCount} booking(s).`);

  const delReviews = await Review.deleteMany({
    $or: [{ reviewer: { $in: userIds } }, { reviewee: { $in: userIds } }],
  });
  console.log(`  Deleted ${delReviews.deletedCount} review(s).`);

  const delActivity = await ActivityLog.deleteMany({
    user: { $in: userIds },
  });
  console.log(`  Deleted ${delActivity.deletedCount} activity log(s).`);

  const delWallets = await Wallet.deleteMany({
    user: { $in: userIds },
  });
  console.log(`  Deleted ${delWallets.deletedCount} wallet(s).`);

  const delTx = await WalletTransaction.deleteMany({
    user: { $in: userIds },
  });
  console.log(`  Deleted ${delTx.deletedCount} wallet transaction(s).`);

  const delUsers = await User.deleteMany({
    _id: { $in: userIds },
  });
  console.log(`  Deleted ${delUsers.deletedCount} user(s).`);

  console.log("\n[SUCCESS] Cleanup completed.");
}

cleanupTestdomainUsers()
  .catch((err) => {
    console.error("Error during cleanup:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
