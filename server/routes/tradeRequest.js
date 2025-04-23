import express from "express";
import Trade from "../models/Trade.js";
import TradeRequest from "../models/TradeRequest.js";
import Company from "../models/Company.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ✅ 1. Send request to fulfill another company's trade
router.post("/:tradeId/request", verifyToken, async (req, res) => {
  try {
    const { tradeId } = req.params;

    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    // ❌ Prevent self-fulfillment
    if (String(trade.companyId) === String(req.user.companyId)) {
      return res.status(400).json({ message: "You cannot fulfill your own trade" });
    }

    // ❌ Prevent duplicate request
    const existing = await TradeRequest.findOne({
      tradeId,
      requestedBy: req.user.companyId,
    });

    if (existing) {
      return res.status(400).json({ message: "You have already requested to fulfill this trade" });
    }

    const request = await TradeRequest.create({
      tradeId,
      requestedBy: req.user.companyId,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 2. Get all requests for a given trade (used by original poster)
router.get("/:tradeId/requests", verifyToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const requests = await TradeRequest.find({ tradeId })
      .populate("requestedBy", "name")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 3. Accept a request, reject others, fulfill trade
router.patch("/:tradeId/requests/:requestId/accept", verifyToken, async (req, res) => {
  try {
    const { tradeId, requestId } = req.params;

    const acceptedRequest = await TradeRequest.findById(requestId);
    if (!acceptedRequest) return res.status(404).json({ message: "Request not found" });

    const existingTrade = await Trade.findById(tradeId);
    if (!existingTrade) return res.status(404).json({ message: "Trade not found" });

    // ✅ Accept the selected request
    acceptedRequest.status = "accepted";
    await acceptedRequest.save();

    // ✅ Decline all other pending requests
    await TradeRequest.updateMany(
      { tradeId, _id: { $ne: requestId } },
      { $set: { status: "declined" } }
    );

    // ✅ Mark trade as fulfilled and not advertised
    const updatedTrade = await Trade.findByIdAndUpdate(
      tradeId,
      {
        isAdvertised: false,
        status: "completed",
        fromCompany: existingTrade.type === "sell" ? existingTrade.companyId : acceptedRequest.requestedBy,
        toCompany: existingTrade.type === "sell" ? acceptedRequest.requestedBy : existingTrade.companyId,
      },
      { new: true }
    );

    // ✅ Adjust credits for both companies
    const buyerCompany = updatedTrade.type === "buy" ? updatedTrade.companyId : acceptedRequest.requestedBy;
    const sellerCompany = updatedTrade.type === "buy" ? acceptedRequest.requestedBy : updatedTrade.companyId;

    const buyer = await Company.findById(buyerCompany);
    const seller = await Company.findById(sellerCompany);

    if (seller.credits < updatedTrade.amount) {
      return res.status(400).json({ message: "Seller lacks sufficient credits" });
    }

    seller.credits -= updatedTrade.amount;
    buyer.credits += updatedTrade.amount;

    await seller.save();
    await buyer.save();

    res.json({ message: "✅ Trade fulfilled successfully" });
  } catch (err) {
    console.error("❌ Error fulfilling trade:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 4. Get all requests sent by my company (for "My Requests" section)
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const requests = await TradeRequest.find({ requestedBy: req.user.companyId })
      .populate({
        path: "tradeId",
        populate: { path: "companyId", select: "name" }
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
