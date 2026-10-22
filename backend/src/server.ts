
import helmet from "helmet";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./auth.js";
import loansRouter from "./loans.js";
import { createTokenBucket } from "./token-bucket.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Global token bucket: capacity 100, refill 100 tokens every 15 minutes.
app.use(
  createTokenBucket({
    capacity: 100,
    refillRatePerSecond: 100 / 900,
    message: "Too many requests. Try again later.",
  })
);

// Additional token bucket for authentication endpoints.
app.use(
  "/auth",
  createTokenBucket({
    capacity: 20,
    refillRatePerSecond: 20 / 900,
    message: "Too many authentication requests. Try again later.",
  })
);

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
