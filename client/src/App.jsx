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

        return JSON.parse(
            atob(payload)
        ).id;

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
// APP
// =====================================================

function App() {

    const [
        token,
        setToken
    ] = useState(
        localStorage.getItem("Token")
    );


    const [
        showRegister,
        setShowRegister
    ] = useState(false);


    const [
        showLogin,
        setShowLogin
    ] = useState(false);


    const [
        page,
        setPage
    ] = useState("home");


    // =====================================================
    // NAVIGATION HISTORY
    // =====================================================

    const [
        pageHistory,
        setPageHistory
    ] = useState([]);


    function navigateTo(nextPage) {

        if (!nextPage || nextPage === page) {
            return;
        }

        setPageHistory((history) => [
            ...history,
            page
        ]);

        setPage(nextPage);
    }


    function goBack(fallbackPage = "home") {

        if (pageHistory.length === 0) {
            setPage(fallbackPage);
            return;
        }

        const previousPage =
            pageHistory[pageHistory.length - 1];

        setPageHistory((history) =>
            history.slice(0, -1)
        );

        setPage(previousPage);
    }


    function resetNavigation(nextPage = "home") {

        setPageHistory([]);
        setPage(nextPage);
    }


    // =====================================================
    // STATE
    // =====================================================

    const [
        profileStatus,
        setProfileStatus
    ] = useState(null);


    const [
        viewingUserId,
        setViewingUserId
    ] = useState(null);


    const [
        bookingMentorId,
        setBookingMentorId
    ] = useState(null);


    const [
        bookingMentorName,
        setBookingMentorName
    ] = useState("");


    const [
        chatTargetUserId,
        setChatTargetUserId
    ] = useState(null);


    const [
        chatReturnPage,
        setChatReturnPage
    ] = useState("home");


    // =====================================================
    // CURRENT USER ROLE
    // =====================================================

    const userRole = getCurrentUserRole(token);


    // =====================================================
    // PROFILE CHECK
    // IMPORTANT:
    // ADMIN KO PROFILE CHECK NAHI KARNA
    // =====================================================

    useEffect(() => {

        async function checkProfile() {

            // No token
            if (!token) {

                setProfileStatus(null);

                return;
            }


            // Admin does not need normal profile flow
            const role = getCurrentUserRole(token);

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

                    setProfileStatus(
                        false
                    );
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


        setToken(
            newToken
        );


        resetNavigation("home");


        setChatTargetUserId(
            null
        );
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


        setToken(
            null
        );


        resetNavigation("home");


        setViewingUserId(
            null
        );


        setBookingMentorId(
            null
        );


        setBookingMentorName(
            ""
        );


        setChatTargetUserId(
            null
        );


        setChatReturnPage(
            "home"
        );


        setProfileStatus(
            null
        );
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


        setChatTargetUserId(
            null
        );


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

            otherUserId =
                learnerId;

        } else if (
            String(currentUserId) ===
            String(learnerId)
        ) {

            otherUserId =
                mentorId;
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

        if (showRegister) {

            return (

                <RegistrationPage

                    onBackHome={() => {

                        setShowRegister(
                            false
                        );

                        setShowLogin(
                            false
                        );
                    }}


                    onBackToLogin={() => {

                        setShowRegister(
                            false
                        );

                        setShowLogin(
                            true
                        );
                    }}


                    onRegistered={() => {

                        setShowRegister(
                            false
                        );

                        setShowLogin(
                            true
                        );
                    }}

                />
            );
        }


        if (showLogin) {

            return (

                <LoginPage

                    onLogin={
                        handleLogin
                    }


                    onCreateAccount={() => {

                        setShowLogin(
                            false
                        );

                        setShowRegister(
                            true
                        );
                    }}

                />
            );
        }


        return (

            <HomePage
                publicMode

                onLogin={() =>
                    setShowLogin(
                        true
                    )
                }

                onRegister={() =>
                    setShowRegister(
                        true
                    )
                }
            />
        );
    }


    // =====================================================
    // ADMIN APPLICATION
    // =====================================================
    // IMPORTANT:
    // Admin NEVER enters:
    // CompleteProfile
    // HomePage
    // ProfilePage
    // ChatPage
    // MyBookings
    //
    // Admin gets its own dashboard directly.
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

                    token={
                        token
                    }


                    onComplete={() => {

                        localStorage.removeItem(
                            "ProfileSkipped"
                        );


                        setProfileStatus(
                            true
                        );


                        setPage(
                            "profile"
                        );
                    }}


                    onLater={() => {

                        localStorage.setItem(
                            "ProfileSkipped",
                            "true"
                        );


                        setProfileStatus(
                            "skipped"
                        );


                        setPage(
                            "profile"
                        );
                    }}

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

                    token={
                        token
                    }


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


                        setViewingUserId(
                            String(id)
                        );


                        navigateTo(
                            "user-profile"
                        );
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

                    token={
                        token
                    }


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

                    token={
                        token
                    }


                    userId={
                        viewingUserId
                    }


                    onBack={() =>
                        goBack("discover")
                    }


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


                        navigateTo(
                            "booking"
                        );
                    }}

                />

            ) : page === "booking" ? (

                /* =================================================
                   BOOKING
                ================================================= */

                <BookingPage

                    token={
                        token
                    }


                    mentorId={
                        bookingMentorId
                    }


                    mentorName={
                        bookingMentorName
                    }


                    onBack={() =>
                        goBack("user-profile")
                    }


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

                    token={
                        token
                    }


                    onBack={() =>
                        goBack("profile")
                    }


                    onJoinSession={
                        openSessionChat
                    }

                />

            ) : (

                /* =================================================
                   CHAT
                ================================================= */

                <ChatPage

                    token={
                        token
                    }


                    onLogout={
                        handleLogout
                    }


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


                        setViewingUserId(
                            String(id)
                        );


                        navigateTo(
                            "user-profile"
                        );
                    }}


                    onBookings={() =>
                        navigateTo(
                            "bookings"
                        )
                    }


                    initialUserId={
                        chatTargetUserId
                    }

                />

            )}

        </SocketProvider>
    );
}


export default App;