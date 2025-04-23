// server/routes/employer.js

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import User from '../models/User.js';
import Trade from '../models/Trade.js';
import Company from '../models/Company.js';
import TravelLog from '../models/TravelLog.js';

const router = express.Router();

// ✅ 1. Get pending employees in the same company
router.get('/employees/pending', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const pendingEmployees = await User.find({
      role: 'employee',
      companyId: req.user.companyId,
      status: 'pending',
    }).select('_id username createdAt');
    res.json(pendingEmployees);
  } catch (err) {
    console.error("Error fetching pending employees:", err);
    res.status(500).json({ error: 'Failed to fetch pending employees' });
  }
});

// ✅ 2. Approve a specific employee
router.patch('/employees/:id/approve', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const employee = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
        role: 'employee',
        status: 'pending'
      },
      { status: 'approved' },
      { new: true }
    );

    if (!employee)
      return res.status(404).json({ error: 'Employee not found or already approved' });

    res.json({ message: '✅ Employee approved successfully', employee });
  } catch (err) {
    console.error("Error approving employee:", err);
    res.status(500).json({ error: 'Failed to approve employee' });
  }
});

// ✅ 3. Employer trade history (full audit)
router.get('/trades/history', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [
        { companyId: req.user.companyId },
        { fromCompany: req.user.companyId },
        { toCompany: req.user.companyId }
      ],
    })
      .sort({ updatedAt: -1 })
      .populate('fromCompany', 'name')
      .populate('toCompany', 'name')
      .populate('companyId', 'name');

    res.json(trades);
  } catch (err) {
    console.error("Error fetching trade history:", err);
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
});

// ✅ 4. Employer + Company Status Check (now includes username and company name)
router.get('/status', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const employer = await User.findById(req.user.id);
    const company = await Company.findById(req.user.companyId);

    const isCompanyApproved = company?.approved || false;

    if (isCompanyApproved && employer.status !== 'approved') {
      employer.status = 'approved';
      await employer.save();
    }

    res.json({
      employerStatus: employer.status,
      employerUsername: employer.username,
      companyName: company?.name || "Unknown",
      companyApproved: isCompanyApproved,
    });
  } catch (err) {
    console.error("Error fetching employer status:", err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// ✅ 5. Leaderboard + Travel Logs + Total Credits (with dynamic buy/sell adjustments)
router.get('/dashboard', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Get all approved employees in this company
    const employees = await User.find({
      companyId,
      role: 'employee',
      status: 'approved',
    }).lean();

    // Get all travel logs of the company
    const logs = await TravelLog.find({ companyId }).lean();

    // Build leaderboard
    const leaderboardMap = {};
    const logsByEmployee = {};

    for (const log of logs) {
      const empId = log.employeeId.toString();
      leaderboardMap[empId] = (leaderboardMap[empId] || 0) + log.carbonCreditsEarned;
      logsByEmployee[empId] = logsByEmployee[empId] || [];
      logsByEmployee[empId].push(log);
    }

    const leaderboard = employees.map((emp) => ({
      _id: emp._id,
      username: emp.username,
      carbonCredits: leaderboardMap[emp._id.toString()] || 0,
    })).sort((a, b) => b.carbonCredits - a.carbonCredits);

    const rawTotal = leaderboard.reduce((sum, emp) => sum + emp.carbonCredits, 0);

    // 🔁 Adjust for buy/sell trades
    const completedTrades = await Trade.find({
      status: "completed",
      $or: [{ fromCompany: companyId }, { toCompany: companyId }]
    });

    let adjustedTotal = rawTotal;

    for (const trade of completedTrades) {
      if (String(trade.fromCompany) === String(companyId)) {
        // We sold credits
        adjustedTotal -= trade.amount;
      } else if (String(trade.toCompany) === String(companyId)) {
        // We bought credits
        adjustedTotal += trade.amount;
      }
    }

    res.json({
      leaderboard,
      totalCredits: adjustedTotal,
      logsByEmployee
    });
  } catch (err) {
    console.error("❌ Error fetching employer dashboard data:", err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;
