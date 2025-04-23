import Company from "../models/Company.js";
import Trade from "../models/Trade.js";
import User from "../models/User.js"; // ✅ Import User model to query employers

export const getSystemStats = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const approvedCompanies = await Company.countDocuments({ approved: true });
    const totalTrades = await Trade.countDocuments();

    const totalCredits = await Trade.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const pendingEmployers = await User.countDocuments({
      role: "employer",
      status: "pending",
    }); // ✅ Count pending employers

    res.json({
      totalCompanies,
      approvedCompanies,
      pendingCompanies: totalCompanies - approvedCompanies,
      totalTrades,
      totalCredits: totalCredits[0]?.total || 0,
      pendingEmployers, // ✅ Include in response
    });
  } catch (err) {
    console.error("❌ Failed to fetch system stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
