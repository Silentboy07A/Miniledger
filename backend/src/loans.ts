
import { Router } from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { requireAuth, type AuthRequest } from "./auth-middleware.js";

const router = Router();

const loanSchema = z.object({
  friendName: z.string().trim().min(1).max(100),
  amount: z.coerce.number().finite().positive().max(9999999999.99),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

router.use(requireAuth);

router.post("/", async (req: AuthRequest, res) => {
  const parsed = loanSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid loan details",
      details: parsed.error.flatten(),
    });
    return;
  }

  const { friendName, amount, dueDate } = parsed.data;

  try {
    const result = await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date)
       SELECT id, $2, $3, $4::date
       FROM users
       WHERE id = $1
       RETURNING id, friend_name AS "friendName", amount,
                 due_date AS "dueDate", repaid_at AS "repaidAt",
                 created_at AS "createdAt"`,
      [req.userId, friendName, amount, dueDate]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.status(201).json({ success: true, loan: result.rows[0] });
  } catch (error) {
    console.error("Create loan failed:", error);
    res.status(500).json({ error: "Unable to create loan" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT id, friend_name AS "friendName", amount,
              due_date AS "dueDate", repaid_at AS "repaidAt",
              created_at AS "createdAt",
              (repaid_at IS NULL AND due_date < CURRENT_DATE) AS overdue
       FROM loans
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({ success: true, loans: result.rows });
  } catch (error) {
    console.error("List loans failed:", error);
    res.status(500).json({ error: "Unable to retrieve loans" });
  }
});

router.patch("/:id/repay", async (req: AuthRequest, res) => {
  const idSchema = z.string().uuid().safeParse(req.params.id);

  if (!idSchema.success) {
    res.status(400).json({ error: "Invalid loan ID" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE loans
       SET repaid_at = NOW()
       WHERE id = $1 AND user_id = $2 AND repaid_at IS NULL
       RETURNING id, friend_name AS "friendName", amount,
                 due_date AS "dueDate", repaid_at AS "repaidAt"`,
      [idSchema.data, req.userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Loan not found or already repaid" });
      return;
    }

    res.json({ success: true, loan: result.rows[0] });
  } catch (error) {
    console.error("Repay loan failed:", error);
    res.status(500).json({ error: "Unable to mark loan as repaid" });
  }
});

router.get("/summary", async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(amount), 0)::numeric(12,2) AS "totalLent",
         COALESCE(SUM(amount) FILTER (WHERE repaid_at IS NOT NULL), 0)::numeric(12,2) AS "totalRepaid",
         COALESCE(SUM(amount) FILTER (
           WHERE repaid_at IS NULL AND due_date < CURRENT_DATE
         ), 0)::numeric(12,2) AS "overdueAmount"
       FROM loans
       WHERE user_id = $1`,
      [req.userId]
    );

    res.json({ success: true, summary: result.rows[0] });
  } catch (error) {
    console.error("Loan summary failed:", error);
    res.status(500).json({ error: "Unable to calculate summary" });
  }
});

export default router;
