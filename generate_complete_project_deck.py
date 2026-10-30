import os
import win32com.client
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_FILE = os.path.abspath("Skill_Exchange_Complete_Project_Presentation.pptx")
SCREENSHOTS_DIR = os.path.abspath("screenshots")
EXPORT_DIR = os.path.abspath("complete_project_exports")

# Color Palette
DARK_GREEN = RGBColor(0x17, 0x6B, 0x4E)     # #176B4E Primary Brand
LIGHT_GREEN = RGBColor(0xF4, 0xF8, 0xF5)    # #F4F8F5 Card Accent
BG_COLOR = RGBColor(0xF8, 0xFB, 0xF9)       # #F8FBF9 Page Background
TEXT_DARK = RGBColor(0x1A, 0x20, 0x2C)      # #1A202C Title/Header
TEXT_BODY = RGBColor(0x2D, 0x37, 0x48)      # #2D3748 Body text
TEXT_MUTED = RGBColor(0x5A, 0x65, 0x78)     # #5A6578 Subtext
BORDER_COLOR = RGBColor(0xD1, 0xE3, 0xD9)   # #D1E3D9 Card Border
BORDER_LIGHT = RGBColor(0xE2, 0xE8, 0xF0)   # #E2E8F0 Subtle Border
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
CODE_BG = RGBColor(0x09, 0x17, 0x12)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

TOTAL_SLIDES = 22

def set_slide_bg(slide, color=BG_COLOR):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_header(slide, title_text, category_tag="SKILL EXCHANGE PLATFORM"):
    tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.40), Inches(11.7), Inches(0.28))
    tf_tag = tag_box.text_frame
    tf_tag.word_wrap = True
    tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = category_tag.upper()
    p_tag.font.name = "Calibri"
    p_tag.font.size = Pt(9.5)
    p_tag.font.bold = True
    p_tag.font.color.rgb = DARK_GREEN

    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.66), Inches(11.7), Inches(0.50))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.name = "Cambria"
    p_title.font.size = Pt(21)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_DARK

    divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.22), Inches(11.733), Inches(0.015))
    divider.fill.solid()
    divider.fill.fore_color.rgb = BORDER_LIGHT
    divider.line.fill.background()

def add_footer(slide, slide_num):
    foot_left = slide.shapes.add_textbox(Inches(0.8), Inches(7.10), Inches(8.0), Inches(0.3))
    tf_l = foot_left.text_frame
    tf_l.margin_left = tf_l.margin_top = tf_l.margin_right = tf_l.margin_bottom = 0
    p_l = tf_l.paragraphs[0]
    p_l.text = "Skill Exchange · B.Tech CSE Capstone Project (Team CosmicCoder · Group 13)"
    p_l.font.name = "Calibri"
    p_l.font.size = Pt(9)
    p_l.font.color.rgb = TEXT_MUTED

    foot_right = slide.shapes.add_textbox(Inches(9.5), Inches(7.10), Inches(3.0), Inches(0.3))
    tf_r = foot_right.text_frame
    tf_r.margin_left = tf_r.margin_top = tf_r.margin_right = tf_r.margin_bottom = 0
    p_r = tf_r.paragraphs[0]
    p_r.text = f"Slide {slide_num} of {TOTAL_SLIDES}"
    p_r.alignment = PP_ALIGN.RIGHT
    p_r.font.name = "Calibri"
    p_r.font.size = Pt(9)
    p_r.font.bold = True
    p_r.font.color.rgb = TEXT_MUTED

def add_card(slide, left, top, width, height, bg_color=WHITE, border_color=BORDER_LIGHT):
    card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
    else:
        card.line.fill.background()
    return card

def add_speaker_note(slide, note_text):
    notes_slide = slide.notes_slide
    text_frame = notes_slide.notes_text_frame
    text_frame.text = note_text

def add_image_bordered(slide, filename, left, top, width, height):
    img_path = os.path.join(SCREENSHOTS_DIR, filename)
    if not os.path.exists(img_path):
        print(f"Warning: Screenshot {filename} not found!")
        return None
    border_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    border_box.fill.solid()
    border_box.fill.fore_color.rgb = WHITE
    border_box.line.color.rgb = BORDER_COLOR
    border_box.line.width = Pt(1.5)

    pad = Inches(0.04)
    pic = slide.shapes.add_picture(img_path, left + pad, top + pad, width - (pad * 2), height - (pad * 2))
    return pic

# -------------------------------------------------------------------------------------------------
# SLIDE BUILDERS
# -------------------------------------------------------------------------------------------------

def build_slide_1_title():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s, DARK_GREEN)

    logo_path = os.path.join(SCREENSHOTS_DIR, "logo_white.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(SCREENSHOTS_DIR, "logo.png")
    if os.path.exists(logo_path):
        s.shapes.add_picture(logo_path, Inches(11.2), Inches(0.9), Inches(1.3), Inches(1.3))

    tb = s.shapes.add_textbox(Inches(1.0), Inches(1.1), Inches(10.0), Inches(5.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "CAPSTONE PROJECT · FULL STACK MERN WEB APPLICATION"
    p0.font.name = "Calibri"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(0x9A, 0xE6, 0xB4)
    p0.space_after = Pt(10)

    p1 = tf.add_paragraph()
    p1.text = "Skill Exchange"
    p1.font.name = "Cambria"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = WHITE
    p1.space_after = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "A Scalable Peer-to-Peer Mentorship & Skill Sharing Platform"
    p2.font.name = "Calibri"
    p2.font.size = Pt(17)
    p2.font.color.rgb = RGBColor(0xE2, 0xF0, 0xEA)
    p2.space_after = Pt(24)

    p3 = tf.add_paragraph()
    p3.text = "Team CosmicCoder · Group Number 13 | B.Tech CSE, GLA University, Mathura"
    p3.font.name = "Calibri"
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.color.rgb = WHITE
    p3.space_after = Pt(4)

    p4 = tf.add_paragraph()
    p4.text = "Project Guidance: Codroid Hub Pvt. Ltd. | October 2026"
    p4.font.name = "Calibri"
    p4.font.size = Pt(12)
    p4.font.color.rgb = RGBColor(0xC8, 0xE6, 0xD8)
    p4.space_after = Pt(28)

    p5 = tf.add_paragraph()
    p5.text = "Team Leader:   __________________________________________________"
    p5.font.name = "Calibri"
    p5.font.size = Pt(11.5)
    p5.font.color.rgb = WHITE
    p5.space_after = Pt(8)

    p6 = tf.add_paragraph()
    p6.text = "Team Members: __________________________________________________"
    p6.font.name = "Calibri"
    p6.font.size = Pt(11.5)
    p6.font.color.rgb = WHITE
    p6.space_after = Pt(8)

    p7 = tf.add_paragraph()
    p7.text = "Project Guide: __________________________________________________"
    p7.font.name = "Calibri"
    p7.font.size = Pt(11.5)
    p7.font.color.rgb = WHITE

    add_speaker_note(s,
        "Good morning respected professors and project evaluators. Today, Team CosmicCoder Group 13 presents our "
        "B.Tech CSE Capstone Project titled 'Skill Exchange'. This is a scalable full-stack MERN web application "
        "connecting student mentors and learners for skill-based peer education."
    )

def build_slide_2_intro_problem():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "Introduction & Problem Statement: The Mentorship Gap", "CONTEXT & BACKGROUND")
    add_footer(s, 2)

    # 3 Top Callout Cards
    stat_data = [
        ("NO CENTRAL PLATFORM", "Skill exchange remains fragmented without a centralized, dedicated platform for student peers."),
        ("DISCOVERY DIFFICULTY", "Learners struggle to identify qualified mentors suited to their specific learning goals."),
        ("UNORGANIZED SCHEDULING", "Mentors lack structured tools to publish availability, track sessions, and handle communication.")
    ]
    card_w = Inches(3.64)
    card_h = Inches(1.35)
    top_y = Inches(1.45)
    for i, (hd, desc) in enumerate(stat_data):
        cx = Inches(0.8) + i * Inches(4.04)
        add_card(s, cx, top_y, card_w, card_h, bg_color=LIGHT_GREEN, border_color=BORDER_COLOR)
        tb = s.shapes.add_textbox(cx + Inches(0.18), top_y + Inches(0.14), card_w - Inches(0.36), card_h - Inches(0.28))
        tf = tb.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = hd
        p0.font.name = "Cambria"
        p0.font.size = Pt(13)
        p0.font.bold = True
        p0.font.color.rgb = DARK_GREEN
        p0.space_after = Pt(4)
        p1 = tf.add_paragraph()
        p1.text = desc
        p1.font.name = "Calibri"
        p1.font.size = Pt(10)
        p1.font.color.rgb = TEXT_BODY

    # 2 Big Content Boxes
    b_y = Inches(3.05)
    b_w = Inches(5.66)
    b_h = Inches(3.80)

    # Left Box: Problem
    add_card(s, Inches(0.8), b_y, b_w, b_h, bg_color=WHITE, border_color=BORDER_LIGHT)
    tb_l = s.shapes.add_textbox(Inches(1.05), b_y + Inches(0.25), b_w - Inches(0.5), b_h - Inches(0.5))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    p_lh = tf_l.paragraphs[0]
    p_lh.text = "Challenges in Peer Learning Today"
    p_lh.font.name = "Cambria"
    p_lh.font.size = Pt(14)
    p_lh.font.bold = True
    p_lh.font.color.rgb = DARK_GREEN
    p_lh.space_after = Pt(12)

    prob_points = [
        ("Commercial Tutoring Barrier: ", "High commercial tutoring costs prevent college students from getting affordable 1-on-1 academic help."),
        ("Scattered Informal Coordination: ", "Arranging study calls through WhatsApp or Discord leads to missed links, scheduling clashes, and lost notes."),
        ("High Ghosting & No-Shows: ", "Informal arrangements lack commitment, causing frequent last-minute cancellations without accountability."),
        ("Lack of Trust & Verification: ", "Learners have no credible way to assess a peer tutor's actual skill proficiency and track record before meeting.")
    ]
    for b_title, b_text in prob_points:
        p = tf_l.add_paragraph()
        p.space_after = Pt(8)
        r0 = p.add_run()
        r0.text = "• " + b_title
        r0.font.name = "Calibri"
        r0.font.size = Pt(10.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = b_text
        r1.font.name = "Calibri"
        r1.font.size = Pt(10)
        r1.font.color.rgb = TEXT_BODY

    # Right Box: Solution
    add_card(s, Inches(6.87), b_y, b_w, b_h, bg_color=WHITE, border_color=BORDER_LIGHT)
    tb_r = s.shapes.add_textbox(Inches(7.12), b_y + Inches(0.25), b_w - Inches(0.5), b_h - Inches(0.5))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    p_rh = tf_r.paragraphs[0]
    p_rh.text = "The Skill Exchange Solution"
    p_rh.font.name = "Cambria"
    p_rh.font.size = Pt(14)
    p_rh.font.bold = True
    p_rh.font.color.rgb = DARK_GREEN
    p_rh.space_after = Pt(12)

    sol_points = [
        ("Unified Digital Ecosystem: ", "Integrates mentor discovery, slot scheduling, real-time messaging, and reviews into a single MERN web platform."),
        ("Role-Based Architecture: ", "Provides dedicated portals tailored for Learners, Mentors, and Administrators with strict access controls."),
        ("Structured Booking Engine: ", "Enforces clean 5-step booking lifecycles with built-in 4-hour action limits and alternate slot proposals."),
        ("Verified Community Trust: ", "Features 1-to-5 star post-session reviews, verified profile badges, and transparent session hour logs.")
    ]
    for b_title, b_text in sol_points:
        p = tf_r.add_paragraph()
        p.space_after = Pt(8)
        r0 = p.add_run()
        r0.text = "• " + b_title
        r0.font.name = "Calibri"
        r0.font.size = Pt(10.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = b_text
        r1.font.name = "Calibri"
        r1.font.size = Pt(10)
        r1.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "On this slide, we present our problem statement and project rationale. In collegiate settings, learners "
        "struggle to find qualified mentors, while mentors have no organized tools to schedule sessions or share skills. "
        "Informal coordination over WhatsApp leads to ghosting and confusion. Skill Exchange solves this with a centralized, "
        "structured web application."
    )

def build_slide_3_objectives():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "Project Objectives & Scope: Bridging Knowledge Gaps", "PROJECT SCOPE & OBJECTIVES")
    add_footer(s, 3)

    # Top Banner
    banner_w = Inches(11.733)
    banner_h = Inches(1.20)
    add_card(s, Inches(0.8), Inches(1.45), banner_w, banner_h, bg_color=LIGHT_GREEN, border_color=BORDER_COLOR)
    tb_b = s.shapes.add_textbox(Inches(1.05), Inches(1.55), banner_w - Inches(0.5), banner_h - Inches(0.2))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p0 = tf_b.paragraphs[0]
    p0.text = "Primary Objective:"
    p0.font.name = "Cambria"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = DARK_GREEN
    p0.space_after = Pt(3)
    p1 = tf_b.add_paragraph()
    p1.text = "To design and develop a scalable, full-stack MERN web application that connects student mentors and learners through automated skill discovery, interactive session scheduling, real-time chat, and mutual feedback."
    p1.font.name = "Calibri"
    p1.font.size = Pt(11)
    p1.font.color.rgb = TEXT_BODY

    # 3 Pillar Columns
    col_w = Inches(3.64)
    col_h = Inches(4.05)
    col_y = Inches(2.85)

    pillars = [
        ("Mentor Module Pillar", "For Student Tutors & Experts", [
            ("Skill Profile Listing: ", "Showcase technical skills with granular proficiency depth ratings (Beginner to Expert)."),
            ("Availability Management: ", "Define weekly open schedule chips for morning, afternoon, and evening slots."),
            ("Session Negotiation: ", "Accept requests, decline, or propose up to 3 alternate time slots directly."),
            ("Teaching Dashboard: ", "Track total students taught, sessions held, and monitor teaching hours.")
        ]),
        ("Learner Module Pillar", "For Students Seeking Guidance", [
            ("Skill Discovery: ", "Search and filter mentors in real time by name, category, or specific skill tags."),
            ("Interactive Booking: ", "Schedule 1-on-1 sessions via 3-step wizard with duration and date chips."),
            ("Real-Time Messaging: ", "Communicate via Socket.io chat threads with 5 free messages anti-spam limit."),
            ("Community Reviews: ", "Submit 1-to-5 star ratings and qualitative reviews following session completion.")
        ]),
        ("Security & Admin Pillar", "For Platform Trust & Integrity", [
            ("Role-Based Auth (RBAC): ", "Enforce strict route protections across Learner, Mentor, and Admin roles."),
            ("Cryptographic Security: ", "Store passwords using 10-round salted bcrypt hashing and stateless JWT tokens."),
            ("Administrative Console: ", "Audit platform KPIs, verify student credentials, and moderate accounts."),
            ("Reporting & Export: ", "Download financial and user activity records as formatted CSV spreadsheets.")
        ])
    ]

    for i, (hd, sub, pts) in enumerate(pillars):
        cx = Inches(0.8) + i * Inches(4.04)
        add_card(s, cx, col_y, col_w, col_h, bg_color=WHITE, border_color=BORDER_LIGHT)
        tb = s.shapes.add_textbox(cx + Inches(0.2), col_y + Inches(0.2), col_w - Inches(0.4), col_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        
        ph = tf.paragraphs[0]
        ph.text = hd
        ph.font.name = "Cambria"
        ph.font.size = Pt(13)
        ph.font.bold = True
        ph.font.color.rgb = DARK_GREEN
        ph.space_after = Pt(2)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.name = "Calibri"
        psub.font.size = Pt(9.5)
        psub.font.color.rgb = TEXT_MUTED
        psub.space_after = Pt(10)

        for b_hd, b_txt in pts:
            p = tf.add_paragraph()
            p.space_after = Pt(6)
            r0 = p.add_run()
            r0.text = "• " + b_hd
            r0.font.name = "Calibri"
            r0.font.size = Pt(9.5)
            r0.font.bold = True
            r0.font.color.rgb = TEXT_DARK
            r1 = p.add_run()
            r1.text = b_txt
            r1.font.name = "Calibri"
            r1.font.size = Pt(9)
            r1.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "Here we outline our core objectives across three distinct pillars: the Mentor Module, the Learner Module, "
        "and the Security & Admin Pillar. All six specific objectives approved in our synopsis are addressed, including "
        "skill listing, interactive booking, real-time chat, role-based authentication, and verified reviews."
    )

def build_slide_4_architecture():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "System Architecture: End-to-End Enterprise Flow", "HIGH-LEVEL SYSTEM DESIGN")
    add_footer(s, 4)

    # 3 Architecture Boxes (Client, Server, Database)
    box_w = Inches(3.45)
    box_h = Inches(5.30)
    y_pos = Inches(1.50)

    # Box 1: React Client
    add_card(s, Inches(0.8), y_pos, box_w, box_h, bg_color=WHITE, border_color=BORDER_COLOR)
    tb1 = s.shapes.add_textbox(Inches(1.0), y_pos + Inches(0.2), box_w - Inches(0.4), box_h - Inches(0.4))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "Presentation Tier\n(React Client)"
    p1.font.name = "Cambria"
    p1.font.size = Pt(14)
    p1.font.bold = True
    p1.font.color.rgb = DARK_GREEN
    p1.space_after = Pt(12)

    tier1_items = [
        ("Vite SPA Framework: ", "High-performance React 19 architecture with sub-second hot reloading."),
        ("React Router Navigation: ", "Client-side declarative routing with role-protected view boundaries."),
        ("Role-Based Views: ", "Custom user interfaces for Learner, Mentor, and Admin workflows."),
        ("Socket.io Client: ", "Persistent WebSocket event listener for live chat and notifications."),
        ("Token Persistence: ", "Secure browser storage of JWT tokens with auto-authorization headers."),
        ("Responsive Layout: ", "Adaptive flexbox and grid layouts responsive on mobile (390px) & desktop.")
    ]
    for h, d in tier1_items:
        p = tf1.add_paragraph()
        p.space_after = Pt(6)
        r0 = p.add_run()
        r0.text = "• " + h
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = d
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = TEXT_BODY

    # Connector 1
    c1 = s.shapes.add_textbox(Inches(4.30), Inches(3.20), Inches(0.70), Inches(1.5))
    tfc1 = c1.text_frame
    tfc1.word_wrap = True
    pc1 = tfc1.paragraphs[0]
    pc1.text = "REST\nAPIs\n↕\nWeb\nSockets"
    pc1.alignment = PP_ALIGN.CENTER
    pc1.font.name = "Calibri"
    pc1.font.size = Pt(9)
    pc1.font.bold = True
    pc1.font.color.rgb = DARK_GREEN

    # Box 2: Node/Express
    add_card(s, Inches(4.94), y_pos, box_w, box_h, bg_color=LIGHT_GREEN, border_color=BORDER_COLOR)
    tb2 = s.shapes.add_textbox(Inches(5.14), y_pos + Inches(0.2), box_w - Inches(0.4), box_h - Inches(0.4))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "Application Tier\n(Node.js & Express API)"
    p2.font.name = "Cambria"
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = DARK_GREEN
    p2.space_after = Pt(12)

    tier2_items = [
        ("JWT Auth Middleware: ", "Verifies digital signatures, extracts claims, and blocks unauthorized traffic."),
        ("RBAC Route Guards: ", "Enforces strict authorization: learner, mentor, or admin access levels."),
        ("Booking State Engine: ", "Manages 5-step lifecycle, 4-hour timers, and slot negotiation rules."),
        ("Socket.io Event Server: ", "Broadcasts 1-on-1 messages, typing status, and read receipt events."),
        ("AI Matcher Service: ", "Multi-factor scoring algorithm with optional Gemini AI re-ranking."),
        ("Error & Rate Controls: ", "Structured JSON error handling, input validation, and API rate limits.")
    ]
    for h, d in tier2_items:
        p = tf2.add_paragraph()
        p.space_after = Pt(6)
        r0 = p.add_run()
        r0.text = "• " + h
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = d
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = TEXT_BODY

    # Connector 2
    c2 = s.shapes.add_textbox(Inches(8.44), Inches(3.60), Inches(0.65), Inches(1.0))
    tfc2 = c2.text_frame
    tfc2.word_wrap = True
    pc2 = tfc2.paragraphs[0]
    pc2.text = "Mongoose\nODM\n↕"
    pc2.alignment = PP_ALIGN.CENTER
    pc2.font.name = "Calibri"
    pc2.font.size = Pt(9)
    pc2.font.bold = True
    pc2.font.color.rgb = DARK_GREEN

    # Box 3: MongoDB Atlas & External APIs
    add_card(s, Inches(9.08), y_pos, box_w, box_h, bg_color=WHITE, border_color=BORDER_COLOR)
    tb3 = s.shapes.add_textbox(Inches(9.28), y_pos + Inches(0.2), box_w - Inches(0.4), box_h - Inches(0.4))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    p3 = tf3.paragraphs[0]
    p3.text = "Data & Services Tier\n(MongoDB & Cloud Services)"
    p3.font.name = "Cambria"
    p3.font.size = Pt(14)
    p3.font.bold = True
    p3.font.color.rgb = DARK_GREEN
    p3.space_after = Pt(12)

    tier3_items = [
        ("MongoDB Atlas Cluster: ", "High-availability cloud NoSQL database with automated replication."),
        ("Mongoose Schemas: ", "Strict schema definitions, field validation, and ObjectId references."),
        ("8 Primary Collections: ", "Users, Bookings, Conversations, Messages, Reviews, Wallets, Logs, Settings."),
        ("Razorpay Integration: ", "Automated order creation, checkout verification, and webhook handling."),
        ("Google Meet Linker: ", "Generates valid video conference meeting URLs for confirmed calls."),
        ("Google Gemini AI SDK: ", "Optional LLM re-ranking for contextual mentor recommendations.")
    ]
    for h, d in tier3_items:
        p = tf3.add_paragraph()
        p.space_after = Pt(6)
        r0 = p.add_run()
        r0.text = "• " + h
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = d
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "This slide presents our complete 3-tier enterprise architecture. On the left is our React 19 frontend "
        "communicating via REST APIs and WebSockets. In the center, our Express server enforces JWT authentication, "
        "RBAC rules, and booking lifecycles. On the right, MongoDB Atlas persists all data across 8 collections, "
        "interfacing with Razorpay and Google Meet."
    )

def build_slide_5_tech_stack():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "Technology Stack: Modern MERN Implementation", "ENGINEERING FOUNDATION")
    add_footer(s, 5)

    stack_cards = [
        ("Frontend: React.js 19 + Vite", "UI & Client Framework", [
            "Component-driven single page application (SPA).",
            "Vite bundler providing sub-second hot module replacement.",
            "React Router DOM for protected, role-based navigation.",
            "Lucide React icon library and custom CSS variable themes."
        ]),
        ("Backend: Node.js + Express.js", "Server & RESTful API", [
            "Asynchronous, event-driven Node.js runtime environment.",
            "Modular Express routing with centralized error middleware.",
            "Request validation and structured JSON response schemas.",
            "59 REST API endpoints covering all system capabilities."
        ]),
        ("Database: MongoDB Atlas", "Cloud NoSQL Data Layer", [
            "Cloud document database with automated replica sets.",
            "Mongoose Object Data Modeling (ODM) for strict typing.",
            "Relational references and aggregation pipelines for reviews.",
            "Indexed fields on user names, skills, and booking statuses."
        ]),
        ("Security: JWT & Bcrypt", "Authentication & Cryptography", [
            "10-round salted Bcrypt password hashing prior to storage.",
            "Stateless JSON Web Tokens with HS256 cryptographic signatures.",
            "Role-Based Access Control (RBAC) middleware guards.",
            "HTTP Bearer token header authorization protocol."
        ]),
        ("Real-Time: Socket.io", "WebSocket Communication", [
            "Bi-directional WebSocket connection for instant chat.",
            "Room-based channel isolation per conversation thread.",
            "Event listeners for message delivery, read status, and typing.",
            "Built-in 5 free messages limit anti-spam logic."
        ]),
        ("External APIs & Tooling", "Services & Payment Processing", [
            "Razorpay payment gateway order creation & HMAC verification.",
            "Google Gemini AI SDK for intelligent candidate matching.",
            "Google Meet URL validation for confirmed video calls.",
            "Playwright automated browser testing and Jest test suites."
        ])
    ]

    cw = Inches(3.64)
    ch = Inches(2.65)
    for i, (title, sub, pts) in enumerate(stack_cards):
        col = i % 3
        row = i // 3
        cx = Inches(0.8) + col * Inches(4.04)
        cy = Inches(1.45) + row * Inches(2.80)
        add_card(s, cx, cy, cw, ch, bg_color=WHITE, border_color=BORDER_LIGHT)

        tb = s.shapes.add_textbox(cx + Inches(0.18), cy + Inches(0.15), cw - Inches(0.36), ch - Inches(0.30))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = title
        pt.font.name = "Cambria"
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = DARK_GREEN
        pt.space_after = Pt(2)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.name = "Calibri"
        psub.font.size = Pt(9)
        psub.font.color.rgb = TEXT_MUTED
        psub.space_after = Pt(6)

        for pt_txt in pts:
            p = tf.add_paragraph()
            p.space_after = Pt(3)
            p.text = "• " + pt_txt
            p.font.name = "Calibri"
            p.font.size = Pt(9)
            p.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "Here is our complete technology stack. We chose the modern MERN stack with React 19, Express, Node.js, "
        "and MongoDB Atlas. For real-time messaging, we use Socket.io. For security, we use Bcrypt and JWT. "
        "External integrations include Razorpay for payments, Google Gemini for mentor matching, and Playwright for tests."
    )

def build_module_slide(slide_num, category_tag, module_title, overview_text, features, tech_specs, screenshot_file, note_text):
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, module_title, category_tag)
    add_footer(s, slide_num)

    left_w = Inches(5.60)
    top_y = Inches(1.45)

    # 1. Overview Card
    ov_h = Inches(1.15)
    add_card(s, Inches(0.8), top_y, left_w, ov_h, bg_color=LIGHT_GREEN, border_color=BORDER_COLOR)
    tb_ov = s.shapes.add_textbox(Inches(1.0), top_y + Inches(0.12), left_w - Inches(0.4), ov_h - Inches(0.24))
    tf_ov = tb_ov.text_frame
    tf_ov.word_wrap = True
    pov_h = tf_ov.paragraphs[0]
    pov_h.text = "Module Overview"
    pov_h.font.name = "Cambria"
    pov_h.font.size = Pt(11)
    pov_h.font.bold = True
    pov_h.font.color.rgb = DARK_GREEN
    pov_h.space_after = Pt(3)
    pov_b = tf_ov.add_paragraph()
    pov_b.text = overview_text
    pov_b.font.name = "Calibri"
    pov_b.font.size = Pt(9.5)
    pov_b.font.color.rgb = TEXT_BODY

    # 2. Features Card
    feat_top = top_y + ov_h + Inches(0.15)
    feat_h = Inches(2.35)
    add_card(s, Inches(0.8), feat_top, left_w, feat_h, bg_color=WHITE, border_color=BORDER_LIGHT)
    tb_f = s.shapes.add_textbox(Inches(1.0), feat_top + Inches(0.14), left_w - Inches(0.4), feat_h - Inches(0.28))
    tf_f = tb_f.text_frame
    tf_f.word_wrap = True
    pf_h = tf_f.paragraphs[0]
    pf_h.text = "Key Functional Features"
    pf_h.font.name = "Cambria"
    pf_h.font.size = Pt(11)
    pf_h.font.bold = True
    pf_h.font.color.rgb = DARK_GREEN
    pf_h.space_after = Pt(6)

    for hd, desc in features:
        p = tf_f.add_paragraph()
        p.space_after = Pt(4)
        r0 = p.add_run()
        r0.text = "• " + hd + ": "
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = desc
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = TEXT_BODY

    # 3. Technical Specs Card
    tech_top = feat_top + feat_h + Inches(0.15)
    tech_h = Inches(1.65)
    add_card(s, Inches(0.8), tech_top, left_w, tech_h, bg_color=BG_COLOR, border_color=BORDER_COLOR)
    tb_t = s.shapes.add_textbox(Inches(1.0), tech_top + Inches(0.12), left_w - Inches(0.4), tech_h - Inches(0.24))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True
    pt_h = tf_t.paragraphs[0]
    pt_h.text = "Technical Specifications & APIs"
    pt_h.font.name = "Cambria"
    pt_h.font.size = Pt(11)
    pt_h.font.bold = True
    pt_h.font.color.rgb = DARK_GREEN
    pt_h.space_after = Pt(4)

    for k, v in tech_specs:
        p = tf_t.add_paragraph()
        p.space_after = Pt(2)
        r0 = p.add_run()
        r0.text = k + ": "
        r0.font.name = "Calibri"
        r0.font.size = Pt(9)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = v
        r1.font.name = "Calibri"
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = TEXT_BODY

    # Right Column: Screenshot
    img_left = Inches(6.65)
    img_top = Inches(1.45)
    img_w = Inches(5.88)
    img_h = Inches(5.45)
    add_image_bordered(s, screenshot_file, img_left, img_top, img_w, img_h)

    add_speaker_note(s, note_text)

print("Slide builder helpers configured.")

# -------------------------------------------------------------------------------------------------
# 12 DEDICATED MODULE SLIDES
# -------------------------------------------------------------------------------------------------

def build_slide_6_auth_module():
    build_module_slide(
        slide_num=6,
        category_tag="MODULE 1 OF 12: USER ACCESS & SECURITY",
        module_title="Authentication & Authorization Module",
        overview_text="Provides secure account onboarding, role-based registration, and stateless session authentication using 10-round salted Bcrypt password hashing and JSON Web Tokens (JWT).",
        features=[
            ("Dual Role Registration", "Allows users to register specifically as 'Learners' or 'Mentors' with dedicated input validations."),
            ("Cryptographic Password Hashing", "Encrypts user passwords using 10-round salted Bcrypt before storing them in MongoDB Atlas."),
            ("Stateless JWT Issuance", "Generates digitally signed JWT bearer tokens upon login, containing user ID and active role claims."),
            ("Role-Based Route Protection", "Enforces RBAC middleware guards on both client routes and Express API endpoints to prevent privilege escalation.")
        ],
        tech_specs=[
            ("Core Endpoints", "POST /api/register, POST /api/login, GET /api/me, POST /api/logout"),
            ("Security Technologies", "JSON Web Tokens (HS256), Bcrypt.js (10 salt rounds), Auth Middleware"),
            ("Database Model", "User schema (fields: email, password, role: 'learner'|'mentor'|'admin', isActive)"),
            ("Client State", "LocalStorage token persistence with Axios/Fetch authorization bearer interceptor")
        ],
        screenshot_file="02b_signup.png",
        note_text="This slide covers our Authentication & Authorization Module. We provide dual registration for learners and mentors. Passwords are securely hashed with 10-round Bcrypt before database storage. On login, a stateless JWT token is generated to enforce role-based access control across all protected routes."
    )

def build_slide_7_learner_profile_module():
    build_module_slide(
        slide_num=7,
        category_tag="MODULE 2 OF 12: USER PROFILES",
        module_title="Learner Profile Module",
        overview_text="Enables learners to maintain an academic identity, define customized learning objectives, specify desired skill targets, and track their personal mentorship participation.",
        features=[
            ("Learning Goals Definition", "Allows learners to add target skills to learn (e.g., React, Node.js, System Design) for discovery matching."),
            ("Academic Bio & Overview", "Presents personal introduction, university affiliation, and educational interests."),
            ("Profile Completion Indicator", "Tracks profile readiness to ensure users provide sufficient details for matching and booking."),
            ("Engagement Metrics", "Displays live counts of reviews received, reviews given, and total skills listed on the platform.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/profile, PUT /api/profile, POST /api/users/update-profile"),
            ("Client Component", "ProfilePage.jsx, CompleteProfile.jsx, AccountManagement.jsx"),
            ("Database Model", "User schema (fields: skillsToLearn: [String], bio: String, profileCompleted: Boolean)"),
            ("Validation Rules", "Requires non-empty bio and at least one target skill to mark profile completed")
        ],
        screenshot_file="03a_my_profile.png",
        note_text="This slide presents the Learner Profile Module. Students can specify what skills they want to learn, set up their bio, and monitor their profile completion percentage. These saved learning goals are directly utilized by our matching algorithms to recommend relevant mentors."
    )

def build_slide_8_mentor_profile_module():
    build_module_slide(
        slide_num=8,
        category_tag="MODULE 3 OF 12: USER PROFILES",
        module_title="Mentor Profile Module",
        overview_text="Empowers student mentors to showcase domain expertise, specify skill proficiency levels, set hourly rates, publish weekly availability, and display verified student testimonials.",
        features=[
            ("Public Portfolio Showcase", "Displays mentor identity with avatar, verified badge, university background, and technical bio."),
            ("Granular Skill Depth Ratings", "Visualizes proficiency across listed skills from Beginner, Intermediate, Advanced, to Expert."),
            ("Hourly Fee Configuration", "Allows mentors to set custom hourly rates (e.g., ₹500/hr) with automatic pro-rata session calculations."),
            ("Weekly Availability Schedule", "Defines open schedule chips (Weekdays, Weekends, Evenings) and direct 'Book Session' triggers.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/mentors/:id, GET /api/profile/:id, PUT /api/mentors/availability"),
            ("Client Component", "OtherProfilePage.jsx, MentorScheduleChips.jsx, SkillDepthMeter.jsx"),
            ("Database Model", "User schema (fields: skillsToTeach: [String], teachingSkillLevels: Map, hourlyRate: Number)"),
            ("Data Relationship", "One-to-many relationship with Review collection to calculate live average ratings")
        ],
        screenshot_file="03b_other_user_profile.png",
        note_text="Here is the Mentor Profile Module. Mentors can list the technologies they teach along with depth ratings, configure their hourly rate, and define open weekly time slots. Learners can view this public profile, read verified community reviews, and initiate a session booking."
    )

def build_slide_9_discover_search_module():
    build_module_slide(
        slide_num=9,
        category_tag="MODULE 4 OF 12: DISCOVERY & DIRECTORY",
        module_title="Discover & Search Module",
        overview_text="Provides a high-performance searchable directory for learners to browse, filter, and discover qualified mentors and peer tutors across technical domains.",
        features=[
            ("Real-Time Keyword Search", "Instantly filters mentors by name, technical skill tags, or biographical keywords with debounced input."),
            ("Domain Category Filters", "Allows quick 1-click filtering across categories such as Web Development, AI/ML, Design, and Core CS."),
            ("Directory Mentor Cards", "Displays mentor credentials, hourly rates, verified badges, active skills, and direct profile links."),
            ("Dual Role Directory Toggling", "Enables users to toggle between discovering mentors to learn from, or exploring fellow peer learners.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/mentors, GET /api/categories, GET /api/users/search?q=:query"),
            ("Client Component", "DiscoverPage.jsx, MemberCard.jsx, CategoryFilterPills.jsx"),
            ("Database Optimization", "Text indexes on User collection fields: name, bio, skillsToTeach, and skillsToLearn"),
            ("Performance Feature", "Debounced search queries (300ms) to eliminate redundant backend API roundtrips")
        ],
        screenshot_file="04_discover.png",
        note_text="This slide showcases our Discover & Search Module. Learners can find mentors through live search, filter by domain tags like React or Python, and toggle between mentors and peers. Mentor cards display pricing and star ratings, with direct buttons to view profiles or start chats."
    )

def build_slide_10_ai_matching_module():
    build_module_slide(
        slide_num=10,
        category_tag="MODULE 5 OF 12: INTELLIGENT MATCHING",
        module_title="AI Mentor Matching Module",
        overview_text="Leverages an automated multi-factor scoring algorithm and Google Gemini AI to rank and recommend the best-suited mentors based on learner goals, budget, and availability.",
        features=[
            ("Multi-Factor Heuristic Engine", "Evaluates skill overlap, schedule compatibility, learner budget match, and mentor rating metrics."),
            ("Transparent Match Percentage", "Displays normalized match scores (e.g., 66% Match) with specific reasons explaining why the mentor was chosen."),
            ("On-The-Fly Criteria Overrides", "Allows learners to test custom target skills, timing preferences, and budget caps inside the modal."),
            ("Gemini AI Re-Ranking", "Uses Google Gemini LLM API to analyze unstructured bios and contextually re-rank recommendations."),
            ("Caching & Rate Protection", "Features an in-memory cache (15-min TTL) and rate-limiting (10 req/min) to ensure sub-100ms response times.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/matches?skill=:skill&maxPrice=:price&timing=:time&refresh=true"),
            ("Services & Helpers", "matcherService.js, scoreCandidate(), reRankWithGemini(), checkRateLimit()"),
            ("AI Integration", "Google Gemini API (gemini-1.5-flash / gemini-2.0) with automated fallback to heuristic scores"),
            ("Data Aggregation", "Single-pass MongoDB aggregation pipeline on Reviews and Bookings to eliminate N+1 queries")
        ],
        screenshot_file="04b_ai_matcher.png",
        note_text="Here is our AI Mentor Matching Module, accessible via the navbar. It calculates a multi-factor score evaluating skill overlap, budget, schedule, and review ratings. If configured, Google Gemini AI re-ranks candidates based on bio context. In-memory caching ensures fast performance."
    )

def build_slide_11_booking_module():
    build_module_slide(
        slide_num=11,
        category_tag="MODULE 6 OF 12: SESSION LIFECYCLE",
        module_title="Booking & Slot Negotiation Module",
        overview_text="Orchestrates the complete 5-stage session scheduling lifecycle, enabling learners to select time slots and empowering mentors to accept, decline, or counter-propose times.",
        features=[
            ("3-Step Booking Wizard", "Select duration (30, 45, 60, 90, 120 mins), choose upcoming date chip, and pick morning/evening slots."),
            ("Schedule Conflict Validation", "Validates mentor open hours, blocks past timestamps, and strictly prohibits self-booking attempts."),
            ("Automatic 4-Hour Action Window", "Enforces a 4-hour expiration timeout on pending requests to free learner schedules if mentors are inactive."),
            ("Counter-Proposal Negotiation", "Allows mentors to propose up to 3 alternate time slots directly without outright rejecting the learner."),
            ("Meeting Link Attachment", "Automatically attaches a valid Google Meet link upon session confirmation for live video interaction.")
        ],
        tech_specs=[
            ("Core Endpoints", "POST /api/bookings, PUT /api/bookings/:id/respond, PUT /api/bookings/:id/slots, PUT /api/bookings/:id/cancel"),
            ("Lifecycle States", "pending → slots_offered / approved → confirmed → completed / cancelled"),
            ("Database Model", "Booking schema (learner: Ref, mentor: Ref, date, time, duration, status, actionExpiresAt, meetingUrl)"),
            ("Business Logic", "Atomic Mongoose findOneAndUpdate operations preventing race-condition double-booking")
        ],
        screenshot_file="07_booking_flow.png",
        note_text="This slide explains our Booking & Slot Negotiation Module. Booking takes 3 simple steps: duration, date, and time. To prevent ghosting, requests expire after 4 hours if unanswered. Mentors can counter-propose alternate slots, and once confirmed, a Google Meet link is attached."
    )

def build_slide_12_payment_escrow_module():
    build_module_slide(
        slide_num=12,
        category_tag="MODULE 7 OF 12: FINANCIAL TRANSACTIONS",
        module_title="Payment & Escrow Module",
        overview_text="Provides transparent session pricing, simulated wallet management, and a production-grade Razorpay checkout integration with escrow protection.",
        features=[
            ("Pro-Rata Pricing Calculation", "Calculates exact session fee from mentor hourly rate and duration with 0% extra platform commission."),
            ("100% Escrow Protection", "Enforces escrow semantics: payment is held safely until the session is successfully delivered."),
            ("Razorpay Checkout Integration", "Creates verified Razorpay orders in paise (INR) with secure modal checkout on the client."),
            ("HMAC SHA-256 Verification", "Cryptographically validates payment signatures via secret keys to prevent fraud and order tampering."),
            ("Mentor Payout Management", "Enables mentors to configure their payout UPI ID for manual or automated revenue settlements.")
        ],
        tech_specs=[
            ("Core Endpoints", "POST /api/payments/create-order, POST /api/payments/verify, POST /api/payments/webhook"),
            ("Security Technologies", "Razorpay Node.js SDK, Crypto HMAC-SHA256 signature verification, Webhook listeners"),
            ("Database Models", "Booking.payment object (razorpayOrderId, razorpayPaymentId, status: 'paid', logs: Array), Wallet schema"),
            ("Idempotency", "Database-level checks ensuring duplicate webhook events do not re-trigger payment logs")
        ],
        screenshot_file="07b_payment_escrow.png",
        note_text="Here is our Payment & Escrow Module. Pricing is calculated transparently with zero platform fees. We integrated Razorpay for INR transactions with HMAC-SHA256 signature verification. Money remains protected in escrow until the session completes, with UPI ID setup for mentor payouts."
    )

def build_slide_13_chat_module():
    build_module_slide(
        slide_num=13,
        category_tag="MODULE 8 OF 12: REAL-TIME MESSAGING",
        module_title="Real-Time Chat Module",
        overview_text="Facilitates persistent, low-latency 1-on-1 messaging between mentors and learners to coordinate session agendas, share resources, and discuss technical questions.",
        features=[
            ("Socket.io WebSocket Engine", "Enables instantaneous two-way message delivery without requiring manual browser refreshes."),
            ("5 Free Messages Anti-Spam Barrier", "Limits unsolicited outreach to 5 free direct messages until an active session booking is created."),
            ("Unlimited Chat on Booking", "Automatically lifts messaging restrictions once a booking request is accepted by the mentor."),
            ("Conversation Thread Management", "Maintains active conversation list showing peer avatars, last message preview, and timestamps."),
            ("Real-Time Presence & Typing", "Broadcasts typing indicator events and manages message read receipts across users.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/conversations, GET /api/messages/:convId, POST /api/messages"),
            ("WebSocket Events", "join_conversation, send_message, receive_message, typing, message_read"),
            ("Database Models", "Conversation schema (participants: [Ref], lastMessage), Message schema (sender, text, readBy)"),
            ("Client Component", "ChatPage.jsx, SocketContext.jsx, MessageBubble.jsx, ConversationList.jsx")
        ],
        screenshot_file="08_chat.png",
        note_text="This slide presents our Real-Time Chat Module powered by Socket.io. Learners and mentors can chat instantly. To prevent spam, learners get 5 free direct messages before booking. Once a session is booked, unlimited messaging unlocks automatically."
    )

def build_slide_14_reviews_module():
    build_module_slide(
        slide_num=14,
        category_tag="MODULE 9 OF 12: COMMUNITY TRUST",
        module_title="Reviews & Ratings Module",
        overview_text="Builds platform credibility through a verified mutual feedback system where learners submit quantitative star ratings and qualitative reviews following completed sessions.",
        features=[
            ("Verified Post-Session Feedback", "Restricts review submissions strictly to learners who have completed a confirmed session."),
            ("1-to-5 Star Rating Scale", "Captures numeric quality ratings paired with detailed written testimonial comments."),
            ("Automated Rating Aggregation", "Recalculates mentor cumulative review counts and average rating in real time on every submission."),
            ("Public Credibility Display", "Displays star ratings prominently on mentor cards and profile pages to guide future learners."),
            ("Duplicate Review Prevention", "Enforces a unique database constraint on (bookingId, reviewer) to prevent review manipulation.")
        ],
        tech_specs=[
            ("Core Endpoints", "POST /api/reviews, GET /api/reviews/mentor/:id, GET /api/reviews/my"),
            ("Client Component", "RatingCard.jsx, StarRatingInput.jsx, ReviewsList.jsx"),
            ("Database Model", "Review schema (mentor: Ref, learner: Ref, bookingId: Ref, rating: Number [1-5], comment: String)"),
            ("Aggregation", "MongoDB $group aggregation pipeline dynamically computing averageRating = $avg(rating)")
        ],
        screenshot_file="09_ratings_reviews.png",
        note_text="Here is the Reviews & Ratings Module. To build community trust, learners submit 1 to 5 star ratings and written reviews after completing a session. Our database automatically aggregates average ratings and displays them publicly on mentor profiles."
    )

def build_slide_15_learner_dashboard_module():
    build_module_slide(
        slide_num=15,
        category_tag="MODULE 10 OF 12: ROLE-BASED PORTALS",
        module_title="Learner Dashboard Module",
        overview_text="Serves as the personalized student command center to monitor live learning hours, track upcoming sessions, manage mentor connections, and follow academic milestones.",
        features=[
            ("Live Academic KPI Cards", "Summarizes total learning hours, sessions attended, connected mentors, and skills explored."),
            ("Upcoming Session Timeline", "Lists scheduled calls with countdowns, meeting links, and instant 'Open Chat' navigation."),
            ("Learning Roadmap Milestones", "Tracks learner progression across target curriculum topics (e.g., Node.js, System Design)."),
            ("Session Status Filters", "Enables 1-click filtering across All, Pending, Confirmed, Completed, and Cancelled bookings.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/dashboard/learner, GET /api/bookings/my-bookings?role=learner"),
            ("Client Component", "LearnerDashboard.jsx, SessionCard.jsx, MetricStatsCard.jsx"),
            ("Security Guard", "Protected by roleMiddleware('learner') preventing unauthorized role access"),
            ("Data Computation", "Dynamically sums completed booking durations into total hours of live learning")
        ],
        screenshot_file="05_learner_dashboard.png",
        note_text="This slide shows the Learner Dashboard Module. It acts as the student's command center, tracking completed learning hours, upcoming sessions, and mentor connections. Students can directly join their scheduled video calls or review past session history."
    )

def build_slide_16_mentor_dashboard_module():
    build_module_slide(
        slide_num=16,
        category_tag="MODULE 11 OF 12: ROLE-BASED PORTALS",
        module_title="Mentor Dashboard Module",
        overview_text="Equips student mentors with a comprehensive Teaching Studio to review incoming booking requests, monitor student reach, manage skill depth, and track earnings.",
        features=[
            ("Teaching Studio Metrics", "Displays live statistics: Learners Taught, Sessions Completed, and Average Community Rating."),
            ("Incoming Request Management", "Features 1-click action buttons to Accept, Propose Alternate Times, or Decline pending sessions."),
            ("Visual Skill Depth Meters", "Visualizes mentor proficiency levels (Beginner to Expert) across their listed technical subjects."),
            ("Earnings & Payouts Tab", "Displays lifetime revenue, settled earnings, and allows mentors to configure their payout UPI ID.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/dashboard/mentor, GET /api/bookings/my-bookings?role=mentor, POST /api/payout-upi"),
            ("Client Component", "MentorDashboard.jsx, SessionRequestCard.jsx, EarningsOverview.jsx"),
            ("Security Guard", "Protected by roleMiddleware('mentor') ensuring strict role isolation"),
            ("Financial Aggregation", "Queries completed paid bookings to compute lifetime revenue and pending settlement balances")
        ],
        screenshot_file="06_mentor_dashboard.png",
        note_text="Here is the Mentor Dashboard Module. Mentors manage their teaching studio, accept or counter-propose booking requests, and visualize their skill depth. In the Earnings tab, mentors track their lifetime revenue and configure their payout UPI ID."
    )

def build_slide_17_admin_module():
    build_module_slide(
        slide_num=17,
        category_tag="MODULE 12 OF 12: SYSTEM ADMINISTRATION",
        module_title="Admin & Financial Management Module",
        overview_text="Provides platform administrators with a centralized control console to audit system health, verify member credentials, moderate accounts, and export reports.",
        features=[
            ("Platform Health KPIs", "Live tracking of total registered members (14), active mentors (8), learners (5), and sessions (29)."),
            ("Community Member Management", "Audit table allowing administrators to inspect profiles, verify student identities, or suspend bad actors."),
            ("Financial Administration", "Monitors total booking volume, payment statuses, and tracks settlement requests."),
            ("Downloadable CSV Ledgers", "Generates and exports platform data as structured CSV files for offline academic auditing."),
            ("Isolated Dark Workspace", "Scoped styling rules ensuring high-contrast data visualization during extensive system audits.")
        ],
        tech_specs=[
            ("Core Endpoints", "GET /api/admin/stats, GET /api/admin/users, PUT /api/admin/users/:id/status, GET /api/admin/export/csv"),
            ("Client Component", "AdminPage.jsx, AdminUserTable.jsx, AdminPayments.jsx, AdminOverviewCards.jsx"),
            ("Security Guard", "Enforces requireAdmin middleware validating role === 'admin' on every transaction"),
            ("Audit Logging", "Integrates with ActivityLog collection to record all administrative moderation actions")
        ],
        screenshot_file="10_admin_dashboard.png",
        note_text="This slide covers our Admin & Financial Management Module. The admin oversees platform health, audits user counts, verifies credentials, and moderates users. Financial records can be exported as CSV spreadsheets for compliance and grading."
    )

# -------------------------------------------------------------------------------------------------
# REMAINING ESSENTIAL SLIDES (18 to 22)
# -------------------------------------------------------------------------------------------------

def build_slide_18_database_design():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "Database Design: 8 Primary Collections & Schemas", "DATABASE ARCHITECTURE")
    add_footer(s, 18)

    db_cards = [
        ("Users Collection (Mongoose Model)", "Account, Authentication & Profiles", [
            "name (String), email (String, unique, indexed)",
            "password (String, 10-round bcrypt hash)",
            "role (Enum: 'learner' | 'mentor' | 'admin')",
            "skillsToTeach ([String]), skillsToLearn ([String])",
            "teachingSkillLevels (Map of skill -> level)",
            "hourlyRate (Number), availability ([String])",
            "payoutUpiId (String), profileCompleted (Boolean), isActive (Boolean)"
        ]),
        ("Bookings Collection (State Machine)", "Session Lifecycle & Scheduling", [
            "learner (ObjectId, Ref: User), mentor (ObjectId, Ref: User)",
            "date (String), time (String), duration (Number, 30-120m)",
            "status (Enum: 'pending'|'approved'|'confirmed'|'completed'|'cancelled')",
            "actionExpiresAt (Date, 4-hour countdown), suggestedSlots ([Object])",
            "meetingUrl (String, Google Meet link)",
            "payment (status: 'pending'|'paid', razorpayOrderId, logs: [Object])"
        ]),
        ("Chat & Messaging Collections", "Conversations & Messages (Socket.io)", [
            "Conversation: participants ([ObjectId, Ref: User])",
            "Conversation: bookingId (ObjectId, Ref: Booking)",
            "Conversation: lastMessage (String), updatedAt (Date)",
            "Message: conversationId (ObjectId, Ref: Conversation)",
            "Message: sender (ObjectId, Ref: User), text (String)",
            "Message: isEdited (Boolean), readBy ([ObjectId, Ref: User])"
        ]),
        ("Ratings, Logs & Platform Collections", "Feedback, Auditing & Configuration", [
            "Review: mentor (Ref), learner (Ref), bookingId (Ref, unique)",
            "Review: rating (Number, 1-5), comment (String), createdAt",
            "ActivityLog: actor (Ref), action (String), entityType, metadata",
            "Wallet: user (Ref), balance (Number), transactions ([Ref])",
            "Setting: key (String, unique), value (Mixed), updatedAt",
            "Total Collections: Exactly 8 primary collections matching synopsis"
        ])
    ]

    cw = Inches(5.66)
    ch = Inches(2.65)
    for i, (title, sub, fields) in enumerate(db_cards):
        col = i % 2
        row = i // 2
        cx = Inches(0.8) + col * Inches(6.07)
        cy = Inches(1.45) + row * Inches(2.80)
        add_card(s, cx, cy, cw, ch, bg_color=WHITE, border_color=BORDER_LIGHT)

        tb = s.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.15), cw - Inches(0.4), ch - Inches(0.30))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = title
        pt.font.name = "Cambria"
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = DARK_GREEN
        pt.space_after = Pt(2)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.name = "Calibri"
        psub.font.size = Pt(9)
        psub.font.color.rgb = TEXT_MUTED
        psub.space_after = Pt(6)

        for fld in fields:
            p = tf.add_paragraph()
            p.space_after = Pt(2.5)
            p.text = "• " + fld
            p.font.name = "Consolas"
            p.font.size = Pt(8.5)
            p.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "Here is our database design implemented on MongoDB Atlas with Mongoose schemas. We engineered exactly "
        "8 primary collections: Users, Bookings, Conversations, Messages, Reviews, ActivityLogs, Wallets, and Settings. "
        "Strict indexation and unique constraints guarantee data consistency and prevent race conditions."
    )

def build_slide_19_testing():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "Testing & Quality Assurance: Verification Strategy", "VERIFICATION & RELIABILITY")
    add_footer(s, 19)

    test_cards = [
        ("Backend Unit & Integration Testing", "Jest & Supertest Test Suites", [
            ("JWT Token Verification: ", "Tests valid bearer extraction, expiration handling, and malformed header rejection."),
            ("RBAC Route Isolation: ", "Verifies that learners cannot access /admin or /mentor-dashboard endpoints."),
            ("Booking State Transitions: ", "Tests valid transitions from pending to confirmed, rejecting invalid skips."),
            ("Razorpay Signature Validation: ", "Tests HMAC SHA-256 calculation against forged webhook payloads.")
        ]),
        ("Frontend End-to-End Walkthroughs", "Playwright Automated Browser Testing", [
            ("Multi-Role Login Simulation: ", "Automated login walkthroughs for Learner, Mentor, and Admin credentials."),
            ("Search & Filter Debounce: ", "Validates directory response times and proper query debouncing under rapid typing."),
            ("3-Step Booking Modal Flow: ", "Tests duration selection, date chip toggling, and successful API submission."),
            ("Real-Time Message Dispatch: ", "Tests Socket.io message broadcasting, bubble rendering, and receipt updates.")
        ]),
        ("Security & Edge Case Validation", "Defensive System Invariants", [
            ("Self-Booking Prevention: ", "Validates that mentors cannot create booking requests with themselves."),
            ("4-Hour Timer Expiration: ", "Automated tests confirming pending requests expire automatically after 4 hours."),
            ("Input Sanitization: ", "Escapes HTML and validates email formats and password length limits on signup."),
            ("Rate Limiting: ", "Tests HTTP 429 Too Many Requests responses when AI matching threshold is exceeded.")
        ]),
        ("Cross-Device & Theme Regression", "Visual & Functional Accessibility", [
            ("Desktop Form Factor (1440x900): ", "Validates multi-column grid layouts, tables, and modal centering on desktop."),
            ("Mobile Form Factor (390x844): ", "Tests touch targets, hamburger drawer navigation, and responsive typography."),
            ("Dark Theme Contrast Verification: ", "Verifies WCAG contrast compliance across public and admin dark themes."),
            ("CSS Specificity Resolution: ", "Scoped admin stylesheet resolving background collisions in dark mode.")
        ])
    ]

    cw = Inches(5.66)
    ch = Inches(2.65)
    for i, (title, sub, pts) in enumerate(test_cards):
        col = i % 2
        row = i // 2
        cx = Inches(0.8) + col * Inches(6.07)
        cy = Inches(1.45) + row * Inches(2.80)
        add_card(s, cx, cy, cw, ch, bg_color=WHITE, border_color=BORDER_LIGHT)

        tb = s.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.15), cw - Inches(0.4), ch - Inches(0.30))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = title
        pt.font.name = "Cambria"
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = DARK_GREEN
        pt.space_after = Pt(2)

        psub = tf.add_paragraph()
        psub.text = sub
        psub.font.name = "Calibri"
        psub.font.size = Pt(9)
        psub.font.color.rgb = TEXT_MUTED
        psub.space_after = Pt(6)

        for b_hd, b_txt in pts:
            p = tf.add_paragraph()
            p.space_after = Pt(3)
            r0 = p.add_run()
            r0.text = "• " + b_hd
            r0.font.name = "Calibri"
            r0.font.size = Pt(9)
            r0.font.bold = True
            r0.font.color.rgb = TEXT_DARK
            r1 = p.add_run()
            r1.text = b_txt
            r1.font.name = "Calibri"
            r1.font.size = Pt(8.5)
            r1.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "We executed a comprehensive multi-layer testing strategy. Jest and Supertest verified our backend routes, "
        "RBAC security, and booking transitions. Playwright automated end-to-end browser walkthroughs for all three roles. "
        "We also validated responsive layouts across desktop and mobile, and resolved dark mode CSS contrast bugs."
    )

def build_slide_20_results():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "Project Results: Quantitative Deliverables & Metrics", "EVALUATION & BENCHMARKS")
    add_footer(s, 20)

    # 4 Stat Highlight Cards across Top
    metrics = [
        ("14 PAGES", "Frontend Pages Built", "Exceeds synopsis recommendation of 10–15 pages"),
        ("59 APIS", "REST Endpoints Built", "Exceeds synopsis recommendation of 15–20 APIs"),
        ("8 COLLECTIONS", "MongoDB Collections", "Matches synopsis specification of 6–8 collections"),
        ("< 100 MS", "Average API Latency", "Optimized with indexing & in-memory matching cache")
    ]
    mw = Inches(2.72)
    mh = Inches(1.40)
    my = Inches(1.45)
    for i, (stat, label, note) in enumerate(metrics):
        cx = Inches(0.8) + i * Inches(3.00)
        add_card(s, cx, my, mw, mh, bg_color=LIGHT_GREEN, border_color=BORDER_COLOR)
        tb = s.shapes.add_textbox(cx + Inches(0.15), my + Inches(0.12), mw - Inches(0.30), mh - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True

        ps = tf.paragraphs[0]
        ps.text = stat
        ps.font.name = "Cambria"
        ps.font.size = Pt(17)
        ps.font.bold = True
        ps.font.color.rgb = DARK_GREEN
        ps.space_after = Pt(2)

        pl = tf.add_paragraph()
        pl.text = label
        pl.font.name = "Calibri"
        pl.font.size = Pt(10)
        pl.font.bold = True
        pl.font.color.rgb = TEXT_DARK

        pn = tf.add_paragraph()
        pn.text = note
        pn.font.name = "Calibri"
        pn.font.size = Pt(8.5)
        pn.font.color.rgb = TEXT_MUTED

    # 2 Comparison Analysis Boxes below
    by = Inches(3.10)
    bw = Inches(5.66)
    bh = Inches(3.75)

    # Left: Functional Milestones
    add_card(s, Inches(0.8), by, bw, bh, bg_color=WHITE, border_color=BORDER_LIGHT)
    tbl = s.shapes.add_textbox(Inches(1.05), by + Inches(0.2), bw - Inches(0.5), bh - Inches(0.4))
    tfl = tbl.text_frame
    tfl.word_wrap = True
    plh = tfl.paragraphs[0]
    plh.text = "Functional Milestones Achieved"
    plh.font.name = "Cambria"
    plh.font.size = Pt(13)
    plh.font.bold = True
    plh.font.color.rgb = DARK_GREEN
    plh.space_after = Pt(10)

    f_achieved = [
        ("End-to-End Mentorship Flow: ", "Successfully implemented registration → search → AI matching → booking → payment → chat → review."),
        ("Multi-Role Separation: ", "Clean isolation of Learner, Mentor, and Admin workflows with RBAC middleware."),
        ("Dual Communication Engine: ", "REST API for persistent data and Socket.io WebSockets for real-time chat."),
        ("Defensive State Machine: ", "Zero ghost bookings, enforced 4-hour expirations, and conflict-free calendar booking.")
    ]
    for h, d in f_achieved:
        p = tfl.add_paragraph()
        p.space_after = Pt(6)
        r0 = p.add_run()
        r0.text = "• " + h
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = d
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = TEXT_BODY

    # Right: Live Deployment Verification
    add_card(s, Inches(6.87), by, bw, bh, bg_color=WHITE, border_color=BORDER_LIGHT)
    tbr = s.shapes.add_textbox(Inches(7.12), by + Inches(0.2), bw - Inches(0.5), bh - Inches(0.4))
    tfr = tbr.text_frame
    tfr.word_wrap = True
    prh = tfr.paragraphs[0]
    prh.text = "Live Deployment & Verification"
    prh.font.name = "Cambria"
    prh.font.size = Pt(13)
    prh.font.bold = True
    prh.font.color.rgb = DARK_GREEN
    prh.space_after = Pt(10)

    d_achieved = [
        ("Production Cloud Hosting: ", "Frontend deployed live on Vercel at https://skill-exchange-one-eta.vercel.app/"),
        ("Database Cloud Cluster: ", "Connected to MongoDB Atlas with automated TLS encryption and connection pooling."),
        ("Automated Test Evidence: ", "100% test pass rate across Jest unit suites and Playwright headless walkthroughs."),
        ("Accessibility & Themes: ", "Fully responsive on desktop and mobile viewports with complete light/dark theme support.")
    ]
    for h, d in d_achieved:
        p = tfr.add_paragraph()
        p.space_after = Pt(6)
        r0 = p.add_run()
        r0.text = "• " + h
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = d
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "Here are our measurable project results. We delivered 14 frontend pages, 59 REST API endpoints, and 8 database "
        "collections, exceeding all minimum scope requirements in our synopsis. The system is deployed live on Vercel "
        "with sub-100 millisecond response times and a 100% automated test pass rate."
    )

def build_slide_21_conclusion_future():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s)
    add_header(s, "Conclusion & Future Scope: Next Iterations", "SUMMARY & FUTURE ENHANCEMENTS")
    add_footer(s, 21)

    card_w = Inches(5.66)
    card_h = Inches(5.30)
    top_y = Inches(1.50)

    # Left: Conclusion
    add_card(s, Inches(0.8), top_y, card_w, card_h, bg_color=WHITE, border_color=BORDER_LIGHT)
    tb_l = s.shapes.add_textbox(Inches(1.05), top_y + Inches(0.25), card_w - Inches(0.5), card_h - Inches(0.5))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    pl = tf_l.paragraphs[0]
    pl.text = "Project Conclusion"
    pl.font.name = "Cambria"
    pl.font.size = Pt(14)
    pl.font.bold = True
    pl.font.color.rgb = DARK_GREEN
    pl.space_after = Pt(12)

    concl_points = [
        ("Comprehensive MERN Platform: ", "Successfully designed, developed, and deployed a production-ready web application addressing peer learning friction."),
        ("Elimination of Informal Chaos: ", "Replaced unorganized WhatsApp/Discord study swaps with structured scheduling, verified profiles, and automated reminders."),
        ("Enterprise Architecture: ", "Engineered with strict separation of concerns across 12 independent modules, protected by JWT authentication and RBAC guards."),
        ("Verified Academic Deliverable: ", "Completed as a comprehensive B.Tech Computer Science and Engineering capstone project during internship at Codroid Hub Pvt. Ltd.")
    ]
    for h, d in concl_points:
        p = tf_l.add_paragraph()
        p.space_after = Pt(8)
        r0 = p.add_run()
        r0.text = "• " + h
        r0.font.name = "Calibri"
        r0.font.size = Pt(10)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = d
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = TEXT_BODY

    # Right: Future Scope (Approved Synopsis Section 9)
    add_card(s, Inches(6.87), top_y, card_w, card_h, bg_color=WHITE, border_color=BORDER_LIGHT)
    tb_r = s.shapes.add_textbox(Inches(7.12), top_y + Inches(0.25), card_w - Inches(0.5), card_h - Inches(0.5))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    pr = tf_r.paragraphs[0]
    pr.text = "Future Enhancements (Approved Synopsis)"
    pr.font.name = "Cambria"
    pr.font.size = Pt(14)
    pr.font.bold = True
    pr.font.color.rgb = DARK_GREEN
    pr.space_after = Pt(12)

    fut_points = [
        ("1. AI-Based Mentor Recommendations: ", "Enhance current heuristic scoring with machine-learned collaborative filtering to automatically match learners with optimal peer mentors."),
        ("2. In-App Video Call Integration: ", "Embed native WebRTC peer-to-peer video and audio streaming directly inside session rooms, eliminating third-party meeting links."),
        ("3. Skill Certification Badges: ", "Award verifiable digital badges and skill certificates upon successful completion of curriculum milestones verified by mentors."),
        ("4. Gamified Learning Paths: ", "Introduce gamified progress roadmaps, achievement points, and study streak trackers to drive consistent student engagement.")
    ]
    for h, d in fut_points:
        p = tf_r.add_paragraph()
        p.space_after = Pt(8)
        r0 = p.add_run()
        r0.text = "• " + h
        r0.font.name = "Calibri"
        r0.font.size = Pt(10)
        r0.font.bold = True
        r0.font.color.rgb = TEXT_DARK
        r1 = p.add_run()
        r1.text = d
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = TEXT_BODY

    add_speaker_note(s,
        "In conclusion, Skill Exchange successfully bridges the mentorship gap through a full-stack MERN application. "
        "For future enhancements, we have outlined four roadmap items directly from our synopsis: collaborative filtering AI, "
        "native WebRTC video calling, skill certification badges, and gamified progress tracking."
    )

def build_slide_22_team_qa():
    s = prs.slides.add_slide(blank_layout)
    set_slide_bg(s, DARK_GREEN)

    logo_path = os.path.join(SCREENSHOTS_DIR, "logo_white.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(SCREENSHOTS_DIR, "logo.png")
    if os.path.exists(logo_path):
        s.shapes.add_picture(logo_path, Inches(11.2), Inches(0.9), Inches(1.3), Inches(1.3))

    tb = s.shapes.add_textbox(Inches(1.0), Inches(1.3), Inches(10.0), Inches(5.2))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "CAPSTONE EVALUATION · Q&A SESSION"
    p0.font.name = "Calibri"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(0x9A, 0xE6, 0xB4)
    p0.space_after = Pt(10)

    p1 = tf.add_paragraph()
    p1.text = "Thank You!"
    p1.font.name = "Cambria"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = WHITE
    p1.space_after = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Questions & Technical Discussion Welcome"
    p2.font.name = "Calibri"
    p2.font.size = Pt(18)
    p2.font.color.rgb = RGBColor(0xE2, 0xF0, 0xEA)
    p2.space_after = Pt(28)

    p3 = tf.add_paragraph()
    p3.text = "Project Repository:   github.com/CosmicCoder06/Skill-Exchange"
    p3.font.name = "Consolas"
    p3.font.size = Pt(12)
    p3.font.bold = True
    p3.font.color.rgb = WHITE
    p3.space_after = Pt(6)

    p4 = tf.add_paragraph()
    p4.text = "Live Deployment:      https://skill-exchange-one-eta.vercel.app/"
    p4.font.name = "Consolas"
    p4.font.size = Pt(12)
    p4.font.bold = True
    p4.font.color.rgb = WHITE
    p4.space_after = Pt(28)

    p5 = tf.add_paragraph()
    p5.text = "Developed by Team CosmicCoder (Group Number 13)"
    p5.font.name = "Calibri"
    p5.font.size = Pt(13)
    p5.font.bold = True
    p5.font.color.rgb = RGBColor(0xC8, 0xE6, 0xD8)
    p5.space_after = Pt(4)

    p6 = tf.add_paragraph()
    p6.text = "Department of Computer Science & Engineering | GLA University, Mathura"
    p6.font.name = "Calibri"
    p6.font.size = Pt(11)
    p6.font.color.rgb = RGBColor(0xA0, 0xD4, 0xBE)

    add_speaker_note(s,
        "Thank you esteemed evaluators and teachers for your time and guidance. We are now open for technical discussion, "
        "code inspection, and live application demonstration questions."
    )

def build_all_slides():
    print("Building Slide 1: Title Slide...")
    build_slide_1_title()
    print("Building Slide 2: Intro & Problem...")
    build_slide_2_intro_problem()
    print("Building Slide 3: Objectives & Scope...")
    build_slide_3_objectives()
    print("Building Slide 4: System Architecture...")
    build_slide_4_architecture()
    print("Building Slide 5: Tech Stack...")
    build_slide_5_tech_stack()

    print("Building Slide 6: Module 1 (Auth)...")
    build_slide_6_auth_module()
    print("Building Slide 7: Module 2 (Learner Profile)...")
    build_slide_7_learner_profile_module()
    print("Building Slide 8: Module 3 (Mentor Profile)...")
    build_slide_8_mentor_profile_module()
    print("Building Slide 9: Module 4 (Discover & Search)...")
    build_slide_9_discover_search_module()
    print("Building Slide 10: Module 5 (AI Matcher)...")
    build_slide_10_ai_matching_module()
    print("Building Slide 11: Module 6 (Booking & Negotiation)...")
    build_slide_11_booking_module()
    print("Building Slide 12: Module 7 (Payment & Escrow)...")
    build_slide_12_payment_escrow_module()
    print("Building Slide 13: Module 8 (Real-Time Chat)...")
    build_slide_13_chat_module()
    print("Building Slide 14: Module 9 (Reviews & Ratings)...")
    build_slide_14_reviews_module()
    print("Building Slide 15: Module 10 (Learner Dashboard)...")
    build_slide_15_learner_dashboard_module()
    print("Building Slide 16: Module 11 (Mentor Dashboard)...")
    build_slide_16_mentor_dashboard_module()
    print("Building Slide 17: Module 12 (Admin Management)...")
    build_slide_17_admin_module()

    print("Building Slide 18: Database Design...")
    build_slide_18_database_design()
    print("Building Slide 19: Testing & QA...")
    build_slide_19_testing()
    print("Building Slide 20: Results & Metrics...")
    build_slide_20_results()
    print("Building Slide 21: Conclusion & Future Scope...")
    build_slide_21_conclusion_future()
    print("Building Slide 22: Team & QA...")
    build_slide_22_team_qa()

    prs.save(OUTPUT_FILE)
    print(f"Presentation saved successfully to: {OUTPUT_FILE}")

if __name__ == "__main__":
    build_all_slides()
