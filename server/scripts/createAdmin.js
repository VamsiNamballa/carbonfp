import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hashed = await bcrypt.hash("admin123", 10);

    await User.create({
      username: "admin",
      password: hashed,
      role: "admin",
      status: "approved",
    });

    console.log("✅ Admin created");
    process.exit();
  } catch (err) {
    console.error("❌ Admin creation failed:", err.message);
    process.exit(1);
  }
}

createAdmin();
