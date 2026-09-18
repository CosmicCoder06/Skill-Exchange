# Skill Exchange

Skill Exchange is a peer-to-peer learning platform where people can teach the skills they know, discover mentors, book learning sessions, chat in real time, pay securely, and review completed exchanges.

The platform supports **learner**, **mentor**, and **administrator** roles. Since any user can both teach and learn, the same account can act as a learner in one session and a mentor (host) in another — sharing one community, booking, wallet, and communication system.

🔗 **Live App:** [skill-exchange-one-eta.vercel.app](https://skill-exchange-one-eta.vercel.app/)

---

## Features

### Core Platform
- JWT-based registration and login
- Learner and mentor profiles with skills and availability
- Community discovery and member profile viewing
- Real-time conversations powered by Socket.IO, with a limited free-message quota per direct chat (unlocked via session booking)
- Ratings and reviews for completed exchanges, visible from both the learner's and the mentor's side
- Separate, redesigned Learner and Mentor dashboards with activity stats and journey tracking
- Admin portal for user moderation and platform reports
- Fully responsive interface

### Booking & Session Management
- Booker selects a mentor, session duration, and time slot
- Live time-slot availability check before a request is sent
- Mentor can **approve**, **decline with alternate available slots**, or **reject** a request
- Booker can choose from the mentor's suggested slots, or cancel before payment
- Auto-expiry (4 hours) on pending requests/approvals with no response
- Unlimited chat messaging automatically unlocked for the duration of a confirmed session, reverting to the free-message limit once the session ends

### Payments, Wallet & Receipts
- Dynamic session pricing based on duration and hourly rate, with GST applied as per applicable rates
- **Skill Exchange Wallet** for both learners and mentors:
  - Simulated instant top-ups (no external payment gateway integrated yet)
  - Tracks **Earned Balance** (from completed sessions, withdrawable) separately from **Top-Up Balance** (manually loaded, spendable on sessions only)
- Two ways to pay for a session:
  - **Wallet** — no extra charge
  - **UPI/Card** — additional 3% convenience fee, which goes entirely to the platform
- Separate, clearly formatted receipts for the booker and the host, itemizing session rate, GST, platform fee, and net payout
- Host earnings (after a 3% platform fee) are credited to the host's wallet, pending manual settlement/withdrawal

---

## Technology Stack

**Client**
- React 19, Vite
- Axios
- Socket.IO Client
- React Router
- Vercel Analytics and Speed Insights

**Server**
- Node.js and Express
- MongoDB and Mongoose
- JSON Web Tokens
- Socket.IO
- bcrypt password hashing

---

## Repository Structure

```
Skill-Exchange/
├── client/                     # React and Vite frontend
│   ├── public/                 # Static assets
│   └── src/
│       ├── Components/         # Reusable UI components
│       ├── Pages/              # Application screens
│       ├── context/            # Socket connection state
│       └── services/           # HTTP service modules
├── server/                     # Express and Socket.IO backend
│   ├── Backend Configuration/  # Authentication and legacy routes
│   ├── controllers/            # Feature request handlers
│   ├── models/                 # Mongoose models
│   ├── routes/                 # Feature API routes
│   ├── scripts/                # Maintenance and seed scripts
│   ├── sockets/                # Real-time chat handlers
│   └── tests/                  # Node test suites
├── .env.example                # Environment variable reference
└── README.md                   # Project documentation
```

---

## Prerequisites

- Git
- Node.js 20 or newer
- npm
- A MongoDB Atlas database or local MongoDB instance

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/CosmicCoder06/Skill-Exchange.git
cd Skill-Exchange

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install

# 4. Configure the environment files (see below)

# 5. Start the server (from /server)
npm run dev

# 6. In another terminal, start the client (from /client)
npm run dev
```

The client runs at `http://localhost:5173` and the API runs at `http://localhost:5000` by default.

---

## Environment Variables

**`server/.env`**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/skill-exchange
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
ADMIN_NAME=Skill Exchange Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-secure-password
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> ⚠️ Do not commit either `.env` file. Vite exposes any variable prefixed with `VITE_` to browser code — never place secrets in the client environment file.

---

## Create an Administrator

After configuring `server/.env`, run the admin seed script from the `server` directory:

```bash
node scripts/seedAdmin.js
```

This creates the configured administrator account or promotes an existing account with the same email. Admin routes also enforce JWT authentication and the admin role on the server.

---

## API Overview

All protected endpoints expect an access token in the header:

```
Authorization: Bearer <access-token>
```

| Area | Method | Endpoint | Purpose |
|---|---|---|---|
| Authentication | POST | `/api/registration/api` | Register a learner or mentor |
| Authentication | POST | `/api/loginRoute/api` | Log in and receive an access token |
| Profile | GET | `/api/profile/me` | Read the current profile |
| Profile | PUT | `/api/profile/update` | Update the current profile |
| Profile | GET | `/api/profile/:id` | View another member's profile |
| Chat | GET, POST | `/api/conversations` | List or create conversations |
| Chat | GET, POST | `/api/conversations/:id/messages` | Read or send messages |
| Chat | PATCH | `/api/conversations/:id/read` | Mark a conversation as read |
| Booking | GET, POST | `/api/bookings` | List or create bookings |
| Booking | GET | `/api/bookings/requests` | List mentor booking requests |
| Booking | PUT, DELETE | `/api/bookings/:id` | Update or cancel a booking |
| Reviews | GET, POST | `/api/reviews` | List received reviews or create a review |
| Reviews | GET | `/api/reviews/user/:userId` | List reviews for a member |
| Reviews | GET | `/api/reviews/booking/:bookingId` | Read a booking's review(s) |
| Admin | GET | `/api/admin/overview` | Read platform summary statistics |
| Admin | GET | `/api/admin/users` | Search and filter members |
| Admin | PATCH, DELETE | `/api/admin/users/:id` | Moderate a member account |
| Admin | GET | `/api/admin/reports` | Read platform reports |
| Session | POST | `/api/auth/refresh` | Rotate refresh token and return a new access token |
| Session | POST | `/api/auth/logout` | Revoke current refresh session |
| Discovery | GET | `/api/mentors` | Search mentors by `q`, `skill`, or `availability` |
| Skill categories | GET, POST, PATCH | `/api/skill-categories` | Read categories; admin creates and updates them |
| Settings | GET, PUT | `/api/settings` | Admin-managed platform settings |
| Activity logs | GET | `/api/activity-logs` | Read recent auditable product activity |

---

## Real-Time Chat

Socket.IO authenticates connections using the same access token. The chat flow uses conversation rooms and the following events:

`join_conversation`, `leave_conversation`, `send_message`, `receive_message`, `typing_start`, `typing_stop`, `message_updated`, `message_deleted`, `messages_read`

---

## Verification Commands

```bash
# Backend tests (from /server)
npm test

# Frontend lint + production build (from /client)
npm run lint
npm run build
```

Before opening a pull request, run the checks affected by your change and include their results in the PR description.

---

## Troubleshooting

**MongoDB does not connect**
- Confirm `MONGO_URI` exists in `server/.env`.
- For MongoDB Atlas, confirm the current IP is allowlisted and credentials are correct.
- For local MongoDB, confirm the database service is running.

**Client requests fail**
- Confirm `VITE_API_URL` includes the `/api` prefix.
- Restart the Vite dev server after changing `client/.env`.
- Confirm `CLIENT_URL` on the server exactly matches the frontend origin.

**Socket.IO does not connect**
- Confirm `VITE_SOCKET_URL` points to the server origin, without `/api`.
- Check that the access token is present and hasn't expired.
- Confirm the client origin is allowed by the server's CORS configuration.

**Protected routes return 401**
- Log in again to obtain a fresh access token.
- Confirm `JWT_ACCESS_SECRET` hasn't changed since the token was issued.
- Send the token via the `Authorization: Bearer <access-token>` header.

**Admin login is unavailable**
- Configure the `ADMIN_*` values in `server/.env`.
- Run `node scripts/seedAdmin.js` from the `server` directory.
- Restart the server and log in with the configured administrator account.

---

## Git Workflow

- `main` — production-ready code
- `develop` — integration branch for completed team work
- `feature/*` — isolated features or documentation changes

```bash
# Start new work from the latest develop branch
git checkout develop
git pull origin develop
git checkout -b feature/your-module-name

# Commit and publish
git add <changed-files>
git commit -m "Describe the completed change"
git push -u origin feature/your-module-name
```

Open a pull request with `develop` as the base branch. Never push feature work directly to `main` or `develop`.

---

## Contributing

- Check existing branches and pull requests to avoid duplicating another member's module.
- Keep each pull request focused on one feature, fix, test suite, or documentation area.
- Use logical commits, each representing a complete, reviewable change.
- Add or update tests when application behavior changes.
- Update this README when setup, environment variables, routes, or workflows change.
- Explain the change, its purpose, and verification results in the PR description.
- Avoid empty commits and one-line commit splitting — meaningful history makes reviews and debugging easier.

---

## Educational Use

Skill Exchange is a collaborative academic project. Add a formal license before reusing or distributing the project outside its intended educational context.
