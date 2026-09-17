import { useEffect, useState } from "react";
import "./App.css";
import TopNavigation from "./Components/TopNavigation";
import AccountManagement from "./Pages/AccountManagement";

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

import AdminPage from "./Pages/Admin Page/admin";

import LearnerDashboard from "./Pages/Learner Dashboard/LearnerDashboard";
import MentorDashboard from "./Pages/Mentor Dashboard/MentorDashboard";

import { SocketProvider } from "./context/SocketContext";

const hasCompletedDetails = (profile) => {
    const hasText = (value) =>
        typeof value === "string" && value.trim().length > 0;

    const hasSkill = (skills) =>
        Array.isArray(skills) && skills.some(hasText);

    return (
        hasText(profile?.bio) &&
        hasSkill(profile?.skillsToTeach) &&
        hasSkill(profile?.skillsToLearn)
    );
};

function getCurrentUserId(token) {
    try {
        if (!token) return null;

        const payload = token
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        return JSON.parse(atob(payload)).id;
    } catch (error) {
        console.error("Unable to get user ID from token:", error);
        return null;
    }
}

function getCurrentUserRole(token) {
    try {
        if (!token) return null;

        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const payload = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = JSON.parse(atob(payload));

        return decoded.role || null;
    } catch (error) {
        console.error("Unable to get user role from token:", error);
        return null;
    }
}

function getPathFromState({ page, viewingUserId, bookingMentorId, chatTargetUserId, showLogin, showRegister, token }) {
    if (!token) {
        if (showRegister) return "/register";
        if (showLogin) return "/login";
        return "/";
    }
    switch (page) {
        case "discover":
            return "/discover";
        case "mentor-dashboard":
            return "/mentor-dashboard";
        case "learner-dashboard":
            return "/learner-dashboard";
        case "profile":
            return "/profile";
        case "account":
            return "/account";
        case "user-profile":
            return viewingUserId ? `/profile/${viewingUserId}` : "/discover";
        case "booking":
            return bookingMentorId ? `/booking/${bookingMentorId}` : "/discover";
        case "bookings":
            return "/bookings";
        case "chat":
            return chatTargetUserId ? `/chat/${chatTargetUserId}` : "/chat";
        case "home":
        default:
            return "/";
    }
}

function parseLocation(pathname, role) {
    const clean = pathname.replace(/\/+$/, "") || "/";
    if (clean === "/login") return { page: "home", showLogin: true, showRegister: false };
    if (clean === "/register") return { page: "home", showLogin: false, showRegister: true };
    if (clean === "/" || clean === "/home") return { page: "home", showLogin: false, showRegister: false };
    if (clean === "/discover") return { page: "discover" };
    if (clean === "/dashboard") {
        return { page: String(role).toLowerCase() === "mentor" ? "mentor-dashboard" : "learner-dashboard" };
    }
    if (clean === "/mentor-dashboard") return { page: "mentor-dashboard" };
    if (clean === "/learner-dashboard") return { page: "learner-dashboard" };
    if (clean === "/profile") return { page: "profile", viewingUserId: null };
    if (clean.startsWith("/profile/") || clean.startsWith("/user/")) {
        const id = clean.split("/")[2];
        return { page: "user-profile", viewingUserId: id || null };
    }
    if (clean.startsWith("/booking/")) {
        const id = clean.split("/")[2];
        return { page: "booking", bookingMentorId: id || null };
    }
    if (clean === "/booking") return { page: "booking" };
    if (clean === "/bookings" || clean === "/my-bookings") return { page: "bookings" };
    if (clean.startsWith("/chat/") || clean.startsWith("/messages/")) {
        const id = clean.split("/")[2];
        return { page: "chat", chatTargetUserId: id || null };
    }
    if (clean === "/chat" || clean === "/messages") return { page: "chat" };
    if (clean === "/account") return { page: "account" };
    return { page: "home" };
}

function App() {
    const initialToken = localStorage.getItem("Token");
    const initialRole = getCurrentUserRole(initialToken);
    const initialRoute = parseLocation(window.location.pathname, initialRole);

    const [token, setToken] = useState(initialToken);
    const [showRegister, setShowRegister] = useState(initialRoute.showRegister || false);
    const [showLogin, setShowLogin] = useState(initialRoute.showLogin || false);
    const [page, setPage] = useState(initialRoute.page || "home");
    const [pageHistory, setPageHistory] = useState([]);

    const [profileStatus, setProfileStatus] = useState(null);
    const [viewingUserId, setViewingUserId] = useState(initialRoute.viewingUserId || null);
    const [bookingMentorId, setBookingMentorId] = useState(initialRoute.bookingMentorId || null);
    const [bookingMentorName, setBookingMentorName] = useState("");
    const [chatTargetUserId, setChatTargetUserId] = useState(initialRoute.chatTargetUserId || null);
    const [chatReturnPage, setChatReturnPage] = useState("home");
    const [globalModal, setGlobalModal] = useState(null);

    useEffect(() => {
        const originalAlert = window.alert;
        window.alert = (msg) => {
            const text = typeof msg === "string" ? msg : JSON.stringify(msg);
            setGlobalModal({ message: text });
        };
        return () => {
            window.alert = originalAlert;
        };
    }, []);

    const userRole = getCurrentUserRole(token);

    // Sync URL when app navigation state changes
    useEffect(() => {
        const targetPath = getPathFromState({
            page,
            viewingUserId,
            bookingMentorId,
            chatTargetUserId,
            showLogin,
            showRegister,
            token
        });

        if (window.location.pathname !== targetPath) {
            window.history.pushState(
                { page, viewingUserId, bookingMentorId, chatTargetUserId },
                "",
                targetPath
            );
        }
    }, [page, viewingUserId, bookingMentorId, chatTargetUserId, showLogin, showRegister, token]);

    // Handle browser address bar Back/Forward or manual location changes
    useEffect(() => {
        function handlePopState() {
            const route = parseLocation(window.location.pathname, getCurrentUserRole(token));
            setPage(route.page);
            if (route.viewingUserId !== undefined) setViewingUserId(route.viewingUserId);
            if (route.bookingMentorId !== undefined) setBookingMentorId(route.bookingMentorId);
            if (route.chatTargetUserId !== undefined) setChatTargetUserId(route.chatTargetUserId);
            if (route.showLogin !== undefined) setShowLogin(route.showLogin);
            if (route.showRegister !== undefined) setShowRegister(route.showRegister);
        }

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [token]);

    function navigateTo(nextPage) {
        if (!nextPage || nextPage === page) return;

        setPageHistory((history) => [...history, page]);
        setPage(nextPage);
    }

    function goBack(fallbackPage = "home") {
        if (pageHistory.length === 0) {
            setPage(fallbackPage);
            return;
        }

        const previousPage =
            pageHistory[pageHistory.length - 1];

        setPageHistory((history) => history.slice(0, -1));
        setPage(previousPage);
    }

    function resetNavigation(nextPage = "home") {
        setPageHistory([]);
        setPage(nextPage);
    }

    function dashboardPageForRole(role = userRole) {
        return String(role).toLowerCase() === "mentor"
            ? "mentor-dashboard"
            : "learner-dashboard";
    }

    useEffect(() => {
        async function checkProfile() {
            if (!token) {
                setProfileStatus(null);
                return;
            }

            const role = getCurrentUserRole(token);

            if (role === "admin") {
                setProfileStatus(true);
                return;
            }

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/profile/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 401) {
                    localStorage.removeItem("Token");
                    localStorage.removeItem("ProfileSkipped");

                    setToken(null);
                    setProfileStatus(null);
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Unable to check profile status"
                    );
                }

                const data = await response.json();

                const complete =
                    data.profileComplete === true ||
                    hasCompletedDetails(data.profile);

                const skipped =
                    localStorage.getItem("ProfileSkipped") ===
                    "true";

                if (complete) {
                    localStorage.removeItem("ProfileSkipped");
                    setProfileStatus(true);
                } else if (skipped) {
                    setProfileStatus("skipped");
                } else {
                    setProfileStatus(false);
                }
            } catch (error) {
                console.error("Profile check failed:", error);

                // Keep the existing safe behavior:
                // if the profile-status request itself fails,
                // do not block the application.
                setProfileStatus(true);
            }
        }

        checkProfile();
    }, [token]);

    function handleLogin(newToken) {
        localStorage.setItem("Token", newToken);
        localStorage.removeItem("ProfileSkipped");

        setShowLogin(false);
        setShowRegister(false);
        setToken(newToken);

        // Profile completion check decides whether the user
        // sees CompleteProfile or the dashboard.
        resetNavigation(
            dashboardPageForRole(getCurrentUserRole(newToken))
        );

        setChatTargetUserId(null);
    }

    function handleLogout() {
        localStorage.removeItem("Token");
        localStorage.removeItem("ProfileSkipped");

        setShowLogin(false);
        setShowRegister(false);
        setToken(null);
        resetNavigation("home");

        setViewingUserId(null);
        setBookingMentorId(null);
        setBookingMentorName("");
        setChatTargetUserId(null);
        setChatReturnPage("home");
        setProfileStatus(null);
    }

    function openNormalChat(returnPage = "home") {
        setChatReturnPage(returnPage);
        setChatTargetUserId(null);
        navigateTo("chat");
    }

    function openSessionChat(booking) {
        if (!booking) return;

        const currentUserId = getCurrentUserId(token);

        const mentorId =
            booking.mentor?._id || booking.mentor;

        const learnerId =
            booking.learner?._id || booking.learner;

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

        setChatReturnPage("bookings");
        setChatTargetUserId(otherUserId);
        navigateTo("chat");
    }

    if (!token) {
        if (showRegister) {
            return (
                <RegistrationPage
                    onBackHome={() => {
                        setShowRegister(false);
                        setShowLogin(false);
                    }}
                    onBackToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    onRegistered={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                />
            );
        }

        if (showLogin) {
            return (
                <LoginPage
                    onLogin={handleLogin}
                    onCreateAccount={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                />
            );
        }

        return (
            <HomePage
                publicMode
                onLogin={() => setShowLogin(true)}
                onRegister={() => setShowRegister(true)}
            />
        );
    }

    if (userRole === "admin") {
        return (
            <AdminPage
                token={token}
                onLogout={handleLogout}
            />
        );
    }

    if (profileStatus === null) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                Loading...
            </div>
        );
    }

    return (
        <SocketProvider key={token} token={token}>
            <div className="app-premium-shell">
            <TopNavigation activePage={page} token={token}
                onHome={() => navigateTo('home')} onDiscover={() => navigateTo('discover')}
                onMessages={() => openNormalChat(page)} onBookings={() => navigateTo('bookings')}
                onProfile={() => navigateTo('profile')} onDashboard={() => navigateTo(dashboardPageForRole())}
                onAccount={() => navigateTo('account')} onLogout={handleLogout}
                onSelectMentor={mentor => { setBookingMentorId(mentor.id); setBookingMentorName(mentor.name); navigateTo('booking'); }} />
            {profileStatus === false ? (
                <CompleteProfile
                    token={token}
                    onComplete={() => {
                        localStorage.removeItem(
                            "ProfileSkipped"
                        );

                        setProfileStatus(true);

                        resetNavigation(
                            dashboardPageForRole()
                        );
                    }}
                    onLater={() => {
                        localStorage.setItem(
                            "ProfileSkipped",
                            "true"
                        );

                        setProfileStatus("skipped");

                        resetNavigation(
                            dashboardPageForRole()
                        );
                    }}
                />
            ) : page === "home" ? (
                <HomePage
                    onDiscover={() =>
                        navigateTo("discover")
                    }
                    onProfile={() => {
                        setViewingUserId(null);
                        navigateTo("profile");
                    }}
                    onMessages={() =>
                        openNormalChat("home")
                    }
                />
            ) : page === "discover" ? (
                <DiscoverPage
                    token={token}
                    onHome={() => goBack("home")}
                    onProfile={() => {
                        setViewingUserId(null);
                        navigateTo("profile");
                    }}
                    onViewProfile={(userId) => {
                        const id =
                            userId?._id ||
                            userId?.id ||
                            userId;

                        if (!id) return;

                        setViewingUserId(String(id));
                        navigateTo("user-profile");
                    }}
                    onMessages={() =>
                        openNormalChat("discover")
                    }
                />
            ) : page === "learner-dashboard" ? (
                <LearnerDashboard
                    token={token}
                    onHome={() =>
                        resetNavigation("home")
                    }
                    onProfile={() => {
                        setViewingUserId(null);
                        navigateTo("profile");
                    }}
                    onBookings={() =>
                        navigateTo("bookings")
                    }
                    onLogout={handleLogout}
                />
            ) : page === "mentor-dashboard" ? (
                <MentorDashboard
                    token={token}
                    onHome={() =>
                        resetNavigation("home")
                    }
                    onBookings={() =>
                        navigateTo("bookings")
                    }
                    onProfile={() => {
                        setViewingUserId(null);
                        navigateTo("profile");
                    }}
                    onLogout={handleLogout}
                />
            ) : page === "profile" ? (
                <ProfilePage
                    token={token}
                    profileStatus={profileStatus}
                    onHome={() => goBack("home")}
                    onDashboard={() =>
                        navigateTo(
                            dashboardPageForRole()
                        )
                    }
                    onLogout={handleLogout}
                    onMessagesClick={() =>
                        openNormalChat("profile")
                    }
                    onBookings={() =>
                        navigateTo("bookings")
                    }
                    onCompleteProfile={() => {
                        localStorage.removeItem(
                            "ProfileSkipped"
                        );

                        setProfileStatus(false);
                    }}
                />
            ) : page === "account" ? (
                <AccountManagement token={token} onLogout={handleLogout} />
            ) : page === "user-profile" ? (
                <OtherProfilePage
                    token={token}
                    userId={viewingUserId}
                    onBack={() =>
                        goBack("discover")
                    }
                    onMessages={() =>
                        openNormalChat(
                            "user-profile"
                        )
                    }
                    onBookSession={(id, name) => {
                        setBookingMentorId(id);
                        setBookingMentorName(name);
                        navigateTo("booking");
                    }}
                />
            ) : page === "booking" ? (
                <BookingPage key={bookingMentorId}
                    token={token}
                    mentorId={bookingMentorId}
                    mentorName={bookingMentorName}
                    onBack={() =>
                        goBack("user-profile")
                    }
                    onBookingCreated={() =>
                        navigateTo("bookings")
                    }
                />
            ) : page === "bookings" ? (
                <MyBookings
                    token={token}
                    onBack={() =>
                        goBack("profile")
                    }
                    onJoinSession={
                        openSessionChat
                    }
                />
            ) : (
                <ChatPage
                    token={token}
                    onLogout={handleLogout}
                    onHome={() =>
                        resetNavigation("home")
                    }
                    onBack={() =>
                        goBack(
                            chatReturnPage ||
                                "home"
                        )
                    }
                    onProfile={() => {
                        setViewingUserId(null);
                        navigateTo("profile");
                    }}
                    onViewProfile={(userId) => {
                        const id =
                            userId?._id ||
                            userId?.id ||
                            userId;

                        if (!id) return;

                        setViewingUserId(String(id));
                        navigateTo("user-profile");
                    }}
                    onBookings={() =>
                        navigateTo("bookings")
                    }
                    initialUserId={
                        chatTargetUserId
                    }
                />
            )}
            </div>

            {globalModal && (
                <div
                    className="se-modal-backdrop"
                    onClick={() => setGlobalModal(null)}
                >
                    <div
                        className="se-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="se-modal-header">
                            <div className="se-modal-title">
                                <span className="se-modal-icon">✦</span>
                                <h3>Notice</h3>
                            </div>
                            <button
                                type="button"
                                className="se-modal-close"
                                onClick={() => setGlobalModal(null)}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="se-modal-body">
                            <p>{globalModal.message}</p>
                        </div>
                        <div className="se-modal-footer">
                            <button
                                type="button"
                                className="se-modal-btn"
                                onClick={() => setGlobalModal(null)}
                            >
                                Okay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SocketProvider>
    );
}

export default App;
