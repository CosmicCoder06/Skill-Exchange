import { useEffect, useState } from "react";
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

function App() {
    const [token, setToken] = useState(localStorage.getItem("Token"));
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [page, setPage] = useState("home");
    const [profileStatus, setProfileStatus] = useState(null);
    const [viewingUserId, setViewingUserId] = useState(null);
    const [bookingMentorId, setBookingMentorId] = useState(null);
    const [bookingMentorName, setBookingMentorName] = useState("");
    const [chatTargetUserId, setChatTargetUserId] = useState(null);

    useEffect(() => {
        async function checkProfile() {
            if (!token) {
                setProfileStatus(null);
                return;
            }

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/profile/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
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
                    throw new Error("Unable to check profile status");
                }

                const data = await response.json();

                console.log("PROFILE CHECK:", data);

                const complete =
                    data.profileComplete === true ||
                    hasCompletedDetails(data.profile);

                const skipped =
                    localStorage.getItem("ProfileSkipped") === "true";

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
                setProfileStatus(true);
            }
        }

        checkProfile();
    }, [token]);

    function handleLogin(newToken) {
        localStorage.setItem("Token", newToken);
        localStorage.removeItem("ProfileSkipped");
        setToken(newToken);
        setPage("home");
        setChatTargetUserId(null);
    }

    function handleLogout() {
        localStorage.removeItem("Token");
        localStorage.removeItem("ProfileSkipped");
        setToken(null);
        setPage("home");
        setViewingUserId(null);
        setBookingMentorId(null);
        setBookingMentorName("");
        setChatTargetUserId(null);
    }

    function openNormalChat() {
        setChatTargetUserId(null);
        setPage("chat");
    }

    function openSessionChat(booking) {
        if (!booking) return;

        const currentUserId = getCurrentUserId(token);
        const mentorId = booking.mentor?._id || booking.mentor;
        const learnerId = booking.learner?._id || booking.learner;

        let otherUserId = null;

        if (String(currentUserId) === String(mentorId)) {
            otherUserId = learnerId;
        } else if (String(currentUserId) === String(learnerId)) {
            otherUserId = mentorId;
        }

        if (!otherUserId) {
            console.error(
                "Unable to determine session participant",
                booking
            );
            return;
        }

        console.log("Opening session chat with:", otherUserId);

        setChatTargetUserId(otherUserId);
        setPage("chat");
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

    return (
        <SocketProvider key={token} token={token}>
            {profileStatus === false ? (
                <CompleteProfile
                    token={token}
                    onComplete={() => {
                        localStorage.removeItem("ProfileSkipped");
                        setProfileStatus(true);
                        setPage("profile");
                    }}
                    onLater={() => {
                        localStorage.setItem("ProfileSkipped", "true");
                        setProfileStatus("skipped");
                        setPage("profile");
                    }}
                />
            ) : page === "home" ? (
                <HomePage
                    onDiscover={() => setPage("discover")}
                    onProfile={() => setPage("profile")}
                    onMessages={openNormalChat}
                />
            ) : page === "discover" ? (
                <DiscoverPage
                    token={token}
                    onHome={() => setPage("home")}
                    onProfile={() => setPage("profile")}
                    onMessages={openNormalChat}
                    onViewProfile={(id) => {
                        setViewingUserId(id);
                        setPage("user-profile");
                    }}
                />
            ) : page === "profile" ? (
                <ProfilePage
                    token={token}
                    profileStatus={profileStatus}
                    onHome={() => setPage("home")}
                    onLogout={handleLogout}
                    onMessagesClick={openNormalChat}
                    onBookings={() => setPage("bookings")}
                    onCompleteProfile={() => {
                        localStorage.removeItem("ProfileSkipped");
                        setProfileStatus(false);
                    }}
                />
            ) : page === "user-profile" ? (
                <OtherProfilePage
                    token={token}
                    userId={viewingUserId}
                    onBack={() => setPage("discover")}
                    onMessages={openNormalChat}
                    onBookSession={(id, name) => {
                        setBookingMentorId(id);
                        setBookingMentorName(name);
                        setPage("booking");
                    }}
                />
            ) : page === "booking" ? (
                <BookingPage
    token={token}
    mentorId={bookingMentorId}
    mentorName={bookingMentorName}
    onBack={() => setPage("user-profile")}
    onBookingCreated={() => setPage("bookings")}
/>
            ) : page === "bookings" ? (
                <MyBookings
                    token={token}
                    onBack={() => setPage("profile")}
                    onJoinSession={openSessionChat}
                />
            ) : (
                <ChatPage
                    token={token}
                    onLogout={handleLogout}
                    onHome={() => setPage("home")}
                    onProfile={() => setPage("profile")}
                    initialUserId={chatTargetUserId}
                />
            )}
        </SocketProvider>
    );
}

export default App;