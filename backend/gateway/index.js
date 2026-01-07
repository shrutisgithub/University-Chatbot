const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- AUTH ROUTES ----------

// Sign up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const response = await axios.post("http://auth-service:5003/signup", req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error calling auth signup:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json(err.response?.data || { error: "Auth signup failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post("http://auth-service:5003/login", req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error calling auth login:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json(err.response?.data || { error: "Auth login failed" });
  }
});

// ---------- CHAT ROUTE ----------

app.post("/api/chat", async (req, res) => {
  try {
    const response = await axios.post("http://chatbot-service:5001/chat", req.body);
    res.json(response.data);
  } catch (err) {
    console.error("Error calling chatbot service:", err.message);
    res.status(500).json({ error: "Chatbot service unavailable" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
