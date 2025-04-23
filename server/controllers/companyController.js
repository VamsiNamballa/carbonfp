import mongoose from "mongoose";
import TravelLog from "../models/TravelLog.js";
import User from "../models/User.js";

// ✅ Employer-only: Total carbon credits per employee in their company
export const getEmployeeContributions = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const contributions = await TravelLog.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: "$employeeId",
          totalCredits: { $sum: "$carbonCreditsEarned" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          employeeId: "$employee._id",
          name: "$employee.username",
          totalCredits: 1,
        },
      },
      { $sort: { totalCredits: -1 } },
    ]);

    res.json(contributions);
  } catch (err) {
    console.error("❌ Employer leaderboard error:", err);
    res.status(500).json({ error: "Failed to get contributions" });
  }
};

// ✅ Employee or Employer: My company's leaderboard (self-view)
export const getMyCompanyLeaderboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const leaderboard = await TravelLog.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: "$employeeId",
          totalCredits: { $sum: "$carbonCreditsEarned" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          employeeId: "$employee._id",
          name: "$employee.username",
          totalCredits: 1,
        },
      },
      { $sort: { totalCredits: -1 } },
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error("❌ My company leaderboard error:", err);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
};

// ✅ Employer-only: Get detailed employee travel logs from their company
export const getDetailedLogs = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const logs = await TravelLog.find({ companyId })
      .populate("employeeId", "username")
      .sort({ createdAt: -1 });

    const formattedLogs = logs.map((log) => ({
      date: new Date(log.createdAt).toLocaleDateString(),
      name: log.employeeId.username,
      travelStyle: log.travelStyle,
      credits: log.carbonCreditsEarned,
    }));

    res.json(formattedLogs);
  } catch (err) {
    console.error("❌ Log fetch error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};

// ✅ Public: Global leaderboard of top 10 employees across all companies
export const getTopEmployees = async (req, res) => {
  try {
    const topEmployees = await TravelLog.aggregate([
      {
        $group: {
          _id: "$employeeId",
          totalCredits: { $sum: "$carbonCreditsEarned" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          employeeId: "$employee._id",
          username: "$employee.username",
          totalCredits: 1,
        },
      },
      { $sort: { totalCredits: -1 } },
      { $limit: 10 },
    ]);

    res.json(topEmployees);
  } catch (err) {
    console.error("❌ Global leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch top employees" });
  }
};
