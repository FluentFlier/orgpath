import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/auth.js";
import dashboardRoutes from "./src/routes/dashboard.js";
import assessmentRoutes from "./src/routes/assessment.js";
// --- NEW IMPORTS ---
import teamleadRoutes from "./src/routes/teamlead.js";
import companyRoutes from "./src/routes/company.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// This serves files (like index.html) from the 'frontend' folder
app.use(express.static("frontend"));

app.get("/", (_, res) => res.send("OrgPath API is running 🚀"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assessment", assessmentRoutes);
// --- NEW ROUTES ---
app.use("/api/teamlead", teamleadRoutes);
app.use("/api/company", companyRoutes);

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));