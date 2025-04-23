// server/routes/trade.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import Trade from '../models/Trade.js';
import TravelLog from '../models/TravelLog.js';
import Company from '../models/Company.js';
import TradeRequest from '../models/TradeRequest.js';

const router = express.Router();

// ✅ Create trade ad (buy/sell)
router.post('/create', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const { type, amount } = req.body;
    if (!type || !["buy", "sell"].includes(type)) {
      return res.status(400).json({ error: "Type must be 'buy' or 'sell'" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    // Check available credits if selling
    if (type === "sell") {
      const logs = await TravelLog.find({ companyId: req.user.companyId });
      const totalCredits = logs.reduce((sum, log) => sum + log.carbonCreditsEarned, 0);

      const completedTrades = await Trade.find({
        companyId: req.user.companyId,
        type: "sell",
        status: "completed"
      });

      const alreadySold = completedTrades.reduce((sum, t) => sum + t.amount, 0);
      const availableCredits = totalCredits - alreadySold;

      if (amount > availableCredits) {
        return res.status(400).json({ error: `Insufficient credits to sell. Available: ${availableCredits}` });
      }
    }

    const trade = await Trade.create({
      companyId: req.user.companyId,
      type,
      amount,
      isAdvertised: true,
      status: "pending"
    });

    res.status(201).json({ message: "Trade advertisement created", trade });
  } catch (err) {
    console.error("Error creating trade:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Admin: View full trade audit log
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const trades = await Trade.find({})
      .sort({ updatedAt: -1 })
      .populate("fromCompany", "name")
      .populate("toCompany", "name");

    const formatted = trades.map(t => ({
      _id: t._id,
      type: t.type,
      amount: t.amount,
      status: t.status,
      fromCompany: t.fromCompany?.name || "-",
      toCompany: t.toCompany?.name || "-",
      updatedAt: t.updatedAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching admin trade audit:", err);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

// ✅ View trade ads from other companies
router.get('/ads/other', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const ads = await Trade.find({
      isAdvertised: true,
      status: "pending",
      companyId: { $ne: req.user.companyId },
    }).populate("companyId", "name");

    res.json(ads);
  } catch (err) {
    console.error("Error fetching trade ads:", err);
    res.status(500).json({ error: "Failed to fetch trade advertisements" });
  }
});

// ✅ Accept trade request and adjust credits
router.patch('/:tradeId/requests/:requestId/accept', verifyToken, requireRole('employer'), async (req, res) => {
  try {
    const { tradeId, requestId } = req.params;

    const acceptedRequest = await TradeRequest.findById(requestId);
    if (!acceptedRequest) return res.status(404).json({ message: "Request not found" });

    acceptedRequest.status = "accepted";
    await acceptedRequest.save();

    await TradeRequest.updateMany(
      { tradeId, _id: { $ne: requestId } },
      { $set: { status: "declined" } }
    );

    const trade = await Trade.findByIdAndUpdate(
      tradeId,
      {
        isAdvertised: false,
        status: "completed",
        fromCompany: trade.type === "sell" ? trade.companyId : acceptedRequest.requestedBy,
        toCompany: trade.type === "sell" ? acceptedRequest.requestedBy : trade.companyId,
      },
      { new: true }
    );

    const buyerCompanyId = trade.type === "buy" ? trade.companyId : acceptedRequest.requestedBy;
    const sellerCompanyId = trade.type === "buy" ? acceptedRequest.requestedBy : trade.companyId;

    const buyer = await Company.findById(buyerCompanyId);
    const seller = await Company.findById(sellerCompanyId);

    if (seller.credits < trade.amount) {
      return res.status(400).json({ message: "Seller lacks sufficient credits" });
    }

    seller.credits -= trade.amount;
    buyer.credits += trade.amount;

    await seller.save();
    await buyer.save();

    res.json({ message: "✅ Trade fulfilled and credits adjusted" });
  } catch (err) {
    console.error("❌ Error fulfilling trade:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
