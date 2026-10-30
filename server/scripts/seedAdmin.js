require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../Backend Configuration/Configuration Folders/DB Configuration/dbConfig");
const User = require("../Backend Configuration/Models/UserSchema/user");

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "Skill Exchange Admin" } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }
  if (ADMIN_PASSWORD.length < 6) {
    throw new Error("ADMIN_PASSWORD must contain at least 6 characters");
  }

  await connectDB();
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    existing.role = "admin";
    existing.isActive = true;
    existing.isVerified = true;
    await existing.save();
    console.log(`Promoted ${existing.email} to admin`);
  } else {
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      isActive: true,
      isVerified: true,
    });
    console.log(`Created admin ${admin.email}`);
  }
}

seedAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

// @teamcosmiccoders
