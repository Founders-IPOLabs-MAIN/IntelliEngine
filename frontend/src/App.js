import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DRHPBuilder from "@/pages/DRHPBuilder";
import DRHPLandingPage from "@/pages/DRHPLandingPage";
import DRHPSection from "@/pages/DRHPSection";
import DRHPContent from "@/pages/DRHPContent";
import SectionEditor from "@/pages/SectionEditor";
import CommandCenter from "@/pages/CommandCenter";
import CompanyData from "@/pages/CompanyData";
import PromoterChecklist from "@/pages/PromoterChecklist";
import KMPChecklist from "@/pages/KMPChecklist";
import PreIPOTracker from "@/pages/PreIPOTracker";
import NonDRHPTracker from "@/pages/NonDRHPTracker";
import MatchMaker from "@/pages/MatchMaker";
import MatchMakingLanding from "@/pages/MatchMakingLanding";
import IssuerPage from "@/pages/IssuerPage";
import MatchMakerSearch from "@/pages/MatchMakerSearch";
import ProfessionalProfile from "@/pages/ProfessionalProfile";
import ProfessionalRegister from "@/pages/ProfessionalRegister";
import EditProfile from "@/pages/EditProfile";
import BrowseAllProfessionals from "@/pages/BrowseAllProfessionals";
import LegalDisclaimer from "@/pages/LegalDisclaimer";
import TermsOfUse from "@/pages/TermsOfUse";
import Funding from "@/pages/Funding";
import PreIPOFunding from "@/pages/PreIPOFunding";
import PostIPOFunding from "@/pages/PostIPOFunding";
import FundingPartners from "@/pages/FundingPartners";
import FundingQuiz from "@/pages/FundingQuiz";
import Assessment from "@/pages/Assessment";
import AssessmentWizard from "@/pages/AssessmentWizard";
import AssessmentResults from "@/pages/AssessmentResults";
import AdminCenter from "@/pages/AdminCenter";
import AdminLogin from "@/pages/AdminLogin";
import AccessDenied from "@/pages/AccessDenied";
import AccountDetails from "@/pages/AccountDetails";
import DRHPOutput from "@/pages/DRHPOutput";
import ValuationModule from "@/pages/ValuationModule";
import ValuationWizard from "@/pages/ValuationWizard";
import ValuationResults from "@/pages/ValuationResults";
import ComingSoon from "@/pages/ComingSoon";

// Components
import Footer from "@/components/Footer";

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
const ProtectedRoute = ({ children, showFooter = true }) => {
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

  // Pass user and apiClient to children, with global footer
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children({ user, apiClient })}
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

// Module-gated Route - checks user.module_permissions before rendering
const ModuleRoute = ({ children, requiredModule, showFooter = true }) => {
  return (
    <ProtectedRoute showFooter={showFooter}>
      {({ user, apiClient }) => {
        const perms = user?.module_permissions || {};
        if (!perms[requiredModule]) {
          return <AccessDenied />;
        }
        return children({ user, apiClient });
      }}
    </ProtectedRoute>
  );
};

// Admin Gate - checks existing session first, handles OAuth callback, then shows admin login if needed
const AdminGate = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAdminStatus = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      if (res.data.is_admin) {
        setAdminUser(res.data);
        return true;
      }
    } catch {}
    return false;
  };

  useEffect(() => {
    const init = async () => {
      // Handle OAuth callback on /admin route
      if (location.hash?.includes("session_id=")) {
        const sessionId = location.hash.split("session_id=")[1]?.split("&")[0];
        if (sessionId) {
          try {
            await apiClient.post("/auth/session", { session_id: sessionId });
            window.history.replaceState(null, "", "/admin");
          } catch {}
        }
      }
      await checkAdminStatus();
      setChecking(false);
    };
    init();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={async () => {
          const ok = await checkAdminStatus();
          if (!ok) {
            // Re-check after a brief delay for cookie propagation
            setTimeout(async () => { await checkAdminStatus(); }, 500);
          }
        }}
      />
    );
  }

  return <AdminCenter user={adminUser} apiClient={apiClient} />;
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
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login apiClient={apiClient} />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <Dashboard user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId/command-center"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <CommandCenter user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/company-data"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <CompanyData user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/promoter-checklist"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <PromoterChecklist user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/kmp-checklist"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <KMPChecklist user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/pre-ipo-tracker"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <PreIPOTracker user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/non-drhp-tracker"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <NonDRHPTracker user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/drhp-builder/:projectId"
        element={
          <ModuleRoute requiredModule="drhp">
            {({ user, apiClient }) => <DRHPBuilder user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/drhp"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <DRHPLandingPage user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/drhp-section/:sectionId"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <DRHPSection user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/drhp-content/:sectionId"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <DRHPContent user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/project/:projectId/drhp-content/:sectionId/:subModuleId"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <DRHPContent user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/drhp-builder/:projectId/section/:sectionId"
        element={
          <ModuleRoute requiredModule="drhp">
            {({ user, apiClient }) => <SectionEditor user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <MatchMakingLanding user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker/experts"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <MatchMaker user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker/issuer"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <IssuerPage user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker/search"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <MatchMakerSearch user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker/profile/:professionalId"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <ProfessionalProfile user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker/register"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <ProfessionalRegister user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker/edit-profile"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <EditProfile user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/matchmaker/browse-all"
        element={
          <ModuleRoute requiredModule="matchmaker">
            {({ user, apiClient }) => <BrowseAllProfessionals user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/legal-disclaimer"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <LegalDisclaimer user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/terms-of-use"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <TermsOfUse user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/funding"
        element={
          <ModuleRoute requiredModule="funding">
            {({ user, apiClient }) => <Funding user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/funding/pre-ipo"
        element={
          <ModuleRoute requiredModule="funding">
            {({ user, apiClient }) => <PreIPOFunding user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/funding/post-ipo"
        element={
          <ModuleRoute requiredModule="funding">
            {({ user, apiClient }) => <PostIPOFunding user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/funding/partners"
        element={
          <ModuleRoute requiredModule="funding">
            {({ user, apiClient }) => <FundingPartners user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/funding/quiz"
        element={
          <ModuleRoute requiredModule="funding">
            {({ user, apiClient }) => <FundingQuiz user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/assessment"
        element={
          <ModuleRoute requiredModule="assessment">
            {({ user, apiClient }) => <Assessment user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/assessment/start"
        element={
          <ModuleRoute requiredModule="assessment">
            {({ user, apiClient }) => <AssessmentWizard user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/assessment/results/:assessmentId"
        element={
          <ModuleRoute requiredModule="assessment">
            {({ user, apiClient }) => <AssessmentResults user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/admin"
        element={<AdminGate />}
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <AccountDetails user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId/drhp-output"
        element={
          <ModuleRoute requiredModule="drhp" showFooter={false}>
            {({ user, apiClient }) => <DRHPOutput user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />

      {/* Valuation Module */}
      <Route
        path="/valuation"
        element={
          <ModuleRoute requiredModule="valuation">
            {({ user, apiClient }) => <ValuationModule user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/valuation/:valuationId/wizard"
        element={
          <ModuleRoute requiredModule="valuation" showFooter={false}>
            {({ user, apiClient }) => <ValuationWizard user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />
      <Route
        path="/valuation/:valuationId/results"
        element={
          <ModuleRoute requiredModule="valuation" showFooter={false}>
            {({ user, apiClient }) => <ValuationResults user={user} apiClient={apiClient} />}
          </ModuleRoute>
        }
      />

      {/* Coming Soon pages - redirect targets for restricted modules */}
      <Route
        path="/drhp1"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <ComingSoon user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/funding1"
        element={
          <ProtectedRoute>
            {({ user, apiClient }) => <ComingSoon user={user} apiClient={apiClient} />}
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
