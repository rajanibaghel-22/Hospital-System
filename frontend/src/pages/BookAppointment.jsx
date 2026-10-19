import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { useNavigate } from "react-router-dom";


function BookAppointment({ doctor, onBack, onBooked }) {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(doctor?._id || "");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [mode, setMode] = useState("in-person");
  const [reason, setReason] = useState("");

  const [questionnaire, setQuestionnaire] = useState({
    symptoms: "",
    duration: "",
    allergies: "",
    medicalHistory: "",
    currentMedicines: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await axios.get("/doctors");
        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : data.doctors || data.data || [];

        setDoctors(list);
      } catch {
        setError("Doctors load झाले नाहीत. Backend तपास.");
      }
    };

    loadDoctors();
  }, []);

  const selectedDoctor = doctors.find(
    (item) => item._id === doctorId
  );

  // In-person आणि Online options उपलब्ध ठेवले आहेत.
  const consultationModes = [
    ...new Set([
      ...(Array.isArray(selectedDoctor?.consultationModes)
        ? selectedDoctor.consultationModes
        : []),
      "in-person",
      "online",
    ]),
  ];

  const createSlots = () => {
    if (
      !selectedDoctor ||
      !selectedDoctor.startTime ||
      !selectedDoctor.endTime
    ) {
      return [];
    }

    const slots = [];

    const [startHour, startMinute] = selectedDoctor.startTime
      .split(":")
      .map(Number);

    const [endHour, endMinute] = selectedDoctor.endTime
      .split(":")
      .map(Number);

    let current = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    const duration = Number(selectedDoctor.slotDuration) || 30;

    while (current + duration <= end) {
      const hour = String(Math.floor(current / 60)).padStart(2, "0");
      const minute = String(current % 60).padStart(2, "0");

      slots.push(`${hour}:${minute}`);
      current += duration;
    }

    return slots;
  };

  const updateQuestionnaire = (field, value) => {
    setQuestionnaire((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleBooking = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Booking करण्यासाठी आधी login कर.");
      navigate("/login");
      return;
    }

    if (!doctorId || !date || !timeSlot) {
      setError("Doctor, date आणि time slot निवड.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/appointments", {
  doctorId,
  date,
  timeSlot,
  mode,
  reason,
  questionnaire,
}, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      const appointment = response.data.appointment;

      setMessage(
        `Appointment booked successfully! Token number: ${
          appointment?.tokenNumber ?? "Confirmed"
        }`
      );

      if (onBooked) {
        onBooked(appointment);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Booking failed. कृपया date आणि time slot तपास."
      );
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = createSlots();

  return (
    <section style={styles.page}>
      <div style={styles.card}>
        <button
          type="button"
          style={styles.back}
          onClick={onBack}
        >
          ← Back
        </button>

        <p style={styles.eyebrow}>CAREPLUS HEALTHCARE</p>

        <h2 style={styles.heading}>Book an Appointment</h2>

        <p style={styles.subtitle}>
          Choose your doctor, consultation time and share your
          health details before your visit.
        </p>

        {message ? (
          <div style={styles.success}>
            <div style={styles.successIcon}>✓</div>
            <h3>Booking Confirmed!</h3>
            <p>{message}</p>

            <p style={styles.successNote}>
              Your appointment details have been submitted.
            </p>

            <button
              type="button"
              style={styles.button}
              onClick={onBack}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleBooking}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                1. Appointment Details
              </h3>

              <label style={styles.label}>Select Doctor *</label>

              <select
                style={styles.input}
                value={doctorId}
                onChange={(event) => {
                  setDoctorId(event.target.value);
                  setTimeSlot("");
                  setMode("in-person");
                }}
                required
              >
                <option value="">Choose a doctor</option>

                {doctors.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {item.specialization}
                  </option>
                ))}
              </select>

              {selectedDoctor && (
                <div style={styles.doctorInfo}>
                  <strong>{selectedDoctor.name}</strong>
                  <span>{selectedDoctor.specialization}</span>

                  {selectedDoctor.consultationFee != null && (
                    <span>
                      Consultation fee: ₹
                      {selectedDoctor.consultationFee}
                    </span>
                  )}

                  {selectedDoctor.availabilityStatus && (
                    <span>
                      Availability: {selectedDoctor.availabilityStatus}
                    </span>
                  )}
                </div>
              )}

              <label style={styles.label}>Appointment Date *</label>

              <input
                style={styles.input}
                type="date"
                value={date}
                min={new Date().toLocaleDateString("en-CA")}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTimeSlot("");
                }}
                required
              />

              <label style={styles.label}>
                Available Time Slot *
              </label>

              <select
                style={styles.input}
                value={timeSlot}
                onChange={(event) => setTimeSlot(event.target.value)}
                required
              >
                <option value="">Choose a time</option>

                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>

              {selectedDoctor && availableSlots.length === 0 && (
                <p style={styles.hint}>
                  या doctor चे working hours उपलब्ध नाहीत.
                  कृपया doctor च्या startTime आणि endTime तपासा.
                </p>
              )}

              <label style={styles.label}>
                Consultation Mode *
              </label>

              <select
                style={styles.input}
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                required
              >
                {consultationModes.map((item) => (
                  <option key={item} value={item}>
                    {item === "in-person"
                      ? "In-person"
                      : item === "online"
                      ? "Online"
                      : item === "phone"
                      ? "Phone"
                      : item}
                  </option>
                ))}
              </select>

              <label style={styles.label}>
                Reason for Visit (Optional)
              </label>

              <textarea
                style={styles.textarea}
                placeholder="Briefly describe your reason for visiting"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
              />
            </div>

            <div style={styles.section}>
              <div style={styles.questionnaireHeader}>
                <div>
                  <p style={styles.eyebrow}>YOUR HEALTH MATTERS</p>
                  <h3 style={styles.sectionTitle}>
                    2. Health Questionnaire
                  </h3>
                </div>

                <span style={styles.optionalBadge}>Optional</span>
              </div>

              <p style={styles.questionnaireDescription}>
                Share relevant health information to help the
                healthcare team prepare for your appointment.
                You may leave these fields blank if you prefer.
              </p>

              <label style={styles.label}>
                What symptoms are you experiencing?
              </label>

              <textarea
                style={styles.textarea}
                placeholder="Example: headache, fever, cough..."
                value={questionnaire.symptoms}
                onChange={(event) =>
                  updateQuestionnaire("symptoms", event.target.value)
                }
                maxLength={500}
              />

              <label style={styles.label}>
                How long have you had these symptoms?
              </label>

              <select
                style={styles.input}
                value={questionnaire.duration}
                onChange={(event) =>
                  updateQuestionnaire("duration", event.target.value)
                }
              >
                <option value="">Select duration (optional)</option>
                <option value="Less than 24 hours">Less than 24 hours</option>
                <option value="1–3 days">1–3 days</option>
                <option value="4–7 days">4–7 days</option>
                <option value="1–2 weeks">1–2 weeks</option>
                <option value="More than 2 weeks">More than 2 weeks</option>
                <option value="Not applicable">Not applicable</option>
              </select>

              <label style={styles.label}>
                Do you have any known allergies?
              </label>

              <textarea
                style={styles.textarea}
                placeholder="Mention medicine, food or other allergies, or write None"
                value={questionnaire.allergies}
                onChange={(event) =>
                  updateQuestionnaire("allergies", event.target.value)
                }
                maxLength={300}
              />

              <label style={styles.label}>
                Previous medical history (if any)
              </label>

              <textarea
                style={styles.textarea}
                placeholder="Mention relevant past conditions or surgeries, or write None"
                value={questionnaire.medicalHistory}
                onChange={(event) =>
                  updateQuestionnaire(
                    "medicalHistory",
                    event.target.value
                  )
                }
                maxLength={500}
              />

              <label style={styles.label}>
                Current medicines (if any)
              </label>

              <textarea
                style={styles.textarea}
                placeholder="Mention medicines you currently take, or write None"
                value={questionnaire.currentMedicines}
                onChange={(event) =>
                  updateQuestionnaire(
                    "currentMedicines",
                    event.target.value
                  )
                }
                maxLength={300}
              />

              <p style={styles.privacyNote}>
                Please share only information relevant to your care.
                This questionnaire does not replace a medical
                consultation.
              </p>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              style={{
                ...styles.button,
                ...(loading ? styles.disabledButton : {}),
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Appointment →"}
            </button>

            <p style={styles.footerNote}>
              Please review your details before confirming.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "70vh",
    padding: "24px 16px",
    fontFamily: '"Segoe UI", Arial, sans-serif',
    background: "#f6f9fe",
  },
  card: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "30px",
    background: "#fff",
    border: "1px solid #e1ebf8",
    borderRadius: 22,
    boxShadow: "0 12px 35px #173f7010",
    boxSizing: "border-box",
  },
  back: {
    background: "transparent",
    border: "none",
    color: "#2477e8",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 22,
  },
  eyebrow: {
    color: "#2477e8",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    margin: "0 0 8px",
  },
  heading: {
    color: "#143663",
    fontSize: 28,
    margin: "0 0 8px",
  },
  subtitle: {
    color: "#7086a8",
    fontSize: 14,
    lineHeight: 1.7,
    marginBottom: 26,
  },
  section: {
    border: "1px solid #e4edf8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 22,
    background: "#fff",
  },
  sectionTitle: {
    color: "#143663",
    fontSize: 18,
    margin: "0 0 12px",
  },
  label: {
    display: "block",
    color: "#29476b",
    fontSize: 13,
    fontWeight: 700,
    margin: "17px 0 8px",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 13,
    border: "1px solid #d9e5f4",
    borderRadius: 10,
    background: "#fbfdff",
    color: "#17345f",
    fontSize: 14,
    outlineColor: "#2477e8",
  },
  textarea: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    minHeight: 85,
    padding: 13,
    border: "1px solid #d9e5f4",
    borderRadius: 10,
    background: "#fbfdff",
    color: "#17345f",
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
    outlineColor: "#2477e8",
  },
  doctorInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginTop: 12,
    padding: 13,
    borderRadius: 10,
    background: "#f1f7ff",
    color: "#4b6585",
    fontSize: 13,
  },
  questionnaireHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  optionalBadge: {
    color: "#52708f",
    background: "#eef4fb",
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },
  questionnaireDescription: {
    color: "#7086a8",
    fontSize: 13,
    lineHeight: 1.7,
    margin: "0 0 10px",
  },
  privacyNote: {
    marginTop: 18,
    padding: 12,
    background: "#f3f8ff",
    color: "#56708f",
    borderRadius: 9,
    fontSize: 12,
    lineHeight: 1.7,
  },
  hint: {
    color: "#9a6a15",
    fontSize: 12,
  },
  button: {
    width: "100%",
    padding: 14,
    marginTop: 22,
    background: "#2477e8",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.7,
    cursor: "wait",
  },
  error: {
    color: "#bd3333",
    background: "#fff0f0",
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },
  success: {
    background: "#eaf9f0",
    color: "#176a45",
    padding: 22,
    borderRadius: 12,
    textAlign: "center",
  },
  successIcon: {
    width: 48,
    height: 48,
    margin: "0 auto 12px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#c9f0da",
    fontSize: 26,
    fontWeight: 800,
  },
  successNote: {
    fontSize: 13,
    lineHeight: 1.6,
  },
  footerNote: {
    color: "#8193aa",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
};

export default BookAppointment;
