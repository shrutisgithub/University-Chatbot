import React, { useState } from "react";
import axios from "axios";

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await axios.post("http://localhost:5000/api/auth/signup", {
          name,
          email,
          password
        });
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        onAuthSuccess(user);
      } else {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
          email,
          password
        });
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        onAuthSuccess(user);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="auth-layout">
      {/* NEW wrapper to center title + card together */}
      <div className="auth-inner">
        {/* Big page title ABOVE the card */}
        <h1 className="landing-title">Campus Virtual Assistant</h1>

        <div className="auth-card glass">
          <div className="auth-header-top">
            <h1 className="auth-title-main">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="auth-subtitle-main">
              {isLogin
                ? "Sign in to use your Bennett University assistant."
                : "Sign up and start chatting with the Bennett University bot."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-row">
                <label className="auth-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div className="form-row">
              <label className="auth-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bennett.edu.in"
                required
              />
            </div>

            <div className="form-row">
              <label className="auth-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              className="auth-submit primary"
              type="submit"
              disabled={loading}
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>

          <div className="auth-footer-switch">
            {isLogin ? (
              <>
                <span>Don't have an account?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
