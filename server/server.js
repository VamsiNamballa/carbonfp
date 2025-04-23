import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import approvalRoutes from './routes/approve.js';
import tradeRoutes from './routes/trade.js';
import companyRoutes from './routes/company.js';
import adminRoutes from './routes/admin.js';
import tradeRequestRoutes from './routes/tradeRequest.js';
import travelRoutes from './routes/travel.js';
import employerRoutes from './routes/employer.js'; // ✅ Employer dashboard routes

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('❌ Missing critical environment variable(s). Please check .env');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🌱 Health check
app.get('/', (req, res) => {
  res.send('🌱 CarbonFP backend is live!');
});

// ✅ Register all routes
app.use('/api/auth', authRoutes);
app.use('/api/approve', approvalRoutes);
app.use('/api/trades', tradeRoutes); // Includes POST /api/trades/create
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trade-requests', tradeRequestRoutes); // For multi-party trade request flow
app.use('/api/travel', travelRoutes);
app.use('/api/employer', employerRoutes);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
