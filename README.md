# MiniLedger 💳

> Personal loan and ledger tracking application designed for tracking money lent to friends and peers, managing repayment schedules, and monitoring overdue balances with confidence.

MiniLedger is built with **React Native (Expo)**, **TypeScript**, **Node.js / Express**, and **PostgreSQL**. It offers a clean, fintech-grade interface with desktop and mobile responsive layouts, passwordless phone OTP authentication, real-time metrics, search/filtering, and one-tap repayment settlement.

---

## Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│               MiniLedger Client (Mobile & Web)         │
│   • Expo SDK 58 / React Native 0.88                    │
│   • TypeScript / React Navigation v7                   │
│   • Responsive layout (Web Desktop & Mobile iOS/Android)│
│   • Secure token persistence (Expo SecureStore / Web)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs (Bearer JWT)
┌───────────────────────────▼────────────────────────────┐
│               MiniLedger API Server (Express)          │
│   • Express 5 / TypeScript (tsx)                       │
│   • Rate Limiting (Token Bucket + express-rate-limit)  │
│   • Helmet / CORS / Zod schema validation              │
│   • Passwordless OTP auth (Bcrypt hashed, 5-min TTL)   │
└───────────────────────────┬────────────────────────────┘
                            │ Parameterized SQL Queries
┌───────────────────────────▼────────────────────────────┐
│               PostgreSQL Database                      │
│   • users, otps, loans tables                          │
│   • PostgreSQL Advisory Transaction Locks              │
│   • Server-side financial aggregation & overdue check  │
└────────────────────────────────────────────────────────┘
```

### Frontend (`/mobile`)
- **Framework**: React Native 0.88 with Expo SDK 58
- **Language**: TypeScript
- **Routing**: React Navigation v7 (Native Stack)
- **Icons**: Lucide React Native
- **Storage**: `expo-secure-store` (Native) with browser storage fallback (Web)
- **Date Handling**: Native DateTimePicker on Android/iOS; native standard input on Web; local calendar-safe date calculations to eliminate UTC midnight timezone shifts
- **Formatting**: Indian Rupee (`₹`) grouping standard, relative date humanization ("Due in 3 days", "2 days overdue", "Settled")

### Backend (`/backend`)
- **Runtime**: Node.js v20+ / Express 5
- **Language**: TypeScript (running directly via `tsx watch`)
- **Database**: PostgreSQL with connection pooling (`pg`)
- **Security**: Helmet, CORS, Bcrypt for OTP hashing, JWT authentication
- **Rate Limiting**: Custom token bucket rate limiter and `express-rate-limit`
- **Concurrency Control**: `pg_advisory_xact_lock` preventing parallel OTP brute force or race conditions

---

## Key Features

1. **Passwordless OTP Authentication**
   - Enter standard 10-digit Indian mobile number (`+91`).
   - Mock delivery logs the 6-digit OTP directly to the backend server terminal.
   - Single-use OTPs with 5-minute TTL and 5-attempt brute-force protection.
   - Resend timer cooldown (30s) and phone number masking (`+91 ••••• 3210`).

2. **Executive Ledger Dashboard**
   - Centered responsive container (up to 1040px max width).
   - Real-time financial summary cards: **Total Lent**, **Total Repaid**, and **Overdue Amount** calculated directly from PostgreSQL.
   - Non-redundant, intuitive actions: primary "Record New Loan" call-to-action in the overview section.
   - Fast instant search by friend's name and quick status filter chips (**All**, **Active**, **Overdue**, **Repaid**).

3. **Loan Creation**
   - Friend name, amount in INR (`₹`), and repayment due date.
   - Quick date presets (+7 Days, +2 Weeks, +1 Month) for fast entry.
   - Clear distinction between required fields and optional fields.
   - Duplicate submission protection with loading state locks.

4. **Loan Details & One-Tap Settlement**
   - Distinct, non-jarring visual indicators for overdue, active, and settled loans.
   - Confirmation dialog before settling loan.
   - Immediate status transition and dashboard summary metric re-calculation upon repayment.

---

## Security & Engineering Highlights

- **No Stored Plaintext Secrets**: Passwords, secrets, and OTPs are never stored in plaintext. OTPs are hashed using `bcrypt` (cost 10) before persisting.
- **Race Condition Prevention**: `pg_advisory_xact_lock(hashtext($1))` serializes OTP requests per phone number within database transactions.
- **Strict Parameterized Queries**: All database interactions use parameter substitution (`$1, $2, ...`) eliminating SQL injection risks.
- **Token Security**: Stateless JWT tokens carry a short expiration (`15m`) and require high-entropy signing keys (minimum 32 characters enforced on boot).
- **Graceful Token Persistence**: Tokens are securely stored on physical devices using Keychain / KeyStore via `expo-secure-store`.
- **Environment Isolation**: `.env` files are strictly excluded from source control via `.gitignore`.

---

## Directory Structure

```
Miniledger/
├── backend/
│   ├── src/
│   │   ├── auth.ts              # OTP request & verification routes
│   │   ├── auth-middleware.ts   # JWT verification middleware
│   │   ├── db.ts                # PostgreSQL connection pool
│   │   ├── loans.ts             # Loan CRUD, repayment & financial summary
│   │   ├── server.ts            # Express application bootstrap
│   │   └── token-bucket.ts      # Custom token-bucket rate limiter
│   ├── .env.example             # Safe environment variable template
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   ├── src/
│   │   ├── components/          # Reusable UI (Button, Card, Input, Badge, LoanItem, SummaryCard)
│   │   ├── constants/           # Color tokens, spacing, typography, config
│   │   ├── context/             # AuthContext state provider
│   │   ├── navigation/          # RootNavigator (unauthenticated & authenticated stacks)
│   │   ├── screens/             # Login, OtpVerify, Dashboard, AddLoan, LoanDetails
│   │   ├── services/            # API client and SecureStore service
│   │   ├── types/               # TypeScript interfaces & types
│   │   └── utils/               # Currency (INR) and calendar-safe date formatters
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

---

## API Reference

All protected endpoints require the HTTP header:
`Authorization: Bearer <jwt_token>`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/request-otp` | Public | Generates 6-digit OTP (logged to terminal in dev mode) |
| `POST` | `/auth/verify-otp` | Public | Validates OTP and returns JWT bearer token |
| `GET` | `/loans/summary` | Protected | Returns `totalLent`, `totalRepaid`, and `overdueAmount` |
| `GET` | `/loans` | Protected | Returns all loans for current user, ordered by date |
| `POST` | `/loans` | Protected | Creates a new loan record (`friendName`, `amount`, `dueDate`) |
| `PATCH` | `/loans/:id/repay` | Protected | Marks the specified loan as repaid (`repaid_at = NOW()`) |

---

## Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (`corepack enable` or `npm install -g pnpm`)
- [PostgreSQL](https://www.postgresql.org/) running locally

### 1. Database Setup
Create a PostgreSQL database named `miniledger`:
```sql
CREATE DATABASE miniledger;
```

Ensure tables exist (or initialize schema):
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_name VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  repaid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment template:
   ```bash
   copy .env.example .env
   ```
3. Configure `.env` with your PostgreSQL credentials:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/miniledger
   JWT_SECRET=YOUR_SECURE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
   JWT_EXPIRES_IN=15m
   OTP_TTL_MINUTES=5
   ```
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Start the backend server:
   ```bash
   pnpm dev
   ```
   The backend API will start at `http://localhost:3000`.

### 3. Frontend Setup
1. Open a new terminal and navigate to `mobile`:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start Expo:
   ```bash
   pnpm start
   ```
4. Access the application:
   - Press `w` in the terminal to open in your browser (`http://localhost:8081`).
   - Or scan the QR code with **Expo Go** on an Android or iOS device connected to the same network.

---

## Validation & Verification Commands

To run TypeScript verification on both subprojects:

```bash
# Frontend TypeScript check
cd mobile
pnpm exec tsc --noEmit

# Backend TypeScript check
cd backend
pnpm typecheck
```

Both typechecks pass cleanly with zero errors.

---

## Quick Demo Flow

1. Open `http://localhost:8081` in your browser.
2. Enter your 10-digit mobile number (e.g. `9876543210`) and click **Send Verification Code**.
3. Check the backend terminal for the generated mock OTP:
   ```
   [MiniLedger] Mock OTP for +919876543210: 123456
   ```
4. Enter the 6-digit code on the OTP screen and click **Verify & Continue**.
5. On the Dashboard:
   - Click **Record New Loan**.
   - Enter Friend's Name (e.g. `Rahul Sharma`), Amount (e.g. `2500`), and select a Due Date.
   - Click **Save Loan**.
6. The loan appears immediately in the tracked loans list, and summary cards update.
7. Click the loan item to view details, then click **Mark as Repaid** to settle the loan.
8. The dashboard updates instantly, reflecting increased **Total Repaid** and updated loan status.
