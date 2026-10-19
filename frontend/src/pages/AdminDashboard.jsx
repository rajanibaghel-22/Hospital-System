import { useCallback, useEffect, useMemo, useState } from "react";

import "./AdminDashboard.css";
import { useNavigate, Link } from "react-router-dom";
import axios from "../lib/axios";
const API = "";

const emptyForm = {
  name: "",
  email: "",
  specialization: "",
  department: "",
  qualification: "",
  experience: 0,
  consultationFee: "",
  availabilityStatus: "available",
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      return storedUser && typeof storedUser === "object" ? storedUser : {};
    } catch {
      return {};
    }
  });
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [tab, setTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const config = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const loadDoctors = useCallback(async () => {
    const r = await axios.get(`${API}/doctors`, config);
    setDoctors(r.data.doctors || r.data.data || []);
  }, [config]);

  const loadAppointments = useCallback(async () => {
    const r = await axios.get(`${API}/appointments`, config);
    setAppointments(r.data.appointments || r.data.data || []);
  }, [config]);

  const loadDepartments = useCallback(async () => {
    const r = await axios.get(`${API}/departments`);
    setDepartments(r.data.departments || r.data.data || []);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    queueMicrotask(() => {
      if (!isCurrent) return;

      Promise.all([
        loadDoctors(),
        loadAppointments(),
        loadDepartments(),
      ])
        .catch((e) => {
          if (isCurrent) {
            setError(e.response?.data?.message || "Unable to load dashboard.");
          }
        })
        .finally(() => {
          if (isCurrent) {
            setLoading(false);
          }
        });
    });

    return () => {
      isCurrent = false;
    };
  }, [loadAppointments, loadDepartments, loadDoctors]);

  const openAddForm = async () => {
    setTab("doctors");
    setShowForm(true);
    setEditingDoctorId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");

    try {
      await loadDepartments();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load departments.");
    }
  };

  const editDoctor = async (doctor) => {
    setTab("doctors");
    setShowForm(true);
    setEditingDoctorId(doctor._id);
    setError("");
    setMessage("");

    try {
      await loadDepartments();

      setForm({
        name: doctor.name || "",
        email: doctor.email || "",
        specialization: doctor.specialization || "",
        department: doctor.department?._id || doctor.department || "",
        qualification: doctor.qualification || "",
        experience: doctor.experience ?? 0,
        consultationFee: doctor.consultationFee ?? "",
        availabilityStatus: doctor.availabilityStatus || "available",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load departments.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addDoctor = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.department) {
      setError("Please select a department.");
      return;
    }

    setSaving(true);

    try {
      const doctorData = {
        ...form,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
      };

      if (editingDoctorId) {
        await axios.put(
          `${API}/doctors/${editingDoctorId}`,
          doctorData,
          config
        );
        setMessage("Doctor updated successfully!");
      } else {
        await axios.post(`${API}/doctors`, doctorData, config);
        setMessage("Doctor added successfully!");
      }

      await loadDoctors();
      setForm({ ...emptyForm });
      setEditingDoctorId(null);
      setShowForm(false);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          (editingDoctorId
            ? "Unable to update doctor."
            : "Unable to add doctor.")
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingDoctorId(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await axios.delete(`${API}/doctors/${id}`, config);
      setDoctors((old) => old.filter((d) => d._id !== id));
      setMessage("Doctor deleted successfully.");
    } catch (e) {
      setError(e.response?.data?.message || "Unable to delete doctor.");
    }
  };

  const updateStatus = async (appointmentId, status) => {
    setError("");
    setMessage("");
    setUpdatingAppointmentId(appointmentId);

    try {
      await axios.patch(
        `${API}/appointments/${appointmentId}/status`,
        { status },
        config
      );

      await loadAppointments();
      setMessage("Appointment status updated successfully!");
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to update appointment status."
      );
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filteredAppointments = appointments.filter((a) => {
    const search = searchTerm.toLowerCase().trim();
    const patientName = (
      a.patient?.name || a.patientName || ""
    ).toLowerCase();
    const doctorName = (a.doctor?.name || "").toLowerCase();
    const status = (a.status || "").toLowerCase();

    const matchesSearch =
      patientName.includes(search) || doctorName.includes(search);

    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      label: "Total Doctors",
      value: doctors.length,
      icon: "♙",
      tone: "blue",
    },
    {
      label: "Total Appointments",
      value: appointments.length,
      icon: "▣",
      tone: "green",
    },
    {
      label: "Booked Appointments",
      value: appointments.filter((a) => a.status === "booked").length,
      icon: "✓",
      tone: "orange",
    },
  ];

  const appointmentTable = (rows) => (
    <div className="cp-table-wrap">
      <table className="cp-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Update Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((a) => (
            <tr key={a._id}>
              <td>{a.patient?.name || a.patientName || "—"}</td>
              <td>{a.doctor?.name || "—"}</td>
              <td>{a.date || "—"}</td>
              <td>{a.timeSlot || a.time || "—"}</td>
              <td>
                <span className={`cp-status ${a.status || "unknown"}`}>
                  {a.status || "Unknown"}
                </span>
              </td>
              <td>
                {a.status === "booked" ? (
                  <select
                    value=""
                    disabled={updatingAppointmentId === a._id}
                    onChange={(e) => {
                      const nextStatus = e.target.value;
                      if (nextStatus) updateStatus(a._id, nextStatus);
                    }}
                    aria-label={`Update status for appointment ${a._id}`}
                  >
                    <option value="">
                      {updatingAppointmentId === a._id
                        ? "Updating..."
                        : "Choose status"}
                    </option>
                    <option value="completed">Completed</option>
                    <option value="no-show">No-show</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span>Final status</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!rows.length && (
        <p className="cp-empty">No appointments found.</p>
      )}
    </div>
  );

  if (loading) {
    return <div className="cp-loading">Loading CarePlus Dashboard...</div>;
  }

  return (
    <div className="cp-app">
      <aside className="cp-sidebar">
        <Link to="/" className="cp-brand" style={{ textDecoration: "none" }}>
          <div className="cp-logo">✚</div>
          <div>
            <div className="cp-brand-name">
              Care<span>Plus</span>
            </div>
            <div className="cp-brand-sub">HOSPITAL MANAGEMENT</div>
          </div>
        </Link>

        <div className="cp-menu-label">MAIN MENU</div>

        {[
          ["overview", "▦", "Overview"],
          ["doctors", "♙", "Manage Doctors"],
          ["appointments", "▣", "All Appointments"],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            className={`cp-nav ${tab === id ? "active" : ""}`}
            onClick={() => {
              setTab(id);
              setShowForm(false);
              setEditingDoctorId(null);
              setForm({ ...emptyForm });
              setError("");
              setMessage("");
            }}
          >
            <span className="cp-nav-icon">{icon}</span>
            {label}
          </button>
        ))}

        <div className="cp-sidebar-bottom">
          <div className="cp-profile">
            <div className="cp-avatar">
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="cp-profile-text">
              <strong>{user.name || "CarePlus Admin"}</strong>
              <span>{user.email || "Administrator"}</span>
            </div>
          </div>

          <button className="cp-logout" onClick={logout}>
            ↪ &nbsp; Logout
          </button>
        </div>
      </aside>

      <main className="cp-main">
        <header className="cp-header">
          <div>
            <div className="cp-eyebrow">
              CAREPLUS <span>/</span> ADMIN
            </div>
            <h1>
              {tab === "overview"
                ? "Dashboard Overview"
                : tab === "doctors"
                  ? "Manage Doctors"
                  : "All Appointments"}
            </h1>
            <p>
              Welcome back, {user.name || "Admin"}! Here's your hospital summary.
            </p>
          </div>
          <div className="cp-admin-pill">
            <span /> Admin Panel
          </div>
        </header>

        {error && <div className="cp-alert error">{error}</div>}
        {message && <div className="cp-alert success">{message}</div>}

        {tab === "overview" && (
          <>
            <section className="cp-stats">
              {stats.map((s) => (
                <article className="cp-stat-card" key={s.label}>
                  <div className="cp-stat-top">
                    <span>{s.label}</span>
                    <div className={`cp-stat-icon ${s.tone}`}>{s.icon}</div>
                  </div>
                  <div className="cp-stat-value">{s.value}</div>
                  <div className={`cp-stat-line ${s.tone}`} />
                </article>
              ))}
            </section>

            <section className="cp-panel cp-quick">
              <div>
                <h2>Quick Access</h2>
                <p>Choose a section to manage your hospital information.</p>
              </div>
              <div className="cp-actions">
                <button
                  className="cp-btn primary"
                  onClick={() => setTab("doctors")}
                >
                  ♙ &nbsp; View Doctors <span>→</span>
                </button>
                <button
                  className="cp-btn soft"
                  onClick={() => setTab("appointments")}
                >
                  ▣ &nbsp; View Appointments <span>→</span>
                </button>
                <button className="cp-btn outline" onClick={openAddForm}>
                  + Add Doctor
                </button>
              </div>
            </section>

            <section className="cp-panel">
              <div className="cp-panel-heading">
                <div>
                  <h2>Recent Appointments</h2>
                  <p>Latest activity in your hospital</p>
                </div>
                <button
                  className="cp-text-btn"
                  onClick={() => setTab("appointments")}
                >
                  View all →
                </button>
              </div>
              {appointmentTable(appointments.slice(0, 5))}
            </section>
          </>
        )}

        {tab === "doctors" && (
          <>
            <section className="cp-panel cp-directory-head">
              <div>
                <div className="cp-section-kicker">DOCTOR DIRECTORY</div>
                <h2>Our Doctors</h2>
                <p>{doctors.length} doctor(s) registered in CarePlus</p>
              </div>
              <button
                className="cp-btn primary"
                onClick={() => (showForm ? cancelForm() : openAddForm())}
              >
                {showForm ? "✕ Cancel" : "+ Add New Doctor"}
              </button>
            </section>

            {showForm && (
              <section className="cp-panel cp-form-panel">
                <div className="cp-form-title">
                  <div className="cp-form-icon">♙</div>
                  <div>
                    <h2>
                      {editingDoctorId ? "Edit Doctor" : "Add New Doctor"}
                    </h2>
                    <p>
                      {editingDoctorId
                        ? "Update the doctor's professional information below."
                        : "Enter the doctor's professional information below."}
                    </p>
                  </div>
                </div>

                <form onSubmit={addDoctor}>
                  <div className="cp-form-section-title">
                    PERSONAL INFORMATION
                  </div>
                  <div className="cp-form-grid">
                    <label className="cp-field">
                      Doctor Name <span>*</span>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Dr. Anil Patil"
                        required
                      />
                    </label>

                    <label className="cp-field">
                      Email Address
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="doctor@example.com"
                      />
                    </label>

                    <label className="cp-field">
                      Specialization <span>*</span>
                      <input
                        name="specialization"
                        value={form.specialization}
                        onChange={handleChange}
                        placeholder="e.g. Cardiologist"
                        required
                      />
                    </label>

                    <label className="cp-field">
                      Department <span>*</span>
                      <select
                        name="department"
                        value={form.department}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="cp-form-section-title">
                    PROFESSIONAL DETAILS
                  </div>
                  <div className="cp-form-grid">
                    <label className="cp-field">
                      Qualification
                      <input
                        name="qualification"
                        value={form.qualification}
                        onChange={handleChange}
                        placeholder="e.g. MBBS, MD"
                      />
                    </label>

                    <label className="cp-field">
                      Experience (years)
                      <input
                        name="experience"
                        type="number"
                        min="0"
                        value={form.experience}
                        onChange={handleChange}
                        required
                      />
                    </label>

                    <label className="cp-field">
                      Consultation Fee (₹) <span>*</span>
                      <input
                        name="consultationFee"
                        type="number"
                        min="0"
                        value={form.consultationFee}
                        onChange={handleChange}
                        placeholder="e.g. 500"
                        required
                      />
                    </label>

                    <label className="cp-field">
                      Availability Status
                      <select
                        name="availabilityStatus"
                        value={form.availabilityStatus}
                        onChange={handleChange}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="on-leave">On Leave</option>
                      </select>
                    </label>
                  </div>

                  <div className="cp-form-footer">
                    <span><span>*</span> Required fields</span>
                    <div className="cp-actions">
                      <button
                        type="button"
                        className="cp-btn soft"
                        onClick={cancelForm}
                      >
                        Cancel
                      </button>
                      <button
                        className="cp-btn primary"
                        type="submit"
                        disabled={saving || departments.length === 0}
                      >
                        {saving
                          ? "Saving..."
                          : editingDoctorId
                            ? "✓ Update Doctor"
                            : "✓ Save Doctor"}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            )}

            <section className="cp-panel">
              <div className="cp-panel-heading">
                <div>
                  <h2>Registered Doctors</h2>
                  <p>Manage doctor profiles and availability</p>
                </div>
                <span className="cp-count">{doctors.length} doctors</span>
              </div>

              <div className="cp-table-wrap">
                <table className="cp-table">
                  <thead>
                    <tr>
                      <th>DOCTOR</th>
                      <th>SPECIALIZATION</th>
                      <th>DEPARTMENT</th>
                      <th>AVAILABILITY</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((d) => (
                      <tr key={d._id}>
                        <td>
                          <div className="cp-doctor-cell">
                            <div className="cp-doctor-avatar">
                              {(d.name || "D")
                                .replace(/^Dr\.?\s*/i, "")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <strong>{d.name}</strong>
                              <small>{d.email || "CarePlus Doctor"}</small>
                            </div>
                          </div>
                        </td>
                        <td>{d.specialization || "—"}</td>
                        <td>{d.department?.name || "—"}</td>
                        <td>
                          <span
                            className={`cp-status ${d.availabilityStatus || "unknown"}`}
                          >
                            <span /> {d.availabilityStatus || "Unknown"}
                          </span>
                        </td>
                        <td>
                          <div className="cp-actions">
                            <button
                              type="button"
                              className="cp-btn soft"
                              onClick={() => editDoctor(d)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="cp-delete"
                              onClick={() => deleteDoctor(d._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!doctors.length && (
                  <p className="cp-empty">No doctors found.</p>
                )}
              </div>
            </section>
          </>
        )}

        {tab === "appointments" && (
          <section className="cp-panel">
            <div className="cp-panel-heading">
              <div>
                <div className="cp-section-kicker">
                  APPOINTMENT MANAGEMENT
                </div>
                <h2>All Appointments</h2>
                <p>View patient bookings and update appointment status.</p>
              </div>
              <span className="cp-count">
                {filteredAppointments.length} records
              </span>
            </div>

            <div className="cp-search-filter">
              <input
                type="text"
                placeholder="Search patient or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search by patient or doctor name"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter appointments by status"
              >
                <option value="all">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="no-show">No-show</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                className="cp-btn soft"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear
              </button>
            </div>

            <p className="cp-filter-count">
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </p>

            {appointmentTable(filteredAppointments)}
          </section>
        )}

        <footer className="cp-footer">
          <span>✚ CarePlus</span> · Hospital Management System · 2026
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;