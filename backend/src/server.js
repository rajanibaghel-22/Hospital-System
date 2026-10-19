import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

// Gather allowed origins
const rawOrigins = (process.env.CLIENT_URL || "").split(",");
const allowedOrigins = [
  "https://hospital-appointment-system-ehpl.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...rawOrigins.map((o) => o.trim()).filter(Boolean),
];

// CORS configuration (handles GET, POST, and preflight OPTIONS automatically)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed.replace(/\/$/, "") === cleanOrigin
      );
      if (isAllowed || process.env.CLIENT_URL === "*") {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Hospital Booking API!" });
});

app.use("/api", routes);

// Error handlers (must stay last)
app.use(notFound);
app.use(errorHandler);

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/`);
});
