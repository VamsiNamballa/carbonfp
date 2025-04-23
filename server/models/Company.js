import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  approved: { type: Boolean, default: false },
  
  // 💡 This reflects net available credits after trades
  credits: { type: Number, default: 0 }
  
}, { timestamps: true }); // ✅ Add timestamps for future tracking (createdAt, updatedAt)

export default mongoose.model("Company", companySchema);
