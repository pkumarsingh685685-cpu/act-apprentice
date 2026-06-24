/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "./store/useStore";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { ArrowLeft } from "lucide-react";
import { MaintenancePage } from "./components/MaintenancePage";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import NoticeBoardPage from "./pages/NoticeBoardPage";
import {
  Notifications,
  Merit,
  Results,
  DARCirculars,
  ActCirculars,
} from "./pages/DocumentPages";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import LinksPage from "./pages/LinksPage";
import InternalLinksPage from "./pages/InternalLinksPage";
import CandidateLogin from "./pages/CandidateLogin";
import AiSearchPage from "./pages/AiSearchPage";
import SFGeneratorPage from "./pages/SFGeneratorPage";
import ApoAllotmentPage from "./pages/ApoAllotmentPage";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const isDashboardOrGenerator = location.pathname.includes("/admin-dashboard") || location.pathname.includes("/sf-generator");
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <Navigation />
      <main className="flex-1 flex flex-col w-full relative">
        {!isHome && !isDashboardOrGenerator && (
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-4 -mb-2 flex flex-wrap items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-[#152060] hover:bg-slate-50 font-bold transition-all bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-md hover:shadow-lg active:translate-y-[1px] cursor-pointer text-xs uppercase tracking-wider"
              title="Go back one step"
            >
              <ArrowLeft size={14} className="text-[#e31837]" />
              <span>{t("back") || "Back / पीछे जाएं"}</span>
            </button>

            <button 
              onClick={() => navigate("/")} 
              className="flex items-center gap-2 text-white hover:brightness-115 font-black transition-all bg-gradient-to-r from-indigo-600 to-blue-750 px-4 py-2 rounded-xl shadow-md hover:shadow-lg active:translate-y-[1px] cursor-pointer text-xs uppercase tracking-wider"
              title="Go to Home Screen"
            >
              <span>🏠 {t("home_screen") || "Home Screen / मुख्य वेबसाइट"}</span>
            </button>
          </div>
        )}
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

import { Toaster } from "sonner";
import { FirebaseSync } from "./components/FirebaseSync";
import { SEO } from "./components/SEO";

import i18nInstance from "./i18n";

function LanguageInitializer() {
  const location = useLocation();

  useEffect(() => {
    i18nInstance.changeLanguage("en");
    localStorage.setItem("i18nextLng", "en");
  }, [location.pathname]);

  return null;
}

export default function App() {
  const checkSession = useStore((state) => state.checkSession);
  const config = useStore((state) => state.config);
  const isMaintenanceBypassed = useStore((state) => state.isMaintenanceBypassed);
  const isAdmin = useStore((state) => state.isAdmin);

  useEffect(() => {
    checkSession();
    // Periodically check session
    const interval = setInterval(() => {
      checkSession();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkSession]);

  const isMaintenanceActive = config?.maintenanceMode === "true";
  const shouldShowMaintenance = isMaintenanceActive && !isMaintenanceBypassed && !isAdmin;

  if (shouldShowMaintenance) {
    return (
      <>
        <FirebaseSync />
        <Toaster position="top-right" richColors />
        <MaintenancePage />
      </>
    );
  }

  return (
    <>
      <FirebaseSync />
      <Toaster position="top-right" richColors />
      <Router>
        <LanguageInitializer />
        <SEO />
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/sf-generator" element={<SFGeneratorPage />} />
          <Route path="/apo-allotment" element={<Navigate to="/sf-generator?tab=WORK_ALLOTMENT" replace />} />
          <Route path="/dar-circulars" element={<Navigate to="/sf-generator?tab=OFFICE_ORDERS" replace />} />
          <Route path="/act-circulars" element={<Navigate to="/sf-generator?tab=OFFICE_ORDERS" replace />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/notice-board" element={<NoticeBoardPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/merit" element={<Merit />} />
            <Route path="/results" element={<Results />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/candidate-login" element={<CandidateLogin />} />
            <Route path="/ai-search" element={<AiSearchPage />} />
            <Route path="/links" element={<LinksPage />} />
            <Route path="/internal-links" element={<InternalLinksPage />} />
            <Route path="/admin" element={<AdminLogin />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
