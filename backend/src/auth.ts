import { Router } from "express";
import { randomInt, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "./db.js";

const router = Router();

const otpTtlMinutes = Number(process.env.OTP_TTL_MINUTES) || 5;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number");

router.post("/request-otp", async (req, res) => {
  const parsed = z.object({ phone: phoneSchema }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid phone number" });
    return;
  }

  const phone = parsed.data.phone;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Prevent repeated requests from creating unlimited OTPs for one phone.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [phone]
    );

    const recent = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM otps
       WHERE phone = $1
         AND created_at > NOW() - INTERVAL '15 minutes'`,
      [phone]
    );

    if (recent.rows[0].count >= 5) {
      await client.query("ROLLBACK");
      res.status(429).json({ error: "Too many OTP requests. Try again later." });
      return;
    }

    const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + otpTtlMinutes * 60_000);

    await client.query(
      `UPDATE otps SET used_at = NOW()
       WHERE phone = $1 AND used_at IS NULL`,
      [phone]
    );

    await client.query(
      `INSERT INTO otps (id, phone, otp_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), phone, otpHash, expiresAt]
    );

    await client.query("COMMIT");

    // Mock delivery: the OTP is visible only in the backend terminal.
    console.log(`[MiniLedger] Mock OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: "OTP generated. Check the backend terminal.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("OTP request failed:", error);
    res.status(500).json({ error: "Unable to generate OTP" });
  } finally {
    client.release();
  }
});

router.post("/verify-otp", async (req, res) => {
  const parsed = z.object({
    phone: phoneSchema,
    otp: z.string().regex(/^\d{6}$/, "OTP must contain six digits"),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid phone number and six-digit OTP" });
    return;
  }

  const { phone, otp } = parsed.data;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the latest unused OTP to prevent simultaneous reuse.
    const otpResult = await client.query(
      `SELECT id, otp_hash, expires_at, attempts
       FROM otps
       WHERE phone = $1 AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [phone]
    );

    if (otpResult.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    const record = otpResult.rows[0];

    if (new Date(record.expires_at).getTime() <= Date.now() || record.attempts >= 5) {
      await client.query(
        "UPDATE otps SET used_at = NOW() WHERE id = $1",
        [record.id]
      );
      await client.query("COMMIT");
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    const matches = await bcrypt.compare(otp, record.otp_hash);

    if (!matches) {
      await client.query(
        `UPDATE otps
         SET attempts = attempts + 1,
             used_at = CASE WHEN attempts + 1 >= 5 THEN NOW() ELSE used_at END
         WHERE id = $1`,
        [record.id]
      );
      await client.query("COMMIT");
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    await client.query(
      "UPDATE otps SET used_at = NOW() WHERE id = $1",
      [record.id]
    );

    const userResult = await client.query(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone`,
      [phone]
    );

    await client.query("COMMIT");

    const user = userResult.rows[0];
    const token = jwt.sign(
      { sub: user.id, phone: user.phone },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "15m") as jwt.SignOptions["expiresIn"] }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, phone: user.phone },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("OTP verification failed:", error);
    res.status(500).json({ error: "Unable to verify OTP" });
  } finally {
    client.release();
  }
});

export default router;