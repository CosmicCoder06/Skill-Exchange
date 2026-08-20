# API Documentation

All protected requests use `Authorization: Bearer <access-token>`.

| Area | Method | Endpoint | Access |
| --- | --- | --- | --- |
| Session | POST | `/api/auth/refresh` | Refresh-token cookie or body |
| Session | POST | `/api/auth/logout` | Authenticated user |
| Session | GET | `/api/auth/me` | Authenticated user |
| Discovery | GET | `/api/mentors?q=&skill=&availability=&page=&limit=` | Authenticated user |
| Skill categories | GET | `/api/skill-categories` | Authenticated user |
| Skill categories | POST | `/api/skill-categories` | Admin |
| Skill categories | PATCH | `/api/skill-categories/:id` | Admin |
| Settings | GET | `/api/settings` | Admin |
| Settings | PUT | `/api/settings` | Admin |
| Activity logs | GET | `/api/activity-logs?limit=` | Admin |

Existing authentication, profile, booking, chat, review, dashboard, and admin routes are documented in the repository README. `POST /api/auth/refresh` rotates a valid refresh token and returns a new access token. Browser clients receive refresh tokens via HTTP-only cookies.
