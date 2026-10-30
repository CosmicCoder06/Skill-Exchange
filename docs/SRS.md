# Software Requirements Specification

## Purpose

Skill Exchange connects learners with mentors for skill discovery, session booking, real-time conversation, and post-session feedback.

## Roles

- **Learner:** maintains a profile, discovers mentors, books sessions, chats, and reviews completed sessions.
- **Mentor:** maintains skills and availability, manages booking requests, chats, and reviews completed sessions.
- **Admin:** manages member accounts, skill categories, platform settings, and reports.

## Functional requirements

1. Users can register as a learner or mentor, log in, refresh a session, and log out.
2. Passwords are hashed and protected APIs require a JWT access token.
3. Users can create and update a profile including skills and availability.
4. Learners can search active mentors by free text, skill, and availability.
5. Learners can create bookings; mentors can accept, reject, or complete them; either participant can cancel eligible bookings.
6. Two participants can exchange real-time and booking-linked messages.
7. Participants can submit one 1-5 rating and feedback record after a completed booking.
8. Admins can view reports, moderate accounts, maintain skill categories, and manage platform settings.
9. Significant profile, booking, review, category, and setting actions are retained as activity logs.

## Non-functional requirements

- Responsive React interface for desktop and mobile breakpoints.
- REST JSON APIs with structured status codes and validation.
- MongoDB persistence through Mongoose models.
- Server-side authorization for role-specific operations.

## Out of scope

AI recommendations, video calls, certifications, and gamified learning paths remain future enhancements from the synopsis.
