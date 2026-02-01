import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "../styling/AuthPage.css";

type AuthMode = "login" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/tickets", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, name };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: { token?: string; user?: unknown; message?: string } = {};
      try {
        data = await response.json();
      } catch {
        const status = response.status;
        const msg =
          status === 404
            ? "API not found (404). Check that REACT_APP_API_URL points to your backend, not the frontend."
            : response.ok
              ? "Invalid response from server"
              : `Login failed (${status})`;
        setError(msg);
        return;
      }

      if (response.ok) {
        localStorage.setItem("token", data.token!);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        navigate("/tickets");
      } else {
        setError(
          response.status === 404
            ? "API not found (404). Check that REACT_APP_API_URL points to your backend, not the frontend."
            : data.message || "Something went wrong"
        );
      }
    } catch (err) {
      setError("Unable to connect to the server. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">ENCORE</h1>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Welcome back! Sign in to continue."
              : "Create an account to get started."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <label className="auth-label">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="auth-input"
                required
              />
            </label>
          )}

          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
              required
            />
          </label>

          <label className="auth-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input"
              required
              minLength={6}
            />
          </label>

          {mode === "signup" && (
            <label className="auth-label">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                required
                minLength={6}
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="account-btn account-btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading
              ? "Please wait..."
              : mode === "login"
              ? "Log in"
              : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button type="button" className="auth-link" onClick={toggleMode}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="auth-link" onClick={toggleMode}>
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
