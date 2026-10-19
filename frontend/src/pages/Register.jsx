import { useState } from "react";
import "./Register.css";
import { useNavigate, Link } from "react-router-dom";

import axios from "../lib/axios";
const API_URL = "/auth";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
      });

      const { token, user } = response.data;

      // Store credentials if the backend auto-logs in upon registration
      if (token) {
        localStorage.setItem("token", token);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      alert(`Welcome, ${user?.name || name}! Your account was created successfully.`);

      // Navigate using React Router instead of full page reload
      navigate("/login");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to register. Please check that the backend is running.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <Link className="register-logo" to="/">
          ✚ Care<span>Plus</span>
        </Link>

        <div className="register-icon">♙</div>

        <h1>Create Account</h1>
        <p className="register-subtitle">
          Register to manage your hospital appointments.
        </p>

        <form onSubmit={handleRegister}>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="register-email">Email Address</label>
          <input
            id="register-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create My Account →"}
          </button>
        </form>

        <p className="register-login-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>

        <Link className="register-back-home" to="/">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Register;