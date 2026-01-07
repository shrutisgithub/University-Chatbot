import React, { useEffect, useState } from "react";
import ChatPage from "./ChatPage";
import AuthPage from "./AuthPage";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);   // logged-in user
  const [view, setView] = useState("chat"); // only 'chat' for now

  // Load user from localStorage on refresh
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setView("chat");
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setView("chat");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setView("chat");
  };

  // ========= AUTH PAGE (NO HEADER) =========
  if (!user) {
    return (
      <div className="app-root">
        <main className="app-main no-header">
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        </main>
      </div>
    );
  }

  // ========= CHAT PAGE WITH HEADER =========
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-dot" />
          <span>Campus Virtual Assistant</span>
        </div>

        <div className="app-header-right">
          <div className="auth-header">
            <span className="user-chip">{user.name}</span>
            <button className="tab-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <ChatPage user={user} />
      </main>
    </div>
  );
}

export default App;
