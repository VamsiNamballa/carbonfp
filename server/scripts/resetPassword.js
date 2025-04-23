import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config(); // ✅ Loads default `.env` from root or current folder


const resetPassword = async (username, newPassword) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ username });

    if (!user) {
      console.log("❌ User not found");
      return process.exit(0);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    console.log(`✅ Password reset for ${username}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

// ✏️ Edit here:
resetPassword("admin1", "NewPassword@123");
