/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "./store/useStore";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";

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

function Layout() {
  return (
    <>
      <Header />
      <Navigation />
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

import { Toaster } from "sonner";
import { FirebaseSync } from "./components/FirebaseSync";

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
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/notice-board" element={<NoticeBoardPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/merit" element={<Merit />} />
            <Route path="/results" element={<Results />} />
            <Route path="/dar-circulars" element={<DARCirculars />} />
            <Route path="/act-circulars" element={<ActCirculars />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/links" element={<LinksPage />} />
            <Route path="/internal-links" element={<InternalLinksPage />} />
            <Route path="/admin" element={<AdminLogin />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
