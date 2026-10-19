import { useState, useEffect, useCallback } from "react";

import "./Dashboard.css";
import BookAppointment from "./BookAppointment";
import { useNavigate, Link } from "react-router-dom";

import axios from "../lib/axios";
const API_URL = "";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("Overview");
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRatings, setFeedbackRatings] = useState({});
  const [feedbackComments, setFeedbackComments] = useState({});
  const [submittingFeedback, setSubmittingFeedback] = useState({});
  const [submittedFeedback, setSubmittedFeedback] = useState({});

  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    age: user?.age ?? "",
    gender: user?.gender || "",
    bloodGroup: user?.bloodGroup || "",
    role: user?.role || "patient",
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    if (activeTab !== "Doctors") return;

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setDoctorError("");

      try {
        const response = await axios.get(`${API_URL}/doctors`, {
          params: {
            search: search || undefined,
            department: department || undefined,
          },
        });

        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : data.doctors || data.data || [];

        setDoctors(list);
      } catch (error) {
        setDoctorError(
          error.response?.data?.message ||
            "Could not load doctors. Please check the backend."
        );
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [activeTab, search, department]);

  const fetchAppointments = useCallback(async () => {
    if (!token) return;

    setLoadingAppointments(true);
    setAppointmentError("");

    try {
      const response = await axios.get(`${API_URL}/appointments/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.appointments || data.data || [];

      setAppointments(list);
    } catch (error) {
      setAppointmentError(
        error.response?.data?.message ||
          "Could not load appointments. Please try again."
      );
    } finally {
      setLoadingAppointments(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab !== "Appointments" || !token) return;

    let isCurrent = true;
    queueMicrotask(() => {
      if (isCurrent) {
        void fetchAppointments();
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [activeTab, fetchAppointments, token]);

  const handleCancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    try {
      await axios.patch(
        `${API_URL}/appointments/${appointmentId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointmentMessage("Appointment cancelled successfully.");
      fetchAppointments();
    } catch (error) {
      window.alert(
        error.response?.data?.message ||
          "Unable to cancel appointment. Please try again."
      );
    }
  };

  const handleSubmitFeedback = async (appointmentId) => {
    const rating = feedbackRatings[appointmentId];
    const comment = feedbackComments[appointmentId] || "";

    if (!rating) {
      setFeedbackMessage("Please select a star rating first.");
      return;
    }

    setSubmittingFeedback((previous) => ({
      ...previous,
      [appointmentId]: true,
    }));

    setFeedbackMessage("");

    try {
      await axios.post(
        `${API_URL}/feedback`,
        { appointmentId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmittedFeedback((previous) => ({
        ...previous,
        [appointmentId]: true,
      }));

      setFeedbackMessage(
        "Thank you! Your feedback was submitted successfully."
      );
    } catch (error) {
      setFeedbackMessage(
        error.response?.data?.message ||
          "Could not submit feedback. Please try again."
      );
    } finally {
      setSubmittingFeedback((previous) => ({
        ...previous,
        [appointmentId]: false,
      }));
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        {
          name: profile.name.trim(),
          phone: profile.phone,
          age: profile.age === "" ? undefined : Number(profile.age),
          gender: profile.gender || undefined,
          bloodGroup: profile.bloodGroup || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = response.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfile({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        age: updatedUser.age ?? "",
        gender: updatedUser.gender || "",
        bloodGroup: updatedUser.bloodGroup || "",
        role: updatedUser.role || "patient",
      });

      setIsEditingProfile(false);
      setProfileMessage("Profile updated successfully!");
    } catch (error) {
      setProfileError(
        error.response?.data?.message ||
          "Could not update profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileEdit = () => {
    setProfileMessage("");
    setProfileError("");
    setIsEditingProfile(true);
  };

  const handleProfileCancel = () => {
    const latestUser = JSON.parse(localStorage.getItem("user") || "null");

    setProfile({
      name: latestUser?.name || "",
      email: latestUser?.email || "",
      phone: latestUser?.phone || "",
      age: latestUser?.age ?? "",
      gender: latestUser?.gender || "",
      bloodGroup: latestUser?.bloodGroup || "",
      role: latestUser?.role || "patient",
    });

    setProfileError("");
    setProfileMessage("");
    setIsEditingProfile(false);
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleViewDoctorDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorDetails(true);
  };

  if (showBooking) {
    return (
      <BookAppointment
        doctor={selectedDoctor}
        onBack={() => setShowBooking(false)}
        onBooked={() => {
          setShowBooking(false);
          setShowDoctorDetails(false);
          setActiveTab("Appointments");
          setAppointmentMessage("Appointment booked successfully!");
          fetchAppointments();
        }}
      />
    );
  }

  if (showDoctorDetails && selectedDoctor) {
    const doctor = selectedDoctor;

    return (
      <div className="dashboard-page">
        <aside className="dashboard-sidebar">
          <Link to="/" className="dashboard-logo">
            ✚ Care<span>Plus</span>
          </Link>

          <p className="sidebar-label">PATIENT MENU</p>

          <button
            className="menu-item"
            onClick={() => {
              setShowDoctorDetails(false);
              setActiveTab("Overview");
            }}
          >
            🏠 Overview
          </button>

          <button
            className="menu-item active"
            onClick={() => setShowDoctorDetails(false)}
          >
            🩺 Find Doctors
          </button>

          <button
            className="menu-item"
            onClick={() => {
              setShowDoctorDetails(false);
              setActiveTab("Appointments");
            }}
          >
            📅 My Appointments
          </button>

          <button
            className="menu-item"
            onClick={() => {
              setShowDoctorDetails(false);
              setActiveTab("Profile");
            }}
          >
            👤 My Profile
          </button>

          <button className="menu-item logout-button" onClick={handleLogout}>
            ↪ Logout
          </button>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
            <div>
              <p className="dashboard-greeting">CAREPLUS SPECIALIST</p>
              <h1>Doctor Details</h1>
              <p>Learn more about your selected doctor.</p>
            </div>
          </header>

          <section className="dashboard-content-card doctor-details-page">
            <button
              type="button"
              className="book-appointment-button"
              onClick={() => setShowDoctorDetails(false)}
            >
              ← Back to Doctors
            </button>

            <div className="doctor-avatar">🩺</div>

            <h2>{doctor.name || doctor.fullName || "Doctor"}</h2>

            <p className="doctor-speciality">
              {doctor.specialization || "Medical Specialist"}
            </p>

            <div className="doctor-info-row">
              <span>🏥 Department</span>
              <strong>
                {typeof doctor.department === "object"
                  ? doctor.department?.name || "Not specified"
                  : doctor.department || "Not specified"}
              </strong>
            </div>

            <div className="doctor-info-row">
              <span>🎓 Qualification</span>
              <strong>{doctor.qualification || "Not specified"}</strong>
            </div>

            <div className="doctor-info-row">
              <span>💼 Experience</span>
              <strong>{doctor.experience ?? 0} years</strong>
            </div>

            <div className="doctor-info-row">
              <span>💰 Consultation Fee</span>
              <strong>
                ₹{doctor.consultationFee ?? doctor.fee ?? "—"}
              </strong>
            </div>

            <div className="doctor-info-row">
              <span>🩺 Availability</span>
              <strong>{doctor.availabilityStatus || "Check slots"}</strong>
            </div>

            {doctor.email && (
              <div className="doctor-info-row">
                <span>✉️ Email</span>
                <strong>{doctor.email}</strong>
              </div>
            )}

            {doctor.phone && (
              <div className="doctor-info-row">
                <span>📞 Contact</span>
                <strong>{doctor.phone}</strong>
              </div>
            )}

            {doctor.bio && (
              <div className="doctor-description">
                <h3>About the Doctor</h3>
                <p>{doctor.bio}</p>
              </div>
            )}

            <button
              type="button"
              className="book-appointment-button"
              disabled={
                doctor.availabilityStatus === "busy" ||
                doctor.availabilityStatus === "on-leave"
              }
              onClick={() => {
                if (!token) {
                  window.alert("Please log in to book an appointment.");
                  navigate("/login");
                  return;
                }

                setShowBooking(true);
              }}
            >
              {doctor.availabilityStatus === "busy" ||
              doctor.availabilityStatus === "on-leave"
                ? "Currently Unavailable"
                : "Book Appointment →"}
            </button>
          </section>

          <footer className="dashboard-footer">
            © 2026 CarePlus · Online Hospital Appointment Booking System
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-logo">
          ✚ Care<span>Plus</span>
        </Link>

        <p className="sidebar-label">PATIENT MENU</p>

        <button
          className={activeTab === "Overview" ? "menu-item active" : "menu-item"}
          onClick={() => setActiveTab("Overview")}
        >
          🏠 Overview
        </button>

        <button
          className={activeTab === "Doctors" ? "menu-item active" : "menu-item"}
          onClick={() => {
            setShowBooking(false);
            setShowDoctorDetails(false);
            setActiveTab("Doctors");
          }}
        >
          🩺 Find Doctors
        </button>

        <button
          className={
            activeTab === "Appointments" ? "menu-item active" : "menu-item"
          }
          onClick={() => setActiveTab("Appointments")}
        >
          📅 My Appointments
        </button>

        <button
          className={activeTab === "Profile" ? "menu-item active" : "menu-item"}
          onClick={() => {
            setProfileMessage("");
            setProfileError("");
            setActiveTab("Profile");
          }}
        >
          👤 My Profile
        </button>

        <button
          className={
            activeTab === "Hospital Location"
              ? "menu-item active"
              : "menu-item"
          }
          onClick={() => {
            setShowDoctorDetails(false);
            setShowBooking(false);
            setActiveTab("Hospital Location");
          }}
        >
          📍 Hospital Location
        </button>

        <button className="menu-item logout-button" onClick={handleLogout}>
          ↪ Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-greeting">PATIENT DASHBOARD</p>
            <h1>Hello  👋</h1>
            <p>Welcome to your personal healthcare space.</p>
          </div>

          <div className="profile-badge">
            <span>👤</span>
            <div>
              <strong>{profile.name || "Patient"}</strong>
              <small>Patient</small>
            </div>
          </div>
        </header>

        {activeTab === "Overview" && (
          <>
            <section className="welcome-card">
              <div>
                <span>YOUR HEALTH, OUR PRIORITY</span>
                <h2>Expert care for a healthier you.</h2>
                <p>
                  Find trusted doctors, explore specialities and manage your
                  hospital appointments in one place.
                </p>
                <button onClick={() => setActiveTab("Doctors")}>
                  Find a Doctor →
                </button>
              </div>
              <div className="welcome-symbol">✚</div>
            </section>

            <h2 className="section-title">Quick Access</h2>

            <section className="dashboard-cards">
              <button
                className="dashboard-card"
                onClick={() => setActiveTab("Doctors")}
              >
                <span className="card-icon blue-icon">🩺</span>
                <h3>Find Doctors</h3>
                <p>Explore doctor details and specialities.</p>
                <strong>Explore →</strong>
              </button>

              <button
                className="dashboard-card"
                onClick={() => setActiveTab("Appointments")}
              >
                <span className="card-icon green-icon">📅</span>
                <h3>My Appointments</h3>
                <p>View and manage your appointments.</p>
                <strong>View Appointments →</strong>
              </button>

              <button
                className="dashboard-card"
                onClick={() => setActiveTab("Profile")}
              >
                <span className="card-icon purple-icon">👤</span>
                <h3>My Profile</h3>
                <p>Check your account information.</p>
                <strong>View Profile →</strong>
              </button>
            </section>
          </>
        )}

        {activeTab === "Doctors" && (
          <section className="dashboard-content-card">
            <p className="dashboard-greeting">CAREPLUS SPECIALISTS</p>
            <h2>Find the right doctor for you</h2>
            <p>Explore our specialists and choose the care you need.</p>

            <div className="doctor-filters">
              <input
                type="text"
                placeholder="🔍 Search by doctor or speciality"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <input
                type="text"
                placeholder="Department (e.g. Cardiology)"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            {loadingDoctors && <p>Loading doctors...</p>}
            {doctorError && <p className="doctor-error">{doctorError}</p>}

            {!loadingDoctors && !doctorError && doctors.length === 0 && (
              <p>No doctors found. Try another search.</p>
            )}

            <div className="doctor-grid">
              {doctors.map((doctor) => (
                <article
                  className="doctor-card"
                  key={doctor._id || doctor.id}
                >
                  <div className="doctor-card-top">
                    <div className="doctor-avatar">🩺</div>

                    <span
                      className={`availability-badge ${
                        doctor.availabilityStatus === "available"
                          ? "status-available"
                          : doctor.availabilityStatus === "busy"
                          ? "status-busy"
                          : "status-leave"
                      }`}
                    >
                      <span className="status-dot"></span>
                      {doctor.availabilityStatus || "Check slots"}
                    </span>
                  </div>

                  <h3>{doctor.name || doctor.fullName || "Doctor"}</h3>

                  <p className="doctor-speciality">
                    {doctor.specialization || "Medical Specialist"}
                  </p>

                  <div className="doctor-info-row">
                    <span>🏥 Department</span>
                    <strong>
                      {typeof doctor.department === "object"
                        ? doctor.department?.name || "Not specified"
                        : doctor.department || "Not specified"}
                    </strong>
                  </div>

                  <div className="doctor-info-row">
                    <span>🎓 Qualification</span>
                    <strong>
                      {doctor.qualification || "Qualified Doctor"}
                    </strong>
                  </div>

                  <div className="doctor-info-row">
                    <span>💼 Experience</span>
                    <strong>{doctor.experience ?? 0} years</strong>
                  </div>

                  <div className="doctor-card-bottom">
                    <div>
                      <small>Consultation Fee</small>
                      <strong className="doctor-fee">
                        ₹{doctor.consultationFee ?? doctor.fee ?? "—"}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="book-appointment-button"
                      onClick={() => handleViewDoctorDetails(doctor)}
                    >
                      View Doctor Details →
                    </button>

                    <button
                      type="button"
                      className="book-appointment-button"
                      onClick={() => {
                        if (!token) {
                          window.alert("Please log in to book an appointment.");
                          navigate("/login");
                          return;
                        }

                        setSelectedDoctor(doctor);
                        setShowBooking(true);
                      }}
                    >
                      Book Appointment →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Appointments" && (
          <section className="dashboard-content-card">
            <p className="dashboard-greeting">YOUR BOOKINGS</p>
            <h2>My Appointments 📅</h2>

            {appointmentMessage && (
              <p className="appointment-success">{appointmentMessage}</p>
            )}

            {feedbackMessage && (
              <p className="appointment-success">{feedbackMessage}</p>
            )}

            {appointmentError && (
              <p className="doctor-error">{appointmentError}</p>
            )}

            {loadingAppointments && <p>Loading appointments...</p>}

            {!loadingAppointments &&
              !appointmentError &&
              appointments.length === 0 && (
                <p>
                  You have no appointments yet. Go to Find Doctors to book
                  your first appointment.
                </p>
              )}

            <div className="doctor-grid">
              {appointments.map((appointment) => {
                const appointmentId = appointment._id || appointment.id;

                return (
                  <article className="doctor-card" key={appointmentId}>
                    <div className="doctor-card-top">
                      <div className="doctor-avatar">📅</div>
                      <span className="availability-badge status-available">
                        {appointment.status || "Booked"}
                      </span>
                    </div>

                    <h3>
                      {appointment.doctor?.name ||
                        appointment.doctorName ||
                        "Doctor"}
                    </h3>

                    <p className="doctor-speciality">
                      {appointment.department?.name ||
                        appointment.department ||
                        "Department not specified"}
                    </p>

                    <div className="doctor-info-row">
                      <span>📆 Date</span>
                      <strong>{formatDate(appointment.date)}</strong>
                    </div>

                    <div className="doctor-info-row">
                      <span>🕒 Time</span>
                      <strong>
                        {appointment.timeSlot ||
                          appointment.time ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div className="doctor-info-row">
                      <span>🎟️ Token</span>
                      <strong>{appointment.tokenNumber ?? "—"}</strong>
                    </div>

                    <div className="doctor-info-row">
                      <span>💰 Fee</span>
                      <strong>
                        ₹{appointment.fee ?? appointment.consultationFee ?? "—"}
                      </strong>
                    </div>

                    {appointment.status !== "cancelled" &&
                      appointment.status !== "completed" && (
                        <button
                          className="book-appointment-button"
                          onClick={() =>
                            handleCancelAppointment(appointmentId)
                          }
                        >
                          Cancel Appointment
                        </button>
                      )}

                    {appointment.status === "completed" && (
                      <div className="feedback-form">
                        <h4>⭐ Rate Your Experience</h4>

                        {submittedFeedback[appointmentId] ? (
                          <p className="feedback-success">
                            ✓ Feedback submitted successfully!
                          </p>
                        ) : (
                          <>
                            <p>Select your rating:</p>

                            <div className="feedback-stars">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const selectedRating =
                                  feedbackRatings[appointmentId] || 0;

                                return (
                                  <button
                                    type="button"
                                    key={star}
                                    className={
                                      star <= selectedRating
                                        ? "feedback-star selected"
                                        : "feedback-star"
                                    }
                                    onClick={() => {
                                      setFeedbackRatings((previous) => ({
                                        ...previous,
                                        [appointmentId]: star,
                                      }));
                                      setFeedbackMessage("");
                                    }}
                                    aria-label={`${star} star rating`}
                                  >
                                    ★
                                  </button>
                                );
                              })}
                            </div>

                            <textarea
                              className="feedback-comment"
                              placeholder="Write your feedback about the doctor (optional)"
                              value={feedbackComments[appointmentId] || ""}
                              maxLength={500}
                              onChange={(e) =>
                                setFeedbackComments((previous) => ({
                                  ...previous,
                                  [appointmentId]: e.target.value,
                                }))
                              }
                            />

                            <button
                              type="button"
                              className="book-appointment-button"
                              disabled={submittingFeedback[appointmentId]}
                              onClick={() =>
                                handleSubmitFeedback(appointmentId)
                              }
                            >
                              {submittingFeedback[appointmentId]
                                ? "Submitting..."
                                : "Submit Feedback"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <button
              className="book-appointment-button"
              onClick={() => setActiveTab("Doctors")}
            >
              + Book New Appointment
            </button>
          </section>
        )}

        {activeTab === "Profile" && (
          <section className="dashboard-content-card profile-page">
            <div className="profile-hero">
              <div className="profile-hero-avatar">👤</div>

              <div className="profile-hero-text">
                <span className="profile-eyebrow">YOUR ACCOUNT</span>
                <h2>My Profile</h2>
                <p>Manage your personal information securely.</p>
              </div>

              <div className="profile-security-icon">🛡️</div>
            </div>

            {profileMessage && (
              <p className="appointment-success">{profileMessage}</p>
            )}

            {profileError && (
              <p className="doctor-error">{profileError}</p>
            )}

            {!isEditingProfile ? (
              <>
                <div className="profile-info-grid">
                  <div className="profile-info-card">
                    <span className="profile-info-icon">👤</span>
                    <div>
                      <small>Full Name</small>
                      <strong>{profile.name || "Not added"}</strong>
                    </div>
                  </div>

                  <div className="profile-info-card">
                    <span className="profile-info-icon">✉️</span>
                    <div>
                      <small>Email Address</small>
                      <strong>{profile.email || "Not added"}</strong>
                    </div>
                  </div>

                  <div className="profile-info-card">
                    <span className="profile-info-icon">📞</span>
                    <div>
                      <small>Phone Number</small>
                      <strong>{profile.phone || "Not added"}</strong>
                    </div>
                  </div>

                  <div className="profile-info-card">
                    <span className="profile-info-icon"></span>
                    <div>
                      <small>Age</small>
                      <strong>
                        {profile.age !== "" ? profile.age : "Not added"}
                      </strong>
                    </div>
                  </div>

                  <div className="profile-info-card">
                    <span className="profile-info-icon">⚧</span>
                    <div>
                      <small>Gender</small>
                      <strong>
                        {profile.gender
                          ? profile.gender.charAt(0).toUpperCase() +
                            profile.gender.slice(1)
                          : "Not added"}
                      </strong>
                    </div>
                  </div>

                  <div className="profile-info-card">
                    <span className="profile-info-icon">🩸</span>
                    <div>
                      <small>Blood Group</small>
                      <strong>{profile.bloodGroup || "Not added"}</strong>
                    </div>
                  </div>
                </div>

                <div className="profile-bottom">
                  <div className="profile-account-status">
                    <span>●</span>
                    <div>
                      <strong>Patient Account</strong>
                      <small>CarePlus Healthcare</small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={handleProfileEdit}
                  >
                    ✏️ Edit Profile
                  </button>
                </div>
              </>
            ) : (
              <form
                className="profile-edit-form"
                onSubmit={handleProfileSave}
              >
                <h3 className="profile-form-heading">
                  Edit Personal Information
                </h3>

                <p className="profile-form-description">
                  Keep your details up to date for a better healthcare
                  experience.
                </p>

                <div className="profile-form-grid">
                  <label>
                    Full Name
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      required
                      maxLength={80}
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                    />
                    <small>Email cannot be changed.</small>
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      maxLength={20}
                    />
                  </label>

                  <label>
                    Age
                    <input
                      type="number"
                      name="age"
                      value={profile.age}
                      onChange={handleProfileChange}
                      min="0"
                      max="120"
                    />
                  </label>

                  <label>
                    Gender
                    <select
                      name="gender"
                      value={profile.gender}
                      onChange={handleProfileChange}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label>
                    Blood Group
                    <select
                      name="bloodGroup"
                      value={profile.bloodGroup}
                      onChange={handleProfileChange}
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </label>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="profile-edit-button"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : " Save Changes"}
                  </button>

                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={handleProfileCancel}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {activeTab === "Hospital Location" && (
          <section className="dashboard-content-card">
            <p className="dashboard-greeting">CAREPLUS HOSPITAL</p>
            <h2>Hospital Location Details📍</h2>
            <p></p>

            <div className="doctor-info-row">
              <span>🏥 Hospital Name</span>
              <strong>CarePlus Multispeciality Hospital</strong>
            </div>

            <div className="doctor-info-row">
              <span>📍 Address</span>
              <strong>Pune, Maharashtra, India </strong>
            </div>

            <div className="doctor-info-row">
              <span>📞 Contact Number</span>
              <strong>+91 98765 43210 </strong>
            </div>

            <a
              className="book-appointment-button"
              href="https://www.google.com/maps/search/?api=1&query=hospitals+in+Pune+Maharashtra"
              target="_blank"
              rel="noreferrer"
            >
              🗺️ Get Directions on Google Maps →
            </a>

            <p style={{ marginTop: "20px", fontSize: "13px" }}>
              
            </p>
          </section>
        )}

        <footer className="dashboard-footer">
          © 2026 CarePlus · Online Hospital Appointment Booking System
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;