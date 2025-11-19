import express from "express";
import { authMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

// Placeholder for Company Dashboard
router.get("/dashboard", (req, res) => {
  // Check for role
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: "Access denied. Not a company manager." });
  }
  
  res.json({
    message: "Company dashboard data coming soon",
    stats: {
        employees: 28,
        completion: "82%",
        health: "81%"
    }
  });
});

export default router;