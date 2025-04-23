import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import {
  getEmployeeContributions,
  getDetailedLogs,
  getTopEmployees,
  getMyCompanyLeaderboard,
} from "../controllers/companyController.js";

import Company from "../models/Company.js";

const router = express.Router();

// ✅ 1. Logged-in user: Get their company info
router.get("/me", verifyToken, async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 2. Employer-only: Get leaderboard of their employees
router.get("/contributions", verifyToken, checkRole(["employer"]), getEmployeeContributions);

// ✅ 3. Employer-only: Get travel logs of employees in their company
router.get("/logs", verifyToken, checkRole(["employer"]), getDetailedLogs);

// ✅ 4. Global: Top 10 employees across all companies
router.get("/leaderboard/top", verifyToken, getTopEmployees);

// ✅ 5. Admin-only: View all companies grouped by approval status
router.get("/all", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const all = await Company.find();
    const approved = all.filter((c) => c.approved);
    const pending = all.filter((c) => !c.approved);
    res.json({
      total: all.length,
      approved,
      pending,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// ✅ 6. Employee/Employer: View leaderboard for their own company
router.get("/my/leaderboard", verifyToken, getMyCompanyLeaderboard);

export default router;
