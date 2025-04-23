import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getSystemStats } from "../controllers/adminController.js";

const router = express.Router();

// GET /api/admin/stats
router.get("/stats", verifyToken, getSystemStats);

export default router;
