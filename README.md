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
