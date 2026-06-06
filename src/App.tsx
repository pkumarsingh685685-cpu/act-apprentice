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
} from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "./store/useStore";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { ArrowLeft } from "lucide-react";

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

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <Navigation />
      <main className="flex-1 flex flex-col w-full relative">
        {!isHome && (
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-4 -mb-2">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-[#152060] hover:bg-blue-50 font-semibold transition-colors bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm w-fit"
            >
              <ArrowLeft size={16} />
              <span>{t("back")}</span>
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

export default function App() {
  const checkSession = useStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
    // Periodically check session
    const interval = setInterval(() => {
      checkSession();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkSession]);

  return (
    <>
      <FirebaseSync />
      <Toaster position="top-right" richColors />
      <Router>
        <SEO />
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/notice-board" element={<NoticeBoardPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/sf-generator" element={<SFGeneratorPage />} />
            <Route path="/results" element={<Results />} />
            <Route path="/dar-circulars" element={<DARCirculars />} />
            <Route path="/act-circulars" element={<ActCirculars />} />
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
