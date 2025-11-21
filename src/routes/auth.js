import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { config } from "../config.js";
import { OAuth2Client } from 'google-auth-library'; // New Import

const router = express.Router();
const pool = new Pool({ connectionString: config.dbUrl });

// --- GOOGLE SSO CONFIG ---
const GOOGLE_CLIENT_ID = "879626589202-okhopnpcriflfva4c98jin199cb6280e.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

function roleFromReferral(code) {
  if (!code) return "employee";
  const c = String(code).trim().charAt(0).toUpperCase();
  if (c === "A") return "employee";
  if (c === "B") return "lead";
  if (c === "C") return "company";
  return "employee";
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      referral_code: user.referral_code,
    },
    config.jwtSecret,
    { expiresIn: "1h" }
  );
}

// --- NEW GOOGLE ROUTE ---
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    
    // 1. Verify the Google Token
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    // 2. Check if user exists in our DB
    let userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user = userQuery.rows[0];

    // 3. If not, create them automatically (Default to 'employee')
    if (!user) {
      // We set a placeholder password and referral code
      const newUser = await pool.query(
        `INSERT INTO users (first_name, last_name, username, email, password_hash, referral_code, role)
         VALUES ($1, $2, $3, $4, 'google-sso-user', 'A-SSO', 'employee')
         RETURNING *`,
        [given_name, family_name, email, email]
      );
      user = newUser.rows[0];
    }

    // 4. Sign our own JWT
    const jwtToken = signToken(user);
    const safeUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    };

    res.json({ token: jwtToken, user: safeUser });

  } catch (e) {
    console.error("Google SSO Error:", e);
    res.status(401).json({ error: "Invalid Google Token" });
  }
});

// --- EXISTING ROUTES ---

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, referralCode } = req.body;
    if (!firstName || !email || !password || !referralCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const role = roleFromReferral(referralCode);
    const hash = await bcrypt.hash(password, 12);
    const username = email.toLowerCase();

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, email, password_hash, referral_code, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, first_name, last_name, email, referral_code, role`,
      [firstName, lastName, username, email, hash, referralCode, role]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    if (String(e.message).includes("duplicate key")) {
      return res.status(409).json({ error: "User already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const userQuery = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR username=$1 LIMIT 1",
      [identifier.toLowerCase()]
    );
    const user = userQuery.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    const safeUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      referral_code: user.referral_code,
      role: user.role,
    };
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;