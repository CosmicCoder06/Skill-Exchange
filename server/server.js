require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);


// =========================
// Database
// =========================

const connectDB = require("./Backend Configuration/Configuration Folders/DB Configuration/dbConfig");


// =========================
// Routes
// =========================

// Auth Routes
const RegistrationApi = require("./Backend Configuration/Routes/Registration & Login Route/Register/register");
const getUsers = require("./Backend Configuration/Routes/Get All User Route/getUser");
const deleteUsers = require("./Backend Configuration/Routes/User Data Deleted/userDataDelete");
const updatedUser = require("./Backend Configuration/Routes/User Updation Route/userUpdateRoute");
const LoginRoute = require("./Backend Configuration/Routes/Registration & Login Route/Login/loginRoute");

// Profile
const profileRoutes = require("./routes/profileRoutes");

// Chat
const chatRoutes = require("./routes/chatRoutes");
const initializeChatSocket = require("./sockets/chatSocket");

// Admin
const adminRoutes = require("./routes/adminRoutes");

// Dashboard
const dashboardRoutes = require("./routes/dashboardRoutes");

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
// Database
// =========================

connectDB();


// =========================
// APIs
// =========================

app.use("/api", RegistrationApi);
app.use("/api", getUsers);
app.use("/api", deleteUsers);
app.use("/api", updatedUser);
app.use("/api", LoginRoute);


// Profile API
app.use("/api", profileRoutes);


// Chat API
app.use("/api", chatRoutes);

// Admin API
app.use("/api", adminRoutes);

// Dashboard API
app.use("/api", dashboardRoutes);




// =========================
// Socket.io
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
// Server
// =========================

const port = process.env.PORT || 5000;


server.listen(port, () => {
    console.log(`Your Server is running at port ${port}`);
});
