import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Company from '../models/Company.js';
import { verifyToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in your .env file.");
  process.exit(1);
}

// ─────────────────────────────────────────────
// REGISTER: Employer or Employee
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { company, username, password, role } = req.body;

  if (role === 'admin') {
    return res.status(403).json({ error: 'Admin registration not allowed' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    let companyRecord = await Company.findOne({ name: company });

    if (role === 'employer') {
      if (!companyRecord) {
        companyRecord = await Company.create({ name: company, approved: false, credits: 0 });
      }
    }

    if (role === 'employee') {
      if (!companyRecord || !companyRecord.approved) {
        return res.status(400).json({ error: 'Company not found or not yet approved' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      role,
      companyId: companyRecord._id,
      status: 'pending',
    });

    res.status(201).json({ message: `${role} registered. Awaiting approval.` });
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ error: 'Registration failed. Try again later.' });
  }
});

// ─────────────────────────────────────────────
// LOGIN: All roles
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password, company, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role required' });
  }

  try {
    if (role === 'admin') {
      const admin = await User.findOne({ username, role: 'admin' });
      if (!admin) return res.status(404).json({ error: 'Admin not found' });

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

      const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });

      return res.json({ token, user: { id: admin._id, username: admin.username, role: admin.role } });
    }

    const user = await User.findOne({ username, role }).populate('companyId');
    if (!user || user.companyId?.name !== company) {
      return res.status(404).json({ error: 'User not found or wrong company' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Your account is not approved yet' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        companyId: user.companyId?._id,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        companyId: user.companyId?._id,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─────────────────────────────────────────────
// GET /users: Role-based visibility
// ─────────────────────────────────────────────
router.get('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const users = await User.find().populate('companyId');
      return res.json(users);
    }

    if (req.user.role === 'employer') {
      const users = await User.find({
        role: 'employee',
        companyId: req.user.companyId,
      }).populate('companyId');
      return res.json(users);
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (err) {
    console.error("❌ Fetch Users Error:", err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 👆 ... everything remains unchanged above ...

// ─────────────────────────────────────────────
// GET /employee/status: Real-time approval check
// ─────────────────────────────────────────────
router.get('/employee/status', verifyToken, async (req, res) => {
  try {
    const employee = await User.findById(req.user.id);
    const company = await Company.findById(req.user.companyId);

    res.json({
      employeeStatus: employee.status,
      companyApproved: company?.approved || false,
    });
  } catch (err) {
    console.error("❌ Error fetching employee status:", err.message);
    res.status(500).json({ error: 'Failed to fetch employee status' });
  }
});

export default router;
