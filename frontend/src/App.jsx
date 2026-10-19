import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

const getStoredUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user && typeof user === "object" ? user : {};
  } catch {
    return {};
  }
};

// Route protection for Admin Dashboard
function AdminRoute() {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <AdminDashboard />;
}

// Route protection for Patient Dashboard
function PatientRoute() {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
  return <Dashboard />;
}

// Landing / Home page view
function HomePage() {
  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#home">
          <span className="logo-icon">✚</span>
          Care<span>Plus</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#doctors">Doctors</a>
          <a href="#contact">Contact</a>
        </div>

        <Link className="nav-button" to="/login">
          Login / Register
        </Link>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span>
            <h1>
              Quality Healthcare,
              <br />
              <span>Made Simple.</span>
            </h1>
            <p>
              Find the right doctor, explore hospital services,
              and book your appointment easily — all in one place.
            </p>

            <div className="hero-actions">
              <Link className="primary-button" to="/login">
                Book an Appointment →
              </Link>
              <a className="secondary-button" href="#services">
                Explore Services
              </a>
            </div>

            <div className="trust-row">
              <div><strong>Easy</strong><small>Online Booking</small></div>
              <div><strong>Trusted</strong><small>Doctor Information</small></div>
              <div><strong>Simple</strong><small>Appointment Tracking</small></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="medical-circle">
              <div className="medical-cross">✚</div>
              <div className="floating-card top-card">
                <span className="status-dot"></span>
                <div><strong>Patient Care</strong><small>Made easier</small></div>
              </div>
              <div className="floating-card bottom-card">
                <span className="calendar-icon">▦</span>
                <div><strong>Book Online</strong><small>At your convenience</small></div>
              </div>
            </div>
          </div>
        </section>

        <section className="services section" id="services">
          <div className="section-heading">
            <span className="eyebrow">WHAT WE OFFER</span>
            <h2>Healthcare at Your Fingertips</h2>
            <p>Everything you need to manage your hospital appointments.</p>
          </div>

          <div className="service-grid">
            <article className="service-card">
              <div className="service-icon blue">✚</div>
              <h3>Find a Doctor</h3>
              <p>Explore doctor details, departments, and consultation modes.</p>
              <a href="#doctors">Explore doctors →</a>
            </article>

            <article className="service-card">
              <div className="service-icon green">▦</div>
              <h3>Book Appointment</h3>
              <p>Check available time slots and plan your hospital visit.</p>
              <Link to="/login">Book a visit →</Link>
            </article>

            <article className="service-card">
              <div className="service-icon purple">♡</div>
              <h3>Patient Care</h3>
              <p>Access your appointment information and patient services.</p>
              <Link to="/login">Get started →</Link>
            </article>
          </div>
        </section>

        <section className="appointment-section" id="appointment">
          <div>
            <span className="eyebrow">TAKE THE FIRST STEP</span>
            <h2>Your health deserves the right care.</h2>
            <p>Register or log in to start managing your appointments.</p>
          </div>
          <Link className="primary-button" to="/register">
            Create Account →
          </Link>
        </section>

        <section className="section doctors-section" id="doctors">
          <div className="section-heading">
            <span className="eyebrow">OUR CARE NETWORK</span>
            <h2>Find Care That Fits Your Needs</h2>
            <p>Explore hospital departments and consultation options.</p>
          </div>

          <div className="department-grid">
            <div className="department-card"><span>♡</span><strong>Cardiology</strong></div>
            <div className="department-card"><span>✚</span><strong>General Medicine</strong></div>
            <div className="department-card"><span>⌁</span><strong>Orthopaedics</strong></div>
            <div className="department-card"><span>✿</span><strong>Paediatrics</strong></div>
          </div>
        </section>
      </main>

      <footer id="contact">
        <a className="logo footer-logo" href="#home">
          ✚ Care<span>Plus</span>
        </a>
        <p>Online Hospital Appointment Booking System</p>
        <p className="copyright">
          © 2026 CarePlus. Designed for better healthcare access.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PatientRoute />} />
        <Route path="/admin-dashboard" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}