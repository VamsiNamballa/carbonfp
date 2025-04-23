import express from "express";
import db from "../db/connection.js";
import { ObjectId } from "mongodb";

const router = express.Router();

/* ========== 1. GET all users ========== */
router.get("/users", async (req, res) => {
  const users = await db.collection("users").find({}).toArray();
  res.json(users);
});

/* ========== 2. Register new user ========== */
router.post("/users", async (req, res) => {
  const { username, company, password, role } = req.body;

  const newUser = {
    username,
    company,
    password, // Note: hash this in production!
    role,
    creditsAvailable: 0,
  };

  const result = await db.collection("users").insertOne(newUser);
  res.json(result);
});

/* ========== 3. Log travel ========== */
router.post("/travel", async (req, res) => {
  const { username, from, to, distance } = req.body;

  const creditEarned = Math.round(distance / 5); // custom logic

  const travelEntry = {
    username,
    from,
    to,
    distance,
    creditsEarned: creditEarned,
    createdAt: new Date(),
  };

  await db.collection("travel_logs").insertOne(travelEntry);

  await db.collection("users").updateOne(
    { username },
    { $inc: { creditsAvailable: creditEarned } }
  );

  res.json({ message: "Travel logged & credits updated", creditEarned });
});

/* ========== 4. Request credit trade (buy/sell) ========== */
router.post("/trade", async (req, res) => {
  const { fromUser, toUser, credits, type } = req.body;

  const trade = {
    fromUser,
    toUser,
    credits,
    type, // "buy" or "sell"
    status: "pending",
    requestedAt: new Date(),
  };

  const result = await db.collection("credit_trades").insertOne(trade);
  res.json({ message: "Trade request submitted", tradeId: result.insertedId });
});

/* ========== 5. Admin approves trade ========== */
router.patch("/trade/approve/:id", async (req, res) => {
  const tradeId = new ObjectId(req.params.id);
  const trade = await db.collection("credit_trades").findOne({ _id: tradeId });

  if (!trade) return res.status(404).json({ error: "Trade not found" });

  const { fromUser, toUser, credits } = trade;

  const fromBalance = await db.collection("users").findOne({ username: fromUser });

  if (fromBalance.creditsAvailable < credits) {
    return res.status(200).json({
      message: "Insufficient credits. Marking trade as pending.",
      status: "pending",
    });
  }

  // Update credits
  await db.collection("users").updateOne(
    { username: fromUser },
    { $inc: { creditsAvailable: -credits } }
  );
  await db.collection("users").updateOne(
    { username: toUser },
    { $inc: { creditsAvailable: credits } }
  );

  await db.collection("credit_trades").updateOne(
    { _id: tradeId },
    { $set: { status: "approved", approvedAt: new Date() } }
  );

  res.json({ message: "Trade approved ✅" });
});

export default router;
