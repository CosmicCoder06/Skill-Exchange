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


function App() {

    const [token, setToken] = useState(
        localStorage.getItem("Token")
    );

    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const [page, setPage] = useState("home");

    const [profileStatus, setProfileStatus] = useState(null);

    // ID of the user whose profile we want to view
    const [viewingUserId, setViewingUserId] = useState(null);


    // =========================
    // CHECK PROFILE
    // =========================

    useEffect(() => {

        async function checkProfile() {

            if (!token) {
                setProfileStatus(null);
                return;
            }

            setProfileStatus(null);

            try {

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/profile/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to check profile status"
                    );
                }

                const data = await response.json();

                setProfileStatus(
                    data.profileComplete === true ||
                    hasCompletedDetails(data.profile)
                );

            } catch (error) {

                console.error(
                    "Profile check failed",
                    error
                );

                setProfileStatus(true);
            }
        }

        checkProfile();

    }, [token]);


    // =========================
    // LOGIN
    // =========================

    function handleLogin(newToken) {

        localStorage.setItem(
            "Token",
            newToken
        );

        setPage("home");
        setToken(newToken);
    }


    // =========================
    // LOGOUT
    // =========================

    function handleLogout() {

        localStorage.removeItem("Token");

        setToken(null);

        setPage("home");

        setViewingUserId(null);
    }


    // =========================
    // PUBLIC PAGES
    // =========================

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

                onLogin={() =>
                    setShowLogin(true)
                }

                onRegister={() =>
                    setShowRegister(true)
                }
            />
        );
    }


    // =========================
    // AUTHENTICATED APP
    // =========================

    return (
        <SocketProvider
            key={token}
            token={token}
        >

            {/* =========================
                COMPLETE PROFILE
            ========================= */}

            {profileStatus === false ? (

                <CompleteProfile

                    token={token}

                    onComplete={() => {
                        setProfileStatus(true);
                        setPage("profile");
                    }}

                    onLater={() => {
                        setProfileStatus("skipped");
                        setPage("profile");
                    }}
                />

            ) : page === "home" ? (

                /* =========================
                   HOME
                ========================= */

                <HomePage

                    onDiscover={() =>
                        setPage("discover")
                    }

                    onProfile={() =>
                        setPage("profile")
                    }

                    onMessages={() =>
                        setPage("chat")
                    }
                />

            ) : page === "discover" ? (

                /* =========================
                   DISCOVER
                ========================= */

                <DiscoverPage

                    token={token}

                    onHome={() =>
                        setPage("home")
                    }

                    onProfile={() =>
                        setPage("profile")
                    }

                    onMessages={() =>
                        setPage("chat")
                    }

                    // Open another user's profile
                    onViewProfile={(userId) => {

                        setViewingUserId(userId);

                        setPage("user-profile");

                    }}
                />

            ) : page === "profile" ? (

                /* =========================
                   MY PROFILE
                ========================= */

                <ProfilePage

                    token={token}

                    profileStatus={profileStatus}

                    onHome={() =>
                        setPage("home")
                    }

                    onLogout={handleLogout}

                    onMessagesClick={() =>
                        setPage("chat")
                    }

                    onCompleteProfile={() =>
                        setProfileStatus(false)
                    }
                />

            ) : page === "user-profile" ? (

                /* =========================
                   OTHER USER PROFILE
                ========================= */

                <OtherProfilePage

                    token={token}

                    userId={viewingUserId}

                    onBack={() =>
                        setPage("discover")
                    }

                    onMessages={() =>
                        setPage("chat")
                    }
                />

            ) : (

                /* =========================
                   CHAT
                ========================= */

                <ChatPage

                    token={token}

                    onLogout={handleLogout}

                    onHome={() =>
                        setPage("home")
                    }

                    onProfile={() =>
                        setPage("profile")
                    }
                />

            )}

        </SocketProvider>
    );
}


export default App;