import os
import re
from pptx import Presentation

INPUT_PATH = "Skill_Exchange_Capstone_Presentation_1.pptx"
OUTPUT_PATH = "Skill_Exchange_Capstone_Presentation_Final.pptx"

def set_para_text(p, text):
    """Sets paragraph text while preserving font properties of the first run."""
    if not p.runs:
        p.text = text
        return
    
    r0 = p.runs[0]
    font_name = r0.font.name
    font_size = r0.font.size
    font_bold = r0.font.bold
    font_italic = r0.font.italic
    font_color_rgb = r0.font.color.rgb if (r0.font.color and hasattr(r0.font.color, 'rgb') and r0.font.color.rgb) else None
    
    # Empty subsequent runs
    for r in p.runs[1:]:
        r.text = ""
        
    r0.text = text
    if font_name:
        r0.font.name = font_name
    if font_size:
        r0.font.size = font_size
    if font_bold is not None:
        r0.font.bold = font_bold
    if font_italic is not None:
        r0.font.italic = font_italic
    if font_color_rgb:
        r0.font.color.rgb = font_color_rgb

def set_slide_note(slide, note_text):
    notes_slide = slide.notes_slide
    text_frame = notes_slide.notes_text_frame
    text_frame.text = note_text

def build_presentation():
    prs = Presentation(INPUT_PATH)
    print(f"Loaded {INPUT_PATH} with {len(prs.slides)} slides.")
    
    # -------------------------------------------------------------
    # SLIDE 1: Title Slide (Preserve empty fields and logo)
    # -------------------------------------------------------------
    # Shape 2 has title, team, and underscores. Leave as is.
    
    # -------------------------------------------------------------
    # SLIDE 2: Presentation Agenda (Matches Synopsis Structure)
    # -------------------------------------------------------------
    s2 = prs.slides[1]
    set_para_text(s2.shapes[0].text_frame.paragraphs[0], "OVERVIEW")
    set_para_text(s2.shapes[1].text_frame.paragraphs[0], "Presentation Agenda")
    
    # Card 01: Shape 6
    set_para_text(s2.shapes[6].text_frame.paragraphs[0], "Problem & Objectives")
    set_para_text(s2.shapes[6].text_frame.paragraphs[1], "Key challenges in finding mentors, and main goals from our synopsis.")
    
    # Card 02: Shape 9
    set_para_text(s2.shapes[9].text_frame.paragraphs[0], "Core Modules")
    set_para_text(s2.shapes[9].text_frame.paragraphs[1], "Authentication, profiles, booking system, chat, and ratings with admin control.")
    
    # Card 03: Shape 12
    set_para_text(s2.shapes[12].text_frame.paragraphs[0], "Technology & Database Design")
    set_para_text(s2.shapes[12].text_frame.paragraphs[1], "Full-stack MERN stack, REST APIs, WebSockets, and 8 MongoDB collections.")
    
    # Card 04: Shape 15
    set_para_text(s2.shapes[15].text_frame.paragraphs[0], "Live Walkthrough")
    set_para_text(s2.shapes[15].text_frame.paragraphs[1], "Screenshots showing login, mentor discovery, dashboards, booking, and chat.")
    
    # Card 05: Shape 18
    set_para_text(s2.shapes[18].text_frame.paragraphs[0], "Challenge, Future Scope & Conclusion")
    set_para_text(s2.shapes[18].text_frame.paragraphs[1], "Dark mode bug fix, future plans from synopsis, and project summary.")
    
    set_slide_note(s2,
        "Good morning teachers. Today we are presenting our capstone project, Skill Exchange. "
        "Here is our agenda based on our approved synopsis. We will cover the problem statement, our core modules, "
        "technology and database design, live screens of the app, a technical challenge we solved, and future scope."
    )

    # -------------------------------------------------------------
    # SLIDE 3: Problem Statement (Directly from Synopsis Section 2)
    # -------------------------------------------------------------
    s3 = prs.slides[2]
    set_para_text(s3.shapes[0].text_frame.paragraphs[0], "PROBLEM STATEMENT")
    set_para_text(s3.shapes[1].text_frame.paragraphs[0], "Problem Statement: Challenges in Peer Learning")
    
    # Stat 1: Shape 5
    set_para_text(s3.shapes[5].text_frame.paragraphs[0], "NO CENTRAL PLATFORM")
    set_para_text(s3.shapes[5].text_frame.paragraphs[1], "There is no single platform for mentors and learners to connect for skill-based learning.")
    
    # Stat 2: Shape 7
    set_para_text(s3.shapes[7].text_frame.paragraphs[0], "HARD TO FIND MENTORS")
    set_para_text(s3.shapes[7].text_frame.paragraphs[1], "Learners struggle to discover qualified mentors who can guide them in new skills.")
    
    # Stat 3: Shape 9
    set_para_text(s3.shapes[9].text_frame.paragraphs[0], "NO ORGANIZED SYSTEM")
    set_para_text(s3.shapes[9].text_frame.paragraphs[1], "Mentors have no simple way to list skills, manage bookings, and talk with learners.")
    
    # Card 1: Shape 11
    set_para_text(s3.shapes[11].text_frame.paragraphs[0], "1. Lack of a Centralized Platform")
    set_para_text(s3.shapes[11].text_frame.paragraphs[1], "Without a dedicated platform, skill exchange remains unorganized and hard to access.")
    
    # Card 2: Shape 13
    set_para_text(s3.shapes[13].text_frame.paragraphs[0], "2. Difficult Mentor Discovery")
    set_para_text(s3.shapes[13].text_frame.paragraphs[1], "Learners cannot easily search or filter mentors based on the specific skills they want to learn.")
    
    # Card 3: Shape 15
    set_para_text(s3.shapes[15].text_frame.paragraphs[0], "3. Disorganized Session Scheduling")
    set_para_text(s3.shapes[15].text_frame.paragraphs[1], "Mentors lack a structured booking calendar to share available time slots and track requests.")
    
    # Card 4: Shape 17
    set_para_text(s3.shapes[17].text_frame.paragraphs[0], "4. Need for a Digital Platform")
    set_para_text(s3.shapes[17].text_frame.paragraphs[1], "A digital web app is needed to bring mentor discovery, scheduling, and chat into one place.")

    set_slide_note(s3,
        "In our problem statement, we identified that there is no centralized platform for skill-based peer learning. "
        "Learners struggle to find qualified mentors who know the exact skills they want to learn. "
        "At the same time, mentors have no organized way to list their skills, manage bookings, and chat with learners. "
        "Our project provides a digital platform to solve all these issues."
    )

    # -------------------------------------------------------------
    # SLIDE 4: Objectives & Modules (Synopsis Section 3 & 4)
    # -------------------------------------------------------------
    s4 = prs.slides[3]
    set_para_text(s4.shapes[0].text_frame.paragraphs[0], "OBJECTIVES & MODULES")
    set_para_text(s4.shapes[1].text_frame.paragraphs[0], "Project Objectives & Core Modules")
    
    # Banner: Shape 5
    set_para_text(s4.shapes[5].text_frame.paragraphs[0], "Primary Goal: A full-stack MERN platform connecting mentors and learners.")
    set_para_text(s4.shapes[5].text_frame.paragraphs[1], "Develop a scalable web app for skill discovery, session scheduling, real-time chat, and verified ratings.")
    
    # Learner Column: Shape 7
    set_para_text(s4.shapes[7].text_frame.paragraphs[0], "Learner Module")
    set_para_text(s4.shapes[7].text_frame.paragraphs[1], "For Students Seeking Guidance")
    set_para_text(s4.shapes[7].text_frame.paragraphs[2], "• Search and filter mentors by skill and view profiles")
    set_para_text(s4.shapes[7].text_frame.paragraphs[3], "• Book and cancel sessions with an interactive calendar")
    set_para_text(s4.shapes[7].text_frame.paragraphs[4], "• Chat in real time with mentors before and after booking")
    set_para_text(s4.shapes[7].text_frame.paragraphs[5], "• Leave ratings and written reviews after each session")
    
    # Mentor Column: Shape 9
    set_para_text(s4.shapes[9].text_frame.paragraphs[0], "Mentor Module")
    set_para_text(s4.shapes[9].text_frame.paragraphs[1], "For Skilled Mentors & Tutors")
    set_para_text(s4.shapes[9].text_frame.paragraphs[2], "• Create profiles with skill listings and bio details")
    set_para_text(s4.shapes[9].text_frame.paragraphs[3], "• Define weekly availability slots for sessions")
    set_para_text(s4.shapes[9].text_frame.paragraphs[4], "• Accept, decline, or propose alternate session times")
    set_para_text(s4.shapes[9].text_frame.paragraphs[5], "• Track booking requests and sessions on a mentor dashboard")
    
    # Admin Column: Shape 11
    set_para_text(s4.shapes[11].text_frame.paragraphs[0], "Admin & Security Module")
    set_para_text(s4.shapes[11].text_frame.paragraphs[1], "Platform Trust, Security & Control")
    set_para_text(s4.shapes[11].text_frame.paragraphs[2], "• Secure authentication with bcrypt and JWT tokens")
    set_para_text(s4.shapes[11].text_frame.paragraphs[3], "• Role-based access control (RBAC) for all pages")
    set_para_text(s4.shapes[11].text_frame.paragraphs[4], "• Admin dashboard with platform user and session stats")
    set_para_text(s4.shapes[11].text_frame.paragraphs[5], "• User management: verify accounts and manage members")

    set_slide_note(s4,
        "Our main objective was to build a full-stack MERN application connecting mentors and learners. "
        "On this slide, you can see how our three core roles work. "
        "Learners can search by skill, book sessions, chat, and leave reviews. "
        "Mentors can list skills, set availability, and manage requests. "
        "The admin oversees users, checks platform stats, and maintains security."
    )

    # -------------------------------------------------------------
    # SLIDE 5: Technology Stack & Database Design (Synopsis Section 5 & 7)
    # -------------------------------------------------------------
    s5 = prs.slides[4]
    set_para_text(s5.shapes[0].text_frame.paragraphs[0], "ENGINEERING FOUNDATION")
    set_para_text(s5.shapes[1].text_frame.paragraphs[0], "Technology Stack & Database Design")
    
    # Card 1: Shape 5 (Frontend)
    set_para_text(s5.shapes[5].text_frame.paragraphs[0], "Frontend: React.js")
    set_para_text(s5.shapes[5].text_frame.paragraphs[1], "Component-based UI, Vite bundler, Lucide icons, responsive CSS variables.")
    
    # Card 2: Shape 7 (Backend)
    set_para_text(s5.shapes[7].text_frame.paragraphs[0], "Backend: Node.js + Express.js")
    set_para_text(s5.shapes[7].text_frame.paragraphs[1], "REST API controllers, modular routes, error handling, and form validation.")
    
    # Card 3: Shape 9 (Database)
    set_para_text(s5.shapes[9].text_frame.paragraphs[0], "Database: MongoDB Atlas")
    set_para_text(s5.shapes[9].text_frame.paragraphs[1], "Cloud NoSQL cluster with Mongoose schemas, indexing, and references.")
    
    # Card 4: Shape 11 (Authentication)
    set_para_text(s5.shapes[11].text_frame.paragraphs[0], "Authentication: JWT & Bcrypt")
    set_para_text(s5.shapes[11].text_frame.paragraphs[1], "Bcrypt password hashing and JWT token authorization for protected routes.")
    
    # Card 5: Shape 13 (API Architecture)
    set_para_text(s5.shapes[13].text_frame.paragraphs[0], "API Architecture: REST APIs")
    set_para_text(s5.shapes[13].text_frame.paragraphs[1], "Structured HTTP endpoints connecting frontend components with backend services.")
    
    # Card 6: Shape 15 (Real-Time)
    set_para_text(s5.shapes[15].text_frame.paragraphs[0], "Real-Time: Socket.io")
    set_para_text(s5.shapes[15].text_frame.paragraphs[1], "WebSocket channels for instant, real-time mentor and learner chat messaging.")
    
    # Database Box 1: Shape 17
    set_para_text(s5.shapes[17].text_frame.paragraphs[0], "Users Collection (Model)")
    set_para_text(s5.shapes[17].text_frame.paragraphs[1], "name, email, password, role ('learner'|'mentor'|'admin'), bio, skillsToTeach, skillsToLearn, hourlyRate, availability, payoutUpiId, profileCompleted, isActive")
    
    # Database Box 2: Shape 19
    set_para_text(s5.shapes[19].text_frame.paragraphs[0], "Bookings Collection (Model)")
    set_para_text(s5.shapes[19].text_frame.paragraphs[1], "learner (Ref), mentor (Ref), date, time, duration (30-120m), status: pending / confirmed / completed / cancelled, actionExpiresAt (4h), suggestedSlots, meetingUrl")
    
    # Database Box 3: Shape 21
    set_para_text(s5.shapes[21].text_frame.paragraphs[0], "Chat Models (Conversations & Messages)")
    set_para_text(s5.shapes[21].text_frame.paragraphs[1], "Conversation: participants, bookingId, lastMessage, lastActivityAt || Message: conversationId, sender, text, isEdited, readBy")
    
    # Database Box 4: Shape 23
    set_para_text(s5.shapes[23].text_frame.paragraphs[0], "Ratings, Logs & Settings Collections")
    set_para_text(s5.shapes[23].text_frame.paragraphs[1], "Review: mentor, learner, rating (1-5), comment || ActivityLog: user, action || Setting: key, value. (Built 8 collections vs 6-8 in synopsis).")

    set_slide_note(s5,
        "This slide shows our technology stack and database design. "
        "We used React on the frontend and Node.js with Express on the backend, with MongoDB Atlas for data. "
        "We use JWT for authentication and Socket.io for real-time chat. "
        "Below, we show our main Mongoose schemas: Users, Bookings, Messages, and Reviews, totaling 8 collections."
    )

    # -------------------------------------------------------------
    # SLIDE 6: System Architecture: End-to-End Data Flow
    # -------------------------------------------------------------
    s6 = prs.slides[5]
    set_para_text(s6.shapes[0].text_frame.paragraphs[0], "HIGH-LEVEL DESIGN")
    set_para_text(s6.shapes[1].text_frame.paragraphs[0], "System Architecture: End-to-End Data Flow")
    
    # Left Box: Shape 4
    set_para_text(s6.shapes[4].text_frame.paragraphs[0], "React Client (Frontend)")
    set_para_text(s6.shapes[4].text_frame.paragraphs[1], "• Vite Development & Bundling")
    set_para_text(s6.shapes[4].text_frame.paragraphs[2], "• React Router Navigation")
    set_para_text(s6.shapes[4].text_frame.paragraphs[3], "• Learner, Mentor & Admin Views")
    set_para_text(s6.shapes[4].text_frame.paragraphs[4], "• Socket.io Client Listener")
    set_para_text(s6.shapes[4].text_frame.paragraphs[5], "• LocalStorage Token Persistence")
    
    # Connectors
    set_para_text(s6.shapes[6].text_frame.paragraphs[0], "REST APIs (HTTP)")
    set_para_text(s6.shapes[8].text_frame.paragraphs[0], "WebSocket (Live Chat)")
    
    # Middle Box: Shape 9
    set_para_text(s6.shapes[9].text_frame.paragraphs[0], "Node.js / Express API")
    set_para_text(s6.shapes[9].text_frame.paragraphs[1], "• JWT Auth & Role Protection (RBAC)")
    set_para_text(s6.shapes[9].text_frame.paragraphs[2], "• Booking Lifecycle & Status Tracking")
    set_para_text(s6.shapes[9].text_frame.paragraphs[3], "• Socket.io Server Event Bus")
    set_para_text(s6.shapes[9].text_frame.paragraphs[4], "• Frontend & Backend Form Validation")
    set_para_text(s6.shapes[9].text_frame.paragraphs[5], "• Admin Moderation & Report Endpoints")
    
    # Connector
    set_para_text(s6.shapes[11].text_frame.paragraphs[0], "Mongoose Driver")
    
    # Right Box: Shape 12
    set_para_text(s6.shapes[12].text_frame.paragraphs[0], "MongoDB Atlas (Database)")
    set_para_text(s6.shapes[12].text_frame.paragraphs[1], "• Users & Roles")
    set_para_text(s6.shapes[12].text_frame.paragraphs[2], "• Bookings & Slots")
    set_para_text(s6.shapes[12].text_frame.paragraphs[3], "• Messages & Threads")
    set_para_text(s6.shapes[12].text_frame.paragraphs[4], "• Ratings & Reviews")
    set_para_text(s6.shapes[12].text_frame.paragraphs[5], "• Activity Logs & Settings")

    set_slide_note(s6,
        "Here is our 3-tier system architecture. "
        "The React client communicates with the Express backend using standard REST APIs for data, and WebSockets for live chat. "
        "The backend validates user input, checks JWT login tokens, and executes business logic. "
        "Finally, Mongoose handles all queries to our MongoDB database."
    )

    # -------------------------------------------------------------
    # SLIDE 7: Booking Flow (Synopsis Module 4.3 + Verified Code)
    # -------------------------------------------------------------
    s7 = prs.slides[6]
    set_para_text(s7.shapes[0].text_frame.paragraphs[0], "CORE MODULE")
    set_para_text(s7.shapes[1].text_frame.paragraphs[0], "Booking Module: 5-Step Scheduling Flow")
    
    # Step 1: Shape 5
    set_para_text(s7.shapes[5].text_frame.paragraphs[0], "STEP 1")
    set_para_text(s7.shapes[5].text_frame.paragraphs[1], "Choose")
    set_para_text(s7.shapes[5].text_frame.paragraphs[2], "Learner searches by skill, selects a mentor, chooses duration (30-120 min) and date.")
    
    # Step 2: Shape 8
    set_para_text(s7.shapes[8].text_frame.paragraphs[0], "STEP 2")
    set_para_text(s7.shapes[8].text_frame.paragraphs[1], "Validate")
    set_para_text(s7.shapes[8].text_frame.paragraphs[2], "System checks mentor availability, prevents self-booking, and sets 4-hour reply timer.")
    
    # Step 3: Shape 11
    set_para_text(s7.shapes[11].text_frame.paragraphs[0], "STEP 3")
    set_para_text(s7.shapes[11].text_frame.paragraphs[1], "Respond")
    set_para_text(s7.shapes[11].text_frame.paragraphs[2], "Mentor reviews request to Accept, Decline, or Propose Alternate Slots.")
    
    # Step 4: Shape 14
    set_para_text(s7.shapes[14].text_frame.paragraphs[0], "STEP 4")
    set_para_text(s7.shapes[14].text_frame.paragraphs[1], "Confirm")
    set_para_text(s7.shapes[14].text_frame.paragraphs[2], "Session is confirmed; mentor attaches meeting link; real-time chat unlocks.")
    
    # Step 5: Shape 17
    set_para_text(s7.shapes[17].text_frame.paragraphs[0], "STEP 5")
    set_para_text(s7.shapes[17].text_frame.paragraphs[1], "Review")
    set_para_text(s7.shapes[17].text_frame.paragraphs[2], "Session takes place, status updates to completed, and learner submits rating and review.")
    
    # Bottom Box: Shape 19
    set_para_text(s7.shapes[19].text_frame.paragraphs[0], "Status Tracking & Built-in Action Rules")
    set_para_text(s7.shapes[19].text_frame.paragraphs[1], "• 4-Hour Response Window: Pending requests expire automatically after 4 hours to keep schedules open.")
    set_para_text(s7.shapes[19].text_frame.paragraphs[2], "• Alternate Slots & Cancellation: Mentors can suggest up to 3 alternate times; sessions can be cancelled before start.")

    set_slide_note(s7,
        "This is our 5-step booking lifecycle from Module 4.3. "
        "First, the learner searches by skill and chooses a slot. "
        "Second, the system validates mentor availability and starts a 4-hour reply timer. "
        "Third, the mentor can accept, decline, or suggest other times. "
        "Fourth, the booking is confirmed with a meeting link. Finally, after the session, the learner submits a rating."
    )

    # -------------------------------------------------------------
    # SLIDE 8: Live Walkthrough: Registration & Login (Module 4.1)
    # -------------------------------------------------------------
    s8 = prs.slides[7]
    set_para_text(s8.shapes[0].text_frame.paragraphs[0], "MODULE 4.1: AUTHENTICATION")
    set_para_text(s8.shapes[1].text_frame.paragraphs[0], "Live Walkthrough: Registration & Login")
    set_para_text(s8.shapes[4].text_frame.paragraphs[0], "• Landing Page: Clean introduction presenting the platform to learners and mentors with clear navigation.")
    set_para_text(s8.shapes[4].text_frame.paragraphs[1], "• Role-Based Registration: Users register as either 'Learner' or 'Mentor' with email and password validation.")
    set_para_text(s8.shapes[4].text_frame.paragraphs[2], "• Secure Login: Passwords hashed with bcrypt; backend issues a JWT token for protected, role-based routes.")

    set_slide_note(s8,
        "Here are the live screens for our Authentication Module. "
        "The home page introduces the platform with a clean layout. "
        "On the registration page, students choose whether to join as a Learner or a Mentor. "
        "When they log in, passwords are verified using bcrypt, and a secure JWT token is issued to protect role-based routes."
    )

    # -------------------------------------------------------------
    # SLIDE 9: Live Walkthrough: Discovery & Profiles (Module 4.2)
    # -------------------------------------------------------------
    s9 = prs.slides[8]
    set_para_text(s9.shapes[0].text_frame.paragraphs[0], "MODULE 4.2: PROFILES & DISCOVERY")
    set_para_text(s9.shapes[1].text_frame.paragraphs[0], "Live Walkthrough: Mentor Discovery & Profiles")
    set_para_text(s9.shapes[4].text_frame.paragraphs[0], "• Skill-Based Search: Learners search and filter mentors in real time by name, category, or skill tags.")
    set_para_text(s9.shapes[4].text_frame.paragraphs[1], "• Detailed Profiles: Displays mentor bio, skills to teach, skills to learn, and weekly availability hours.")
    set_para_text(s9.shapes[4].text_frame.paragraphs[2], "• Public Mentor View: Shows ratings, hourly rate, skill badges, and a direct 'Book Session' action button.")

    set_slide_note(s9,
        "These screenshots show mentor discovery and profiles from Module 4.2. "
        "Learners can search for mentors by typing keywords or filtering by skill tags like React or Python. "
        "The mentor profile displays their bio, skills they teach, skills they want to learn, hourly fee, and available hours."
    )

    # -------------------------------------------------------------
    # SLIDE 10: Live Walkthrough: Role-Based Dashboards (Module 4.2)
    # -------------------------------------------------------------
    s10 = prs.slides[9]
    set_para_text(s10.shapes[0].text_frame.paragraphs[0], "MODULE 4.2: ROLE-BASED DASHBOARDS")
    set_para_text(s10.shapes[1].text_frame.paragraphs[0], "Live Walkthrough: Learner & Mentor Dashboards")
    set_para_text(s10.shapes[4].text_frame.paragraphs[0], "• Learner Dashboard: Displays active learning hours, completed sessions, connected mentors, and upcoming bookings.")
    set_para_text(s10.shapes[4].text_frame.paragraphs[1], "• Mentor Teaching Studio: Shows pending session requests, student counts, and skill depth meters (Beginner-Expert).")
    set_para_text(s10.shapes[4].text_frame.paragraphs[2], "• Built-in Extras: Mentors can save payout UPI IDs, and users can test wallet balance (simulated top-up).")

    set_slide_note(s10,
        "Here are the customized dashboards for learners and mentors. "
        "The learner dashboard shows hours learned, completed sessions, and upcoming bookings. "
        "The mentor dashboard shows incoming session requests, student counts, and skill depth meters. "
        "As a helpful extra, mentors can save their UPI ID, and users can test wallet balances."
    )

    # -------------------------------------------------------------
    # SLIDE 11: Live Walkthrough: Booking & Chat (Modules 4.3 & 4.4)
    # -------------------------------------------------------------
    s11 = prs.slides[10]
    set_para_text(s11.shapes[0].text_frame.paragraphs[0], "MODULES 4.3 & 4.4: BOOKING & CHAT")
    set_para_text(s11.shapes[1].text_frame.paragraphs[0], "Live Walkthrough: Session Booking & Real-Time Chat")
    set_para_text(s11.shapes[4].text_frame.paragraphs[0], "• 3-Step Booking Modal: Pick session length (30-120 min), pick an open date, and choose an available time slot.")
    set_para_text(s11.shapes[4].text_frame.paragraphs[1], "• Clear Pricing Summary: Displays duration, rate, and total calculation with 0% extra platform fee.")
    set_para_text(s11.shapes[4].text_frame.paragraphs[2], "• Real-Time Chat: Instant Socket.io chat with 5 free messages limit before booking to prevent spam.")

    set_slide_note(s11,
        "This slide shows our Booking Module and Chat Module in action. "
        "The booking modal guides the learner through selecting session length, date, and time slot. "
        "Our chat page connects mentors and learners in real time using Socket.io, with a 5 free messages limit before booking to prevent spam."
    )

    # -------------------------------------------------------------
    # SLIDE 12: Live Walkthrough: Admin Management & Ratings (Module 4.5)
    # -------------------------------------------------------------
    s12 = prs.slides[11]
    set_para_text(s12.shapes[0].text_frame.paragraphs[0], "MODULE 4.5: RATINGS & ADMIN")
    set_para_text(s12.shapes[1].text_frame.paragraphs[0], "Live Walkthrough: Admin Management & Ratings")
    set_para_text(s12.shapes[4].text_frame.paragraphs[0], "• Platform Statistics: Admin dashboard tracks total users (14), mentors (8), learners (5), and sessions (29).")
    set_para_text(s12.shapes[4].text_frame.paragraphs[1], "• Member Management: Admin can view all registered members, verify profiles, change roles, or suspend users.")
    set_para_text(s12.shapes[4].text_frame.paragraphs[2], "• Trust & Reports: Shows 1-5 star ratings and reviews from sessions; includes downloadable CSV report export.")

    set_slide_note(s12,
        "Here is our Ratings and Admin Module. "
        "The admin dashboard displays live statistics including total users, active mentors, and completed sessions. "
        "The admin can verify user accounts, change roles, or suspend bad actors. "
        "It also displays 1 to 5 star ratings and lets the admin export reports as CSV files."
    )

    # -------------------------------------------------------------
    # SLIDE 13: Technical Challenge: Dark Theme Bug & Fix
    # -------------------------------------------------------------
    s13 = prs.slides[12]
    set_para_text(s13.shapes[0].text_frame.paragraphs[0], "TECHNICAL CHALLENGE")
    set_para_text(s13.shapes[1].text_frame.paragraphs[0], "A Problem We Faced: Dark Theme Bug")
    
    # Left Box: Shape 5
    set_para_text(s13.shapes[5].text_frame.paragraphs[0], "The Problem")
    set_para_text(s13.shapes[5].text_frame.paragraphs[1], "When we first added dark mode, public pages worked well, but the Admin sidebar and tables broke with washed-out white boxes and unreadable text.")
    set_para_text(s13.shapes[5].text_frame.paragraphs[2], "Why it happened")
    set_para_text(s13.shapes[5].text_frame.paragraphs[3], "Global CSS rules in index.css conflicted with admin styling variables, overriding dark slate colors with inverted white backgrounds.")
    set_para_text(s13.shapes[5].text_frame.paragraphs[4], "How we fixed it")
    set_para_text(s13.shapes[5].text_frame.paragraphs[5], "We properly scoped admin styles under html[data-theme='dark'] .admin-page and .admin-sidebar in admin.css, ensuring clear contrast.")
    
    # Right Box: Shape 7 (Code box comments)
    set_para_text(s13.shapes[7].text_frame.paragraphs[1], "/* Keeps the dark green sidebar */")
    set_para_text(s13.shapes[7].text_frame.paragraphs[8], "/* Scoped admin page background & text */")

    set_slide_note(s13,
        "During development, we faced an interesting CSS bug when introducing dark mode. "
        "The public pages worked fine, but the admin workspace showed washed-out white boxes and unreadable text. "
        "We solved this by properly scoping CSS rules under the dark theme selector in admin.css, ensuring clean contrast."
    )

    # -------------------------------------------------------------
    # SLIDE 14: Project Conclusion & Future Scope (Synopsis Section 9 & 10)
    # -------------------------------------------------------------
    s14 = prs.slides[13]
    set_para_text(s14.shapes[0].text_frame.paragraphs[0], "SUMMARY & NEXT STEPS")
    set_para_text(s14.shapes[1].text_frame.paragraphs[0], "Project Conclusion & Future Scope")
    
    # Left Box: Shape 5 (Project Conclusion)
    set_para_text(s14.shapes[5].text_frame.paragraphs[0], "Project Conclusion")
    set_para_text(s14.shapes[5].text_frame.paragraphs[1], "• Complete MERN Platform: Built a full-stack web application connecting mentors and learners for skill-based peer learning.")
    set_para_text(s14.shapes[5].text_frame.paragraphs[2], "• Synopsis Scope Achieved: Delivered 14 frontend pages (planned 10-15), 59 REST APIs (planned 15-20), and 8 collections (planned 6-8).")
    set_para_text(s14.shapes[5].text_frame.paragraphs[3], "• Secure & Responsive: Built with JWT authentication, role-based access (RBAC), input validation, and responsive mobile-ready UI.")
    set_para_text(s14.shapes[5].text_frame.paragraphs[4], "• Interactive Booking & Chat: Implemented 5-step booking with status tracking, 4-hour reply window, and Socket.io real-time chat.")
    set_para_text(s14.shapes[5].text_frame.paragraphs[5], "• Trust & Moderation: Added 1-5 star ratings with written reviews, and an admin dashboard for user and session management.")
    
    # Right Box: Shape 7 (Future Enhancements from Synopsis)
    set_para_text(s14.shapes[7].text_frame.paragraphs[0], "Future Enhancements (from Synopsis)")
    set_para_text(s14.shapes[7].text_frame.paragraphs[1], "• AI-Based Mentor Recommendations:")
    set_para_text(s14.shapes[7].text_frame.paragraphs[2], "Use machine learning to analyze user skills and suggest the best matching mentors automatically.")
    set_para_text(s14.shapes[7].text_frame.paragraphs[3], "• In-App Video Call Integration:")
    set_para_text(s14.shapes[7].text_frame.paragraphs[4], "Embed live video and audio streaming directly inside the session room using WebRTC.")
    set_para_text(s14.shapes[7].text_frame.paragraphs[5], "• Skill Certification Badges:")
    set_para_text(s14.shapes[7].text_frame.paragraphs[6], "Award verifiable completion badges after successful sessions to validate learned skills.")
    set_para_text(s14.shapes[7].text_frame.paragraphs[7], "• Gamified Learning Paths:")
    set_para_text(s14.shapes[7].text_frame.paragraphs[8], "Create milestone roadmaps, achievement points, and progress bars to keep learners motivated.")

    set_slide_note(s14,
        "In conclusion, we successfully built a complete MERN stack web app that meets all goals from our synopsis. "
        "We delivered 14 frontend pages, 18 REST APIs, and 8 database collections. "
        "For future scope, we plan to add AI mentor recommendations, in-browser video calls, skill certification badges, and gamified learning paths."
    )

    # -------------------------------------------------------------
    # SLIDE 15: Thank You Slide (Remove heart emoji)
    # -------------------------------------------------------------
    s15 = prs.slides[14]
    set_para_text(s15.shapes[2].text_frame.paragraphs[4], "Built by Team CosmicCoders (Group 13)")

    prs.save(OUTPUT_PATH)
    print(f"Saved successfully to {OUTPUT_PATH}")

if __name__ == "__main__":
    build_presentation()
