# Skill Exchange

Skill Exchange is a peer-to-peer learning platform where people can teach the skills they know, discover mentors, book learning sessions, communicate in real time, and review completed exchanges.

The application supports learner, mentor, and administrator roles. Each role receives a focused experience while sharing the same community, booking, profile, and communication system.

## Features

- JWT-based registration and login
- Learner and mentor profiles with skills and availability
- Community discovery and member profile viewing
- Session booking and booking-status management
- Real-time conversations powered by Socket.IO
- Ratings and reviews for learning exchanges
- Learner and mentor dashboard components
- Admin portal for user moderation and platform reports
- Responsive Skill Exchange interface

## Technology Stack

### Client

- React 19
- Vite
- Axios
- Socket.IO Client
- React Router
- Vercel Analytics and Speed Insights

### Server

- Node.js and Express
- MongoDB and Mongoose
- JSON Web Tokens
- Socket.IO
- bcrypt password hashing

## Repository Structure

```text
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

## Prerequisites

- Git
- Node.js 20 or newer
- npm
- A MongoDB Atlas database or local MongoDB instance

## Local Setup

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/CosmicCoder06/Skill-Exchange.git
   cd Skill-Exchange
   ```

2. Install the backend dependencies:

   ```bash
   cd server
   npm install
   ```

3. Install the frontend dependencies:

   ```bash
   cd ../client
   npm install
   ```

4. Configure the environment files described below.

5. Start the server from the `server` directory:

   ```bash
   npm run dev
   ```

6. In another terminal, start the client from the `client` directory:

   ```bash
   npm run dev
   ```

The client runs at `http://localhost:5173` by default and the API runs at `http://localhost:5000`.

## Environment Variables

Create `server/.env`:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/skill-exchange
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
ADMIN_NAME=Skill Exchange Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-secure-password
```

Create `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Do not commit either `.env` file. Vite exposes variables prefixed with `VITE_` to browser code, so never place secrets in the client environment file.

## Create an Administrator

After configuring `server/.env`, run the admin seed script from the `server` directory:

```bash
node scripts/seedAdmin.js
```

The script creates the configured administrator or promotes an existing account with the same email. Admin routes also enforce JWT authentication and the `admin` role on the server.

## API Overview

All protected endpoints expect an access token in the following header:

```http
Authorization: Bearer <access-token>
```

| Area | Method | Endpoint | Purpose |
| --- | --- | --- | --- |
| Authentication | `POST` | `/api/registration/api` | Register a learner or mentor |
| Authentication | `POST` | `/api/loginRoute/api` | Log in and receive an access token |
| Profile | `GET` | `/api/profile/me` | Read the current profile |
| Profile | `PUT` | `/api/profile/update` | Update the current profile |
| Profile | `GET` | `/api/profile/:id` | View another member's profile |
| Chat | `GET`, `POST` | `/api/conversations` | List or create conversations |
| Chat | `GET`, `POST` | `/api/conversations/:id/messages` | Read or send messages |
| Chat | `PATCH` | `/api/conversations/:id/read` | Mark a conversation as read |
| Booking | `GET`, `POST` | `/api/bookings` | List or create bookings |
| Booking | `GET` | `/api/bookings/requests` | List mentor booking requests |
| Booking | `PUT`, `DELETE` | `/api/bookings/:id` | Update or cancel a booking |
| Reviews | `GET`, `POST` | `/api/reviews` | List received reviews or create a review |
| Reviews | `GET` | `/api/reviews/user/:userId` | List reviews for a member |
| Reviews | `GET` | `/api/reviews/booking/:bookingId` | Read a booking review |
| Admin | `GET` | `/api/admin/overview` | Read platform summary statistics |
| Admin | `GET` | `/api/admin/users` | Search and filter members |
| Admin | `PATCH`, `DELETE` | `/api/admin/users/:id` | Moderate a member account |
| Admin | `GET` | `/api/admin/reports` | Read platform reports |

## Real-Time Chat

Socket.IO authenticates connections with the same access token. The chat flow uses conversation rooms and events including `join_conversation`, `leave_conversation`, `send_message`, `receive_message`, `typing_start`, `typing_stop`, `message_updated`, `message_deleted`, and `messages_read`.

## Verification Commands

Run backend tests from the `server` directory:

```bash
npm test
```

Run frontend linting and create a production build from the `client` directory:

```bash
npm run lint
npm run build
```

Before opening a pull request, run the checks affected by your change and include their results in the PR description.

## Troubleshooting

### MongoDB does not connect

- Confirm that `MONGO_URI` exists in `server/.env`.
- For MongoDB Atlas, confirm that the current IP address is allowed and the database credentials are correct.
- For local MongoDB, confirm that the database service is running.

### Client requests fail

- Confirm that `VITE_API_URL` includes the `/api` prefix.
- Restart the Vite development server after changing `client/.env`.
- Confirm that `CLIENT_URL` on the server exactly matches the frontend origin.

### Socket.IO does not connect

- Confirm that `VITE_SOCKET_URL` points to the server origin without `/api`.
- Check that the access token is present and has not expired.
- Confirm that the client origin is allowed by the server CORS configuration.

### Protected routes return `401`

- Log in again to obtain a fresh access token.
- Confirm that `JWT_ACCESS_SECRET` is configured and has not changed since the token was created.
- Send the token using the `Authorization: Bearer <access-token>` header.

### Admin login is unavailable

- Configure the `ADMIN_*` values in `server/.env`.
- Run `node scripts/seedAdmin.js` from the `server` directory.
- Restart the server and log in with the configured administrator account.

## Git Workflow

- `main` contains production-ready code.
- `develop` is the integration branch for completed team work.
- `feature/*` branches contain isolated features or documentation changes.

Create new work from the latest `develop` branch:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-module-name
git push -u origin feature/your-module-name
```

Commit and publish your work from the feature branch:

```bash
git add <changed-files>
git commit -m "Describe the completed change"
git push
```

Open a pull request with `develop` as the base branch. Never push feature work directly to `main` or `develop`.

## Contributing

1. Check existing branches and pull requests to avoid duplicating another member's module.
2. Keep each pull request focused on one feature, fix, test suite, or documentation area.
3. Use logical commits that each represent a complete, reviewable change.
4. Add or update tests when application behavior changes.
5. Update this README when setup, environment variables, routes, or workflows change.
6. Explain the change, its purpose, and verification results in the pull request description.

Avoid empty commits and one-line commit splitting. Meaningful history makes reviews, debugging, and team collaboration easier.

## Educational Use

Skill Exchange is a collaborative academic project. Add a formal license before reusing or distributing the project outside its intended educational context.
