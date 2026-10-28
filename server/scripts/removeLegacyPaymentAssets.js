/**
 * Legacy Payment Assets Cleanup Script
 * 
 * Target fields to unset:
 *   - Booking: payment.screenshot
 *   - User: paymentQr
 * 
 * Safety Rules:
 *   - DEFAULT MODE IS DRY RUN (Read-only, writes NOTHING).
 *   - Never deletes Booking or User documents.
 *   - Never modifies utr, paytmTxnRef, payoutRef, amounts, statuses, payout fields, or Razorpay IDs.
 *   - Write mode requires BOTH flags: --confirm --i-understand-this-is-irreversible
 */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  "mongodb://127.0.0.1:27017/skill_exchange";

async function run() {
  const args = process.argv.slice(2);
  const hasConfirm = args.includes("--confirm");
  const hasIrreversible = args.includes("--i-understand-this-is-irreversible");
  const isExecute = hasConfirm && hasIrreversible;

  console.log("===============================================================");
  console.log("   LEGACY PAYMENT ASSETS CLEANUP TOOL");
  console.log("===============================================================");
  console.log(`Mode: ${isExecute ? "EXECUTION (WRITE)" : "DRY RUN (READ-ONLY)"}`);
  console.log(`Target MongoDB: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")}`);
  console.log("Target Fields for Removal:");
  console.log("  • Booking.payment.screenshot");
  console.log("  • User.paymentQr");
  console.log("Protected Fields (Never modified):");
  console.log("  • payment.utr, payment.paytmTxnRef, payment.payoutRef");
  console.log("  • amounts, statuses, payout fields, Razorpay IDs");
  console.log("===============================================================\n");

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully.\n");

    const db = mongoose.connection.db;
    const bookingsCol = db.collection("bookings");
    const usersCol = db.collection("users");

    // 1. Scan Bookings for payment.screenshot
    const bookingQuery = {
      $or: [
        { "payment.screenshot": { $exists: true, $nin: ["", null] } },
        { screenshot: { $exists: true, $nin: ["", null] } }
      ]
    };

    const bookingsWithScreenshot = await bookingsCol
      .find(bookingQuery, { projection: { _id: 1, "payment.screenshot": 1, screenshot: 1, createdAt: 1 } })
      .toArray();

    let totalBookingScreenshotBytes = 0;
    const bookingDocSizes = [];

    for (const b of bookingsWithScreenshot) {
      const imgData = b.payment?.screenshot || b.screenshot || "";
      const bytes = Buffer.byteLength(String(imgData), "utf8");
      totalBookingScreenshotBytes += bytes;
      bookingDocSizes.push({
        id: b._id.toString(),
        type: "Booking (payment.screenshot)",
        bytes,
        sizeKB: (bytes / 1024).toFixed(2),
        sizeMB: (bytes / (1024 * 1024)).toFixed(3)
      });
    }

    // 2. Scan Users for paymentQr
    const userQuery = {
      paymentQr: { $exists: true, $nin: ["", null] }
    };

    const usersWithPaymentQr = await usersCol
      .find(userQuery, { projection: { _id: 1, name: 1, email: 1, paymentQr: 1 } })
      .toArray();

    let totalUserQrBytes = 0;
    const userDocSizes = [];

    for (const u of usersWithPaymentQr) {
      const qrData = u.paymentQr || "";
      const bytes = Buffer.byteLength(typeof qrData === "string" ? qrData : JSON.stringify(qrData), "utf8");
      totalUserQrBytes += bytes;
      userDocSizes.push({
        id: u._id.toString(),
        identifier: u.email || u.name || "User",
        type: "User (paymentQr)",
        bytes,
        sizeKB: (bytes / 1024).toFixed(2),
        sizeMB: (bytes / (1024 * 1024)).toFixed(3)
      });
    }

    const totalBytes = totalBookingScreenshotBytes + totalUserQrBytes;
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const bookingMB = (totalBookingScreenshotBytes / (1024 * 1024)).toFixed(2);
    const userMB = (totalUserQrBytes / (1024 * 1024)).toFixed(2);

    console.log("--- SCAN RESULTS ---");
    console.log(`• Bookings with payment screenshot : ${bookingsWithScreenshot.length}`);
    console.log(`  Screenshot data size             : ${bookingMB} MB (${totalBookingScreenshotBytes.toLocaleString()} bytes)`);
    console.log(`• Users with paymentQr             : ${usersWithPaymentQr.length}`);
    console.log(`  paymentQr data size              : ${userMB} MB (${totalUserQrBytes.toLocaleString()} bytes)`);
    console.log(`• TOTAL LEGACY ASSET SIZE          : ${totalMB} MB (${totalBytes.toLocaleString()} bytes)\n`);

    // Top 5 largest documents
    const allDocSizes = [...bookingDocSizes, ...userDocSizes].sort((a, b) => b.bytes - a.bytes);
    console.log("--- TOP 5 LARGEST DOCUMENTS ---");
    if (allDocSizes.length === 0) {
      console.log("  No documents containing legacy payment assets found.");
    } else {
      allDocSizes.slice(0, 5).forEach((d, idx) => {
        console.log(`  ${idx + 1}. [${d.type}] ID: ${d.id} - ${d.sizeKB} KB (${d.bytes.toLocaleString()} bytes)`);
      });
    }
    console.log("\n");

    if (!isExecute) {
      console.log("===============================================================");
      console.log("   DRY RUN COMPLETE — NO CHANGES APPLIED");
      console.log("===============================================================");
      console.log("To execute the removal and unset these fields in database, run:");
      console.log("node server/scripts/removeLegacyPaymentAssets.js --confirm --i-understand-this-is-irreversible\n");
      await mongoose.disconnect();
      return;
    }

    // EXECUTION PHASE
    console.log("===============================================================");
    console.log("   APPLYING DATABASE UNSET OPERATIONS...");
    console.log("===============================================================");
    console.log(`Unsetting 'payment.screenshot' on ${bookingsWithScreenshot.length} bookings...`);
    const bookingUpdateResult = await bookingsCol.updateMany(
      { "payment.screenshot": { $exists: true } },
      { $unset: { "payment.screenshot": "", screenshot: "" } }
    );
    console.log(`✓ Booking update result: matched ${bookingUpdateResult.matchedCount}, modified ${bookingUpdateResult.modifiedCount}`);

    console.log(`Unsetting 'paymentQr' on ${usersWithPaymentQr.length} users...`);
    const userUpdateResult = await usersCol.updateMany(
      { paymentQr: { $exists: true } },
      { $unset: { paymentQr: "" } }
    );
    console.log(`✓ User update result: matched ${userUpdateResult.matchedCount}, modified ${userUpdateResult.modifiedCount}\n`);

    // Verification check
    const remainingBookings = await bookingsCol.countDocuments(bookingQuery);
    const remainingUsers = await usersCol.countDocuments(userQuery);

    console.log("--- POST-CLEANUP VERIFICATION ---");
    console.log(`• Remaining bookings with screenshot : ${remainingBookings}`);
    console.log(`• Remaining users with paymentQr     : ${remainingUsers}`);
    if (remainingBookings === 0 && remainingUsers === 0) {
      console.log("✓ SUCCESS: All legacy payment assets successfully unset from database.");
    } else {
      console.warn("⚠ WARNING: Some fields may remain. Check database indexes or schema constraints.");
    }
    console.log("===============================================================\n");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Execution error:", err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

run();
