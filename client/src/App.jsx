import { useEffect, useState } from "react";
import "./App.css";
import LoginPage from "./Pages/Login Page/loginPage";
import RegistrationPage from "./Pages/Registration Page/registrationPage";
import ChatPage from "./Pages/ChatPage";
import ProfilePage from "./Pages/Profile Page/ProfilePage";
import CompleteProfile from "./Pages/Profile Page/CompleteProfile";
import HomePage from "./Pages/HomePage";
import DiscoverPage from "./Pages/DiscoverPage";
import AdminDashboard from "./Pages/Admin Page/admin";
import MentorDashboard from "./Pages/Mentor Dashboard/MentorDashboard";
import LearnerDashboard from "./Pages/Learner Dashboard/LearnerDashboard";
import { SocketProvider } from "./context/SocketContext";

const hasCompletedDetails = (profile) => {
  const hasText = (value) =>
    typeof value === "string" && value.trim().length > 0;
  const hasSkill = (skills) => Array.isArray(skills) && skills.some(hasText);
  return (
    hasText(profile?.bio) &&
    hasSkill(profile?.skillsToTeach) &&
    hasSkill(profile?.skillsToLearn)
  );
};

const getTokenRole = (token) => {
  try {
    return JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ).role;
  } catch {
    return null;
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("Token"));
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [page, setPage] = useState("home");
  const [profileStatus, setProfileStatus] = useState(null);
  const isAdmin = getTokenRole(token) === "admin";
  const userRole = getTokenRole(token);

  useEffect(() => {
    async function checkProfile() {
      if (!token || isAdmin) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/profile/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error("Unable to check profile status");
        const data = await response.json();
        // The server flag is the saved source of truth. The details
        // fallback prevents older profiles from being sent back to
        // completion when their fields are already filled in.
        setProfileStatus(
          data.profileComplete === true || hasCompletedDetails(data.profile),
        );
      } catch (error) {
        console.error("Profile check failed", error);
        setProfileStatus(true);
      }
    }
    checkProfile();
  }, [isAdmin, token]);

  function handleLogin(newToken) {
    localStorage.setItem("Token", newToken);
    setProfileStatus(getTokenRole(newToken) === "admin" ? true : null);
    setPage("home");
    setToken(newToken);
  }
  function handleLogout() {
    localStorage.removeItem("Token");
    setProfileStatus(null);
    setPage("home");
    setToken(null);
  }

  if (!token)
    return showRegister ? (
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
    ) : showLogin ? (
      <LoginPage
        onLogin={handleLogin}
        onCreateAccount={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
    ) : (
      <HomePage
        publicMode
        onLogin={() => setShowLogin(true)}
        onRegister={() => setShowRegister(true)}
      />
    );

  return (
    <SocketProvider key={token} token={token}>
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

        <HomePage
          isAdmin={isAdmin}
          userRole={userRole}
          onAdmin={() => setPage("admin")}
          onMentorDashboard={() => setPage("mentor-dashboard")}
          onLearnerDashboard={() => setPage("learner-dashboard")}
          onDiscover={() => setPage("discover")}
          onProfile={() => setPage("profile")}
          onMessages={() => setPage("chat")}
        />

      ) : page === "discover" ? (
        <DiscoverPage
          token={token}
          onHome={() => setPage("home")}
          onProfile={() => setPage("profile")}
          onMessages={() => setPage("chat")}
        />
      ) : page === "admin" && isAdmin ? (
        <AdminDashboard
          token={token}
          onHome={() => setPage("home")}
          onLogout={handleLogout}
        />
      ) : page === "mentor-dashboard" && userRole === "mentor" ? (
        <MentorDashboard
          token={token}
          onHome={() => setPage("home")}
          onProfile={() => setPage("profile")}
          onLogout={handleLogout}
        />
      ) : page === "learner-dashboard" && userRole === "learner" ? (
        <LearnerDashboard
          token={token}
          onHome={() => setPage("home")}
          onProfile={() => setPage("profile")}
          onLogout={handleLogout}
        />
      ) : page === "profile" ? (
        <ProfilePage
          token={token}
          profileStatus={profileStatus}
          onHome={() => setPage("home")}
          onLogout={handleLogout}
          onMessagesClick={() => setPage("chat")}
          onCompleteProfile={() => setProfileStatus(false)}
        />
      ) : (
        <ChatPage
          token={token}
          onLogout={handleLogout}
          onHome={() => setPage("home")}
          onProfile={() => setPage("profile")}
        />
      )}
    </SocketProvider>
  );
}

export default App;
