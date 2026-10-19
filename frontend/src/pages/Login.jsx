import { useState } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";

import axios from "../lib/axios";
const API_URL = "/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert(`Welcome back, ${user.name}! Login successful.`);

      // Direct users based on role
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to login. Please check your backend server.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link className="login-logo" to="/">
          ✚ Care<span>Plus</span>
        </Link>

        <div className="login-icon">♙</div>

        <h1>Welcome Back!</h1>
        <p className="login-subtitle">
          Sign in to manage your hospital appointments.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to Your Account →"}
          </button>
        </form>

        <p className="register-text">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>

        <Link className="back-home" to="/">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Login;