require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

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

// =========================
// Profile Routes
// =========================

const profileRoutes = require("./routes/profileRoutes");

// =========================
// Chat Routes & Socket
// =========================

const chatRoutes = require("./routes/chatRoutes");
const initializeChatSocket = require("./sockets/chatSocket");

// =========================
// Booking & Review Routes
// =========================

const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// =========================
// Middleware
// =========================

app.use(express.json());

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true
    })
);

// =========================
// Health Check
// =========================

app.get("/", (req, res) => {
    res.send("Skill Exchange Server is Running 🚀");
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

// Profile
app.use("/api", profileRoutes);

// Chat
app.use("/api", chatRoutes);

// Booking
app.use("/api", bookingRoutes);

// Reviews
app.use("/api", reviewRoutes);

// =========================
// Socket.io Configuration
// =========================

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set("io", io);

initializeChatSocket(io);

// =========================
// Start Server
// =========================

const port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log(`Your Server is running at port ${port}`);
});