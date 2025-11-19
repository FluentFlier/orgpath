import express from "express";
import { authMiddleware } from "../utils/authMiddleware.js";

const router = express.Router();

// Use auth middleware for all team lead routes
router.use(authMiddleware);

/**
 * @route GET /api/teamlead/dashboard
 * @desc Returns mock dashboard data for a team lead
 */
router.get("/dashboard", async (req, res) => {
  // Check if the user has the 'lead' role (from the JWT)
  if (req.user.role !== 'lead') {
    return res.status(403).json({ error: "Access denied. Not a team lead." });
  }

  // Send back the mock data for the dashboard
  res.json({
    teamSize: 15,
    healthScore: 92,
    avgOverallScore: 85,
    completionRate: 100,
    performanceBreakdown: {
      leadership: 82,
      communication: 87,
      adaptability: 85,
      collaboration: 84,
    },
    topPerformers: [
      { name: "Sophie Martin", role: "Social Media Manager", initials: "SM" },
      { name: "Lucas Anderson", role: "Growth Hacker", initials: "LA" },
      { name: "Jessica Hill", role: "Brand Manager", initials: "JH" },
    ],
    projects: [
      { name: "Brand Refresh Campaign", status: "In Progress", progress: 78 },
      { name: "Social Media Strategy", status: "Active", progress: 55 },
      { name: "Content Marketing Initiative", status: "Planning", progress: 30 },
    ],
  });
});

export default router;