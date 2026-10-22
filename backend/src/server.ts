
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./auth.js";
import loansRouter from "./loans.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security headers and request parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Global limit: all endpoints, including health, auth, and loans
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Try again in 15 minutes." },
});

app.use(globalLimiter);

// Stricter limit for OTP request and verification endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many authentication requests. Try again later." },
});

app.use("/auth", authLimiter);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "MiniLedger API is running",
  });
});

app.use("/auth", authRouter);
app.use("/loans", loansRouter);

app.listen(PORT, () => {
  console.log(`MiniLedger API running at http://localhost:${PORT}`);
});
