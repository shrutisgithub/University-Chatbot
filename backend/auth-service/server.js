const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-demo-key";

// --- Debug: show which URI the container is actually using ---
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is NOT defined. Check your .env or docker-compose.");
} else {
  const safeUri = MONGO_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    "//$1:****@"
  );
  console.log("🔍 Using Mongo URI:", safeUri);
}

// --- Mongo connection ---
mongoose
  .connect(MONGO_URI) // no deprecated options
  .then(() => console.log("✅ Auth-service connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error in auth-service:", err.message);
  });

// --- Helpers ---
function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// --- Routes ---

// Health check
app.get("/", (req, res) => {
  res.json({ status: "auth-service ok" });
});

// Sign up
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: "User with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "student", // default for this project
    });

    const token = createToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed on server." });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed on server." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Auth-service listening on port ${PORT}`);
});
