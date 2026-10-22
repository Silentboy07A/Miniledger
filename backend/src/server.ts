
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./auth.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.use(
  "/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Try again later." },
  })
);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "MiniLedger API is running",
  });
});

app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`MiniLedger API running at http://localhost:${PORT}`);
});
