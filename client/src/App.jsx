import { useEffect, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

import LoginPage from "./Pages/Login Page/loginPage";
import RegistrationPage from "./Pages/Registration Page/registrationPage";
import ChatPage from "./Pages/ChatPage";
import ProfilePage from "./Pages/Profile Page/ProfilePage";
import CompleteProfile from "./Pages/Profile Page/CompleteProfile";
import OtherProfilePage from "./Pages/Profile Page/OtherProfilePage";
import HomePage from "./Pages/HomePage";
import DiscoverPage from "./Pages/DiscoverPage";
import BookingPage from "./Pages/BookingPage";
import MyBookings from "./Pages/MyBookings";

// =========================
// DASHBOARDS
// =========================
import LearnerDashboard from "./Pages/Learner Dashboard/LearnerDashboard";
import MentorDashboard from "./Pages/Mentor Dashboard/MentorDashboard";

// =========================
// ADMIN
// =========================
import AdminPage from "./Pages/Admin Page/admin";

import { SocketProvider } from "./context/SocketContext";

// =====================================================
// PROFILE COMPLETION CHECK
// =====================================================

const hasCompletedDetails = (profile) => {
    const hasText = (value) =>
        typeof value === "string" &&
        value.trim().length > 0;

    const hasSkill = (skills) =>
        Array.isArray(skills) &&
        skills.some(hasText);

    return (
        hasText(profile?.bio) &&
        hasSkill(profile?.skillsToTeach) &&
        hasSkill(profile?.skillsToLearn)
    );
};

// =====================================================
// GET USER ID FROM JWT
// =====================================================

function getCurrentUserId(token) {
    try {
        if (!token) {
            return null;
        }

        const payload = token
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        return JSON.parse(atob(payload)).id;
    } catch (error) {
        console.error(
            "Unable to get user ID from token:",
            error
        );

        return null;
    }
}

// =====================================================
// GET USER ROLE FROM JWT
// =====================================================

function getCurrentUserRole(token) {
    try {
        if (!token) {
            return null;
        }

        const parts = token.split(".");

        if (parts.length !== 3) {
            return null;
        }

        const payload = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = JSON.parse(
            atob(payload)
        );

        return decoded.role || null;
    } catch (error) {
        console.error(
            "Unable to get user role from token:",
            error
        );

        return null;
    }
}

// =====================================================
// GET DASHBOARD PAGE FROM ROLE
// =====================================================

function getDashboardPage(role) {
    if (role === "learner") {
        return "learner-dashboard";
    }

    if (role === "mentor") {
        return "mentor-dashboard";
    }

    return "home";
}

const PAGE_PATHS = {
    home: "/",
    login: "/login",
    register: "/register",
    "learner-dashboard": "/dashboard",
    "mentor-dashboard": "/mentor/dashboard",
    admin: "/admin",
    "complete-profile": "/profile/complete",
    profile: "/profile",
    discover: "/discover",
    bookings: "/bookings",
    chat: "/chat"
};

function getPageFromPath(pathname) {
    if (pathname.startsWith("/profile/complete")) return "complete-profile";
    if (pathname.startsWith("/profile/")) return "user-profile";
    if (pathname.startsWith("/booking/")) return "booking";
    if (pathname.startsWith("/chat/")) return "chat";

    return Object.entries(PAGE_PATHS).find(([, path]) => path === pathname)?.[0] || "home";
}

// =====================================================
// APP
// =====================================================

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState(
        localStorage.getItem("Token")
    );
    const page = getPageFromPath(location.pathname);
    const routeId = location.pathname.split("/")[2] || null;

    function navigateTo(nextPage, options = {}) {
        const path = options.path || PAGE_PATHS[nextPage] || PAGE_PATHS.home;
        navigate(path, { replace: options.replace });
    }

    function resetNavigation(nextPage = "home") {
        navigateTo(nextPage, { replace: true });
    }

    function goBack(fallbackPage = "home") {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigateTo(fallbackPage);
    }

    // =====================================================
    // STATE
    // =====================================================

    const [profileStatus, setProfileStatus] =
        useState(null);

    const [viewingUserId, setViewingUserId] =
        useState(null);

    const [bookingMentorId, setBookingMentorId] =
        useState(null);

    const [bookingMentorName, setBookingMentorName] =
        useState("");

    const [chatTargetUserId, setChatTargetUserId] =
        useState(null);

    const [chatReturnPage, setChatReturnPage] =
        useState("home");

    // =====================================================
    // CURRENT USER ROLE
    // =====================================================

    const userRole = getCurrentUserRole(token);

    // =====================================================
    // PROFILE CHECK
    // =====================================================

    useEffect(() => {
        async function checkProfile() {
            if (!token) {
                setProfileStatus(null);
                return;
            }

            const role =
                getCurrentUserRole(token);

            // Admin does not need profile completion
            if (role === "admin") {
                setProfileStatus(true);
                return;
            }

            try {
                const response =
                    await fetch(
                        `${import.meta.env.VITE_API_URL}/profile/me`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (response.status === 401) {
                    localStorage.removeItem(
                        "Token"
                    );

                    localStorage.removeItem(
                        "ProfileSkipped"
                    );

                    setToken(null);
                    setProfileStatus(null);

                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Unable to check profile status"
                    );
                }

                const data =
                    await response.json();

                console.log(
                    "PROFILE CHECK:",
                    data
                );

                const complete =
                    data.profileComplete === true ||
                    hasCompletedDetails(
                        data.profile
                    );

                const skipped =
                    localStorage.getItem(
                        "ProfileSkipped"
                    ) === "true";

                if (complete) {
                    localStorage.removeItem(
                        "ProfileSkipped"
                    );

                    setProfileStatus(true);
                } else if (skipped) {
                    setProfileStatus(
                        "skipped"
                    );
                } else {
                    setProfileStatus(false);
                }
            } catch (error) {
                console.error(
                    "Profile check failed:",
                    error
                );

                setProfileStatus(true);
            }
        }

        checkProfile();
    }, [token]);

    // =====================================================
    // LOGIN
    // =====================================================

    function handleLogin(newToken) {
        localStorage.setItem(
            "Token",
            newToken
        );

        localStorage.removeItem(
            "ProfileSkipped"
        );

        setToken(newToken);

        const role =
            getCurrentUserRole(newToken);

        const dashboardPage =
            getDashboardPage(role);

        resetNavigation(
            dashboardPage
        );

        setChatTargetUserId(null);
    }

    // =====================================================
    // LOGOUT
    // =====================================================

    function handleLogout() {
        localStorage.removeItem(
            "Token"
        );

        localStorage.removeItem(
            "ProfileSkipped"
        );

        setToken(null);

        resetNavigation("home");

        setViewingUserId(null);

        setBookingMentorId(null);

        setBookingMentorName("");

        setChatTargetUserId(null);

        setChatReturnPage("home");

        setProfileStatus(null);
    }

    // =====================================================
    // OPEN NORMAL CHAT
    // =====================================================

    function openNormalChat(
        returnPage = "home"
    ) {
        setChatReturnPage(
            returnPage
        );

        setChatTargetUserId(null);

        navigateTo("chat");
    }

    // =====================================================
    // OPEN SESSION CHAT
    // =====================================================

    function openSessionChat(booking) {
        if (!booking) {
            return;
        }

        const currentUserId =
            getCurrentUserId(token);

        const mentorId =
            booking.mentor?._id ||
            booking.mentor;

        const learnerId =
            booking.learner?._id ||
            booking.learner;

        let otherUserId = null;

        if (
            String(currentUserId) ===
            String(mentorId)
        ) {
            otherUserId = learnerId;
        } else if (
            String(currentUserId) ===
            String(learnerId)
        ) {
            otherUserId = mentorId;
        }

        if (!otherUserId) {
            console.error(
                "Unable to determine session participant",
                booking
            );

            return;
        }

        setChatReturnPage(
            "bookings"
        );

        setChatTargetUserId(
            otherUserId
        );

        navigateTo("chat");
    }

    // =====================================================
    // PUBLIC AUTH SCREENS
    // =====================================================

    if (!token) {
        if (page === "register") {
            return (
                <RegistrationPage
                    onBackHome={() => {
                        navigateTo("home");
                    }}
                    onBackToLogin={() => {
                        navigateTo("login");
                    }}
                    onRegistered={() => {
                        navigateTo("login");
                    }}
                />
            );
        }

        if (page === "login") {
            return (
                <LoginPage
                    onLogin={handleLogin}
                    onCreateAccount={() => {
                        navigateTo("register");
                    }}
                />
            );
        }

        return (
            <HomePage
                publicMode
                onLogin={() =>
                    navigateTo("login")
                }
                onRegister={() =>
                    navigateTo("register")
                }
            />
        );
    }

    // =====================================================
    // ADMIN APPLICATION
    // =====================================================

    if (userRole === "admin") {
        return (
            <AdminPage
                token={token}
                onLogout={handleLogout}
            />
        );
    }

    // =====================================================
    // NORMAL USER PROFILE LOADING
    // =====================================================

    if (profileStatus === null) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                Loading...
            </div>
        );
    }

    // =====================================================
    // NORMAL USER APPLICATION
    // =====================================================

    return (
        <SocketProvider
            key={token}
            token={token}
        >
            {/* =================================================
                COMPLETE PROFILE
            ================================================= */}

            {profileStatus === false ? (
                <CompleteProfile
                    token={token}
                    onComplete={() => {
                        localStorage.removeItem(
                            "ProfileSkipped"
                        );

                        setProfileStatus(true);

                        navigateTo(getDashboardPage(userRole));
                    }}
                    onLater={() => {
                        localStorage.setItem(
                            "ProfileSkipped",
                            "true"
                        );

                        setProfileStatus(
                            "skipped"
                        );

                        navigateTo(getDashboardPage(userRole));
                    }}
                />
            ) : page === "learner-dashboard" ? (

                /* =================================================
                   LEARNER DASHBOARD
                ================================================= */

                <LearnerDashboard
                    token={token}
                    onHome={() =>
                        resetNavigation("home")
                    }
                    onProfile={() => {
                        setViewingUserId(null);

                        navigateTo(
                            "profile"
                        );
                    }}
                    onLogout={
                        handleLogout
                    }
                />

            ) : page === "mentor-dashboard" ? (

                /* =================================================
                   MENTOR DASHBOARD
                ================================================= */

                <MentorDashboard
                    token={token}
                    onHome={() =>
                        resetNavigation("home")
                    }
                    onProfile={() => {
                        setViewingUserId(null);

                        navigateTo(
                            "profile"
                        );
                    }}
                    onLogout={
                        handleLogout
                    }
                />

            ) : page === "home" ? (

                /* =================================================
                   HOME
                ================================================= */

                <HomePage
                    onDiscover={() =>
                        navigateTo(
                            "discover"
                        )
                    }
                    onProfile={() => {
                        setViewingUserId(null);

                        navigateTo(
                            "profile"
                        );
                    }}
                    onMessages={() =>
                        openNormalChat(
                            "home"
                        )
                    }
                />

            ) : page === "discover" ? (

                /* =================================================
                   DISCOVER
                ================================================= */

                <DiscoverPage
                    token={token}
                    onHome={() =>
                        goBack("home")
                    }
                    onProfile={() => {
                        setViewingUserId(null);

                        navigateTo(
                            "profile"
                        );
                    }}
                    onViewProfile={(userId) => {
                        const id =
                            userId?._id ||
                            userId?.id ||
                            userId;

                        if (!id) {
                            return;
                        }

                        setViewingUserId(String(id));
                        navigateTo("user-profile", { path: `/profile/${id}` });
                    }}
                    onMessages={() =>
                        openNormalChat(
                            "discover"
                        )
                    }
                />

            ) : page === "profile" ? (

                /* =================================================
                   PROFILE
                ================================================= */

                <ProfilePage
                    token={token}
                    profileStatus={
                        profileStatus
                    }
                    onHome={() =>
                        goBack("home")
                    }
                    onLogout={
                        handleLogout
                    }
                    onMessagesClick={() =>
                        openNormalChat(
                            "profile"
                        )
                    }
                    onBookings={() =>
                        navigateTo(
                            "bookings"
                        )
                    }
                    onCompleteProfile={() => {
                        localStorage.removeItem(
                            "ProfileSkipped"
                        );

                        setProfileStatus(
                            false
                        );
                    }}
                />

            ) : page === "user-profile" ? (

                /* =================================================
                   OTHER USER PROFILE
                ================================================= */

                <OtherProfilePage
                    token={token}
                    userId={
                        routeId || viewingUserId
                    }
                    onBack={() => navigateTo("discover")}
                    onMessages={() =>
                        openNormalChat(
                            "user-profile"
                        )
                    }
                    onBookSession={(
                        id,
                        name
                    ) => {
                        setBookingMentorId(
                            id
                        );

                        setBookingMentorName(
                            name
                        );

                        navigateTo("booking", { path: `/booking/${id}` });
                    }}
                />

            ) : page === "booking" ? (

                /* =================================================
                   BOOKING
                ================================================= */

                <BookingPage
                    token={token}
                    mentorId={
                        routeId || bookingMentorId
                    }
                    mentorName={
                        bookingMentorName
                    }
                    onBack={() => navigateTo("user-profile", { path: `/profile/${viewingUserId}` })}
                    onBookingCreated={() =>
                        navigateTo(
                            "bookings"
                        )
                    }
                />

            ) : page === "bookings" ? (

                /* =================================================
                   MY BOOKINGS
                ================================================= */

                <MyBookings
                    token={token}
                    onBack={() => navigateTo("profile")}
                    onJoinSession={
                        openSessionChat
                    }
                />

            ) : (

                /* =================================================
                   CHAT
                ================================================= */

                <ChatPage
                    token={token}
                    onLogout={
                        handleLogout
                    }
                    onHome={() =>
                        resetNavigation(
                            "home"
                        )
                    }
                    onBack={() => navigateTo(chatReturnPage || "home")}
                    onProfile={() => {
                        setViewingUserId(null);

                        navigateTo(
                            "profile"
                        );
                    }}
                    onViewProfile={(userId) => {
                        const id =
                            userId?._id ||
                            userId?.id ||
                            userId;

                        if (!id) {
                            return;
                        }

                        setViewingUserId(String(id));
                        navigateTo("user-profile", { path: `/profile/${id}` });
                    }}
                    onBookings={() =>
                        navigateTo(
                            "bookings"
                        )
                    }
                    initialUserId={
                        routeId || chatTargetUserId
                    }
                />
            )}
        </SocketProvider>
    );
}

export default App;
