# 🚨 Silent SOS

A full-stack emergency assistance web app: a discreet way to trigger an SOS, share your location, and notify emergency contacts.

Built with React + Vite on the frontend, Node.js + Express + SQLite on the backend, JWT authentication, and a repository-layer database design that's ready to migrate to MongoDB later without touching the frontend.

## Project structure

```
silent-sos/
├── client/   React + Vite frontend
└── server/   Node.js + Express + SQLite backend
```

## Quick start

### 1. Backend

```bash
cd server
npm install        # already done if you're using this generated project as-is
cp .env.example .env   # then edit JWT_SECRET before any real deployment
npm run dev
```

Runs on `http://localhost:5000`. SQLite tables (`users`, `emergency_contacts`, `sos_alerts`) are created automatically on first run.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`.

### 3. Try it

1. Open `http://localhost:5173`, register an account.
2. Allow location access when prompted.
3. Add an emergency contact under **Contacts**.
4. Tap the SOS button on the dashboard, confirm — the alert is created, and a mock notification is logged in the backend console (`server.js` terminal).
5. Cancel it, or check **History** to see it logged.

### Admin access

There's no signup flow for admins — promote a user manually for testing:

```bash
cd server
sqlite3 database/silent_sos.db "UPDATE users SET role = 'admin' WHERE email = 'you@example.com';"
```

Then log back in (or refresh) to see the **Admin** link in the navbar, with user/alert stats and a live feed of all SOS alerts.

## Phone OTP verification (register/login)

Registration and login now require phone verification, like a real app:

1. **Register** → account is created (unverified) → a 6-digit OTP is generated and sent to the phone number via SMS.
2. User is taken to `/verify-otp` → enters the code → account becomes verified and they're logged in.
3. **Login** with an unverified account is blocked (403) and automatically sends a fresh OTP, redirecting to the verify screen.
4. OTP expires after 10 minutes; "Resend" generates a new one.

**Where does the OTP show up?** If Twilio credentials aren't set in `server/.env`, the OTP is printed to the **backend terminal** as `[MOCK OTP SMS]` — copy it from there for testing. Once Twilio is configured, it's sent as a real SMS instead (same trial-account caveat: the recipient number needs to be verified in the Twilio console).

## Enabling real email + SMS notifications

By default, SOS notifications are just logged to the backend console (mock mode) — nothing is sent. To send real alerts:

**Email (Gmail — free):**
1. Turn on 2-Step Verification on the Gmail account you'll send from.
2. Create an App Password at https://myaccount.google.com/apppasswords
3. In `server/.env`, set `EMAIL_USER` (your Gmail address) and `EMAIL_APP_PASSWORD` (the 16-character app password — not your normal password).
4. Make sure each emergency contact has an `email` saved (the Contacts page now has an email field).

**SMS (Twilio — free trial):**
1. Sign up at https://www.twilio.com/try-twilio and grab a free trial phone number.
2. In `server/.env`, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
3. **Trial accounts can only text verified numbers** — verify each recipient's number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified, or upgrade the Twilio account to send to any number.
4. Contact phone numbers are assumed to be Indian (+91) if no country code is given — see `server/services/notificationService.js` if you need a different default.

Restart the backend (`npm run dev`) after editing `.env`. If either set of credentials is left blank, that channel silently falls back to the mock console log — the SOS flow itself never breaks.

## What's implemented

- Register / login with JWT + bcrypt password hashing
- SOS button with deliberate confirm step, loading/active states, and duplicate-alert prevention
- Browser Geolocation capture with permission-denied handling
- Emergency contacts: add / edit / delete
- SOS history with status badges (ACTIVE / CANCELLED / RESOLVED)
- Cancel / resolve SOS endpoints
- Admin panel: user count, alert stats, all-alerts feed
- Mock notification service (logs to the backend console — see `server/services/notificationService.js`) standing in for a real SMS/email provider
- Repository-pattern data layer (`server/models/`) so the SQLite → MongoDB migration only touches that layer

## Notes

- This is an educational project. It does not bypass phone OS permissions, silently access the microphone/camera, or send real SMS — see the disclaimer in the original spec.
- Never commit `server/.env` — it holds `JWT_SECRET`. `.gitignore` is already set up to exclude it and the SQLite `.db` file.
