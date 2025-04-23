import mongoose from "mongoose";

const travelLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  distanceKm: {
    type: Number,
    required: true,
  },
  carbonCreditsEarned: {
    type: Number,
    required: true,
  },
  travelStyle: {
    type: String,
    enum: ["Work From Home", "Public Transport", "Bicycle"],
    required: true,
  },
  from: String,
  to: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Virtual field for frontend display
travelLogSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString();
});
travelLogSchema.set("toJSON", { virtuals: true });

// ✅ Compound index for performance
travelLogSchema.index({ companyId: 1, employeeId: 1, createdAt: -1 });

const TravelLog = mongoose.model("TravelLog", travelLogSchema);
export default TravelLog;
