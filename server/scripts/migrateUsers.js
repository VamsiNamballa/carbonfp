import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Company from "../models/Company.js";

// ✅ ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("MONGO_URI from env:", process.env.MONGO_URI);

const migrateUsers = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("❌ MONGO_URI is undefined. Check your .env file!");

    await mongoose.connect(uri);
    console.log("Connected to MongoDB ✅");

    const legacyUsers = await User.find({ company: { $exists: true } });

    for (let user of legacyUsers) {
      const company = await Company.findOne({ name: user.company });

      if (company) {
        user.companyId = company._id;
        user.company = undefined;
        await user.save();
        console.log(`✅ Migrated user ${user.username} to companyId ${company._id}`);
      } else {
        console.warn(`⚠️ Company "${user.company}" not found for user ${user.username}`);
      }
    }

    console.log("🎉 Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message || err);
    process.exit(1);
  }
};

migrateUsers();
