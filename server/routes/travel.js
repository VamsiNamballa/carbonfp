// routes/travel.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  calculateDistanceAndCredits,
  logTravelEntry,
  getUserTravelLogs
} from "../controllers/travelController.js";

const router = express.Router();

// ✅ POST: Calculate distance & credits
router.post("/calculate", verifyToken, calculateDistanceAndCredits);

// ✅ POST: Log a new travel entry
router.post("/log", verifyToken, logTravelEntry);

// ✅ GET: Fetch logs of a user
router.get("/user/:id", verifyToken, getUserTravelLogs);

export default router;
