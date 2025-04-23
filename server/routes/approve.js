import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import {
  approveCompany,
  approveEmployer,
  approveEmployee,
} from '../controllers/approveController.js';

import Company from '../models/Company.js';
import User from '../models/User.js';

const router = express.Router();

// ✅ Admin: Approve an employer
router.patch('/user/:id/approve', verifyToken, checkRole(['admin']), approveEmployer);

// ✅ Employer: Approve an employee in their own company
router.patch('/employee/:id/approve', verifyToken, checkRole(['employer']), approveEmployee);

// ✅ Employer: Get all employees in their company
router.get('/employees/my-company', verifyToken, checkRole(['employer']), async (req, res) => {
  try {
    const employees = await User.find({
      companyId: req.user.companyId,
      role: 'employee',
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// ✅ Admin: Add a single company (manual onboarding)
router.post('/company', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, approved = false, credits = 0 } = req.body;

    const existing = await Company.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    const company = await Company.create({ name, approved, credits });
    res.status(201).json({ message: 'Company created', company });
  } catch (err) {
    res.status(500).json({ error: 'Server error creating company' });
  }
});

// ✅ Admin: Create + approve multiple companies at once
router.post('/companies', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { companies } = req.body;

    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ message: 'Companies list is empty or invalid' });
    }

    const results = [];

    for (const entry of companies) {
      const { name, credits = 0 } = entry;

      if (!name || typeof name !== 'string') continue;

      const existing = await Company.findOne({ name });
      if (existing) {
        results.push({ name, status: 'already exists' });
        continue;
      }

      const created = await Company.create({ name, approved: true, credits });
      results.push({ name, status: 'created', company: created });
    }

    res.json({ message: 'Companies processed', results });
  } catch (err) {
    res.status(500).json({ error: 'Server error processing companies' });
  }
});

// ✅ Admin: Approve a specific company by ID
router.patch('/company/:id', verifyToken, checkRole(['admin']), approveCompany);

// ✅ Admin: Get companies by approval status (e.g., approved or pending)
router.get("/", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const isApproved = req.query.approved === "true";
    const companies = await Company.find({ approved: isApproved });
    res.json(companies);
  } catch (err) {
    console.error("❌ Error fetching companies:", err.message);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

export default router;