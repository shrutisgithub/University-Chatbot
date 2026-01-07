import React, { useState } from "react";
import axios from "axios";

const SUGGESTIONS = [
  "How do I get admission in Bennett University?",
  "What is the BTech fee at Bennett University?",
  "Tell me about hostel facilities.",
  "What are the placements like?",
  "Do you offer scholarships?"
];

function ChatPage({ user }) {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi, I’m your Bennett University assistant. Ask me about admissions, fees, hostel, placements, scholarships, courses or campus life."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { from: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        message: trimmed,
        studentId: user?.id || user?.email || "anonymous"
      });

      const botMsg = { from: "bot", text: res.data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Sorry, something went wrong while contacting the server." }
      ]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="chat-layout">
      <section className="chat-panel">

        <div className="chat-suggestions">
          {SUGGESTIONS.map(text => (
            <button
              key={text}
              className="chip"
              onClick={() => handleSuggestionClick(text)}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="chat-window">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-row ${m.from === "user" ? "user" : "bot"}`}
            >
              <div className="bubble">{m.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-row bot">
              <div className="bubble typing">
                Thinking<span className="dots">...</span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-bar">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Bennett University…"
          />
          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>

        <p className="chat-hint">
          Tip: Ask about admissions, fees, hostel, placements, scholarships or campus life.
        </p>
      </section>

      <aside className="info-panel">
        <h2>About this chatbot</h2>
        <p>
          This assistant is designed for Bennett University. It can answer
          frequently asked questions about admissions, fees, hostels, placements,
          courses and campus life using a custom knowledge base.
        </p>
        <p><strong>Logged in as:</strong> {user?.name}</p>
      </aside>
    </div>
  );
}

export default ChatPage;
