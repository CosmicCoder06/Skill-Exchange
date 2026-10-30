const compression = require("compression");
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);

// =========================
// Database Configuration
// =========================

const connectDB = require(
    "./Backend Configuration/Configuration Folders/DB Configuration/dbConfig"
);

// =========================
// Authentication Routes
// =========================

const RegistrationApi = require(
    "./Backend Configuration/Routes/Registration & Login Route/Register/register"
);

const getUsers = require(
    "./Backend Configuration/Routes/Get All User Route/getUser"
);

const deleteUsers = require(
    "./Backend Configuration/Routes/User Data Deleted/userDataDelete"
);

const updatedUser = require(
    "./Backend Configuration/Routes/User Updation Route/userUpdateRoute"
);

const LoginRoute = require(
    "./Backend Configuration/Routes/Registration & Login Route/Login/loginRoute"
);
const sessionRoutes = require(
    "./Backend Configuration/Routes/Token and Session Route/tokenRoute"
);

// =========================
// Profile Routes
// =========================

const profileRoutes =
    require("./routes/profileRoutes");

// =========================
// Chat Routes
// =========================

const chatRoutes =
    require("./routes/chatRoutes");

const initializeChatSocket =
    require("./sockets/chatSocket");

// =========================
// Booking & Review Routes
// =========================

const bookingRoutes =
    require("./routes/bookingRoutes");

const reviewRoutes =
    require("./routes/reviewRoutes");

// =========================
// Dashboard Routes
// =========================

const dashboardRoutes =
    require("./routes/dashboardRoutes");

// =========================
// ADMIN ROUTES
// =========================

const adminRoutes =
    require("./routes/adminRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const matchRoutes = require("./routes/matchRoutes");
const skillCategoryRoutes = require("./routes/skillCategoryRoutes");
const settingRoutes = require("./routes/settingRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");

// =========================
// Error Handling Middleware Imports
// =========================

const {
    notFound,
    errorHandler,
} = require("./Backend Configuration/Configuration Folders/Middleware Configuration/errorMiddleware");

// =========================
// Middleware
// =========================

app.use(compression());

app.use(express.json({
    limit: '400kb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cookieParser());

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// =========================
// Health Check
// =========================

app.get("/", (req, res) => {
    res.send(
        "Skill Exchange Server is Running 🚀"
    );
});

// =========================
// Connect Database
// =========================

connectDB();

// =========================
// API Routes
// =========================

// Authentication
app.use("/api", RegistrationApi);
app.use("/api", getUsers);
app.use("/api", deleteUsers);
app.use("/api", updatedUser);
app.use("/api", LoginRoute);
app.use("/api", sessionRoutes);

// Profile
app.use("/api", profileRoutes);

// Chat
app.use("/api", chatRoutes);

// Booking
app.use("/api", bookingRoutes);

// Reviews
app.use("/api", reviewRoutes);

// Dashboard
// Protected internally by:
// verifyToken + authorize("mentor"/"learner")
app.use("/api", dashboardRoutes);

app.use("/api", mentorRoutes);
app.use("/api", matchRoutes);
// wallet routes removed (demo)
app.use("/api", skillCategoryRoutes);
app.use("/api", settingRoutes);
app.use("/api", activityLogRoutes);

// Admin
// Protected internally by:
// verifyToken + authorize("admin")
// Keep this router after non-admin routes because its router-level
// authorization middleware applies to every request that reaches it.
app.use('/api', require('./routes/paymentRoutes'));
app.use("/api", adminRoutes);

// =========================
// Centralized Error Handlers
// =========================

app.use(notFound);
app.use(errorHandler);

// =========================
// Socket.io
// =========================

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.set("io", io);

initializeChatSocket(io);

// =========================
// Start Server
// =========================

const port =
    process.env.PORT || 5000;

server.listen(port, "0.0.0.0", () => {
    console.log(
        `Your Server is running at port ${port} on 0.0.0.0`
    );
});
// @teamcosmiccoders
