import express from "express";
import { authMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

/**
 * @route GET /api/company/dashboard
 * @desc Returns mock company-wide analytics
 */
router.get("/dashboard", (req, res) => {
  // 1. Check Role
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: "Access denied. Not a company manager." });
  }
  
  // 2. Return Mock Data (matching the design in the text file)
  res.json({
    completion: {
      total: 82, // Total completion count
      male: 47,
      female: 53
    },
    roles: {
      graduate: 12,
      junior: 7,
      consultant: 14,
      senior: 22,
      manager: 19,
      executive: 23
    },
    health: {
      org: 81,
      collab: 92,
      adaptability: 67
    },
    highPotential: {
      percent: 4,
      count: 26
    },
    capability: {
      capable: 46, // Yes
      notReady: 54 // No
    },
    retention: 91,
    mobility: 22
  });
});

export default router;