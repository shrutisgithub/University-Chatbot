const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

let tickets = []; // in-memory; ok for demo

// Create a ticket (when chatbot escalates)
app.post("/tickets", (req, res) => {
  const { message, studentId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const ticket = {
    id: uuidv4(),
    message,
    studentId: studentId || null,
    status: "OPEN",
    createdAt: new Date().toISOString()
  };

  tickets.push(ticket);
  return res.status(201).json(ticket);
});

// Get all tickets (for admin view)
app.get("/tickets", (req, res) => {
  return res.json(tickets);
});

// Update ticket status (e.g., mark RESOLVED)
app.patch("/tickets/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  if (status) {
    ticket.status = status;
  }

  return res.json(ticket);
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Ticket service running on port ${PORT}`);
});
