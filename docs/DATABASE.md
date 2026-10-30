# Database Design

| Collection | Purpose | Key relationships |
| --- | --- | --- |
| `users` | Credentials, role, profile, availability | Creates bookings, messages, reviews, activity logs |
| `bookings` | Requested and completed mentoring sessions | `mentor` and `learner` reference users |
| `conversations` | Direct or booking-specific chat containers | Participants reference users; optional `bookingId` |
| `messages` | Conversation messages and read state | References a conversation and sender |
| `reviews` | One review per reviewer per completed booking | References booking, reviewer, and reviewee |
| `skillcategories` | Admin-managed classification of skills | Canonical category catalog |
| `activitylogs` | Auditable product activity | References actor and affected entity |
| `settings` | Admin-managed platform configuration | Records the updating admin |

This implements the synopsis-recommended eight primary collection areas. Profile skill strings remain backward-compatible while `skillcategories` provides a managed catalog for future UI work.
