import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DRHPBuilder from "@/pages/DRHPBuilder";
import SectionEditor from "@/pages/SectionEditor";
import MatchMaker from "@/pages/MatchMaker";
import MatchMakerSearch from "@/pages/MatchMakerSearch";
import ProfessionalProfile from "@/pages/ProfessionalProfile";
import ProfessionalRegister from "@/pages/ProfessionalRegister";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with credentials
const apiClient = axios.create({
  baseURL: API,
  withCredentials: true
});

// Auth Context
export const AuthContext = ({ children }) => {
  return children;
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = hash.split("session_id=")[1]?.split("&")[0];

      if (!sessionId) {
        navigate("/login");
        return;
      }

      try {
        const response = await apiClient.post("/auth/session", {
          session_id: sessionId
        });

        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);

        // Navigate to dashboard with user data
        navigate("/dashboard", { state: { user: response.data.user } });
      } catch (error) {
        console.error("Auth failed:", error);
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Authenticating...</p>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    location.state?.user ? true : null
  );
  const [user, setUser] = useState(location.state?.user || null);

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    checkAuth();
  }, [location.state, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Pass user and apiClient to children
  return children({ user, apiClient });
};

// App Router Component
const AppRouter = () => {
  const location = useLocation();

  // Check for session_id in hash FIRST (synchronous, before useEffect)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login apiClient={apiClient} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <Dashboard user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/drhp-builder/:projectId"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <DRHPBuilder user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/drhp-builder/:projectId/section/:sectionId"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <SectionEditor user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/matchmaker"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <MatchMaker user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/matchmaker/search"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <MatchMakerSearch user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/matchmaker/profile/:professionalId"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <ProfessionalProfile user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/matchmaker/register"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <ProfessionalRegister user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
