const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// "09:00", "12:00", 30  ->  ["09:00", "09:30", ... "11:30"]
const generateSlots = (startTime, endTime, slotDuration) => {
  const slots = [];
  for (
    let t = toMinutes(startTime);
    t + slotDuration <= toMinutes(endTime);
    t += slotDuration
  ) {
    slots.push(toTime(t));
  }
  return slots;
};

// Checks the format "YYYY-MM-DD"
const isValidDate = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !isNaN(new Date(`${date}T00:00:00`).getTime());

// Today as "YYYY-MM-DD" (uses the server's local time)
const todayString = () => new Date().toLocaleDateString("en-CA");

// All slot times a doctor offers on a given date.
// Returns [] if it's not a working day. For today, removes times already passed.
const getSlotsForDate = (doctor, date) => {
  const dayName = DAYS[new Date(`${date}T00:00:00`).getDay()];
  if (!doctor.workingDays.includes(dayName)) return [];

  let slots = generateSlots(doctor.startTime, doctor.endTime, doctor.slotDuration);

  if (date === todayString()) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    slots = slots.filter((slot) => toMinutes(slot) > nowMinutes);
  }

  return slots;
};

export { generateSlots, isValidDate, todayString, getSlotsForDate };
