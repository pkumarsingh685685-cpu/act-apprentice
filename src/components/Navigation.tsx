import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const navKeys = [
  { key: "nav_home", path: "/" },
  { key: "nav_about", path: "/about" },
  { key: "nav_notice_board", path: "/notice-board" },
  { key: "nav_apprentice_notification", path: "/notifications" },
  { key: "nav_merit_panel", path: "/merit" },
  { key: "nav_results", path: "/results" },
];

const rightNavKeys = [
  { key: "nav_contact_us", path: "/contact" },
  { key: "nav_admin_login", path: "/admin" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCircularsDropdownOpen, setIsCircularsDropdownOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav 
      className="text-white sticky top-0 z-50 shadow-2xl w-full border-b border-white/10"
      style={{
        background: `
          radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 80%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 50.1%, transparent 100%),
          linear-gradient(90deg, #001A4D 0%, #002B6B 20%, #1E73BE 50%, #002B6B 80%, #001A4D 100%)
        `
      }}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center justify-center w-full h-full gap-x-1 xl:gap-x-1.5 2xl:gap-x-2">
          {navKeys.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center h-20 px-1.5 xl:px-2.5 2xl:px-3.5 text-[11px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-[3px] select-none ${
                  isActive
                    ? "border-white text-white bg-white/5"
                    : "border-transparent text-white/95 hover:text-white hover:bg-white/10"
                }`}
              >
                {t(item.key as any)}
              </Link>
            );
          })}

          {/* Dropdown for Circulars */}
          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setIsCircularsDropdownOpen(true)}
            onMouseLeave={() => setIsCircularsDropdownOpen(false)}
          >
            <button
              className={`flex items-center h-20 px-1.5 xl:px-2.5 2xl:px-3.5 text-[11px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-[3px] select-none ${
                location.pathname.includes("/dar-circulars") ||
                location.pathname.includes("/act-circulars")
                  ? "border-white text-white bg-white/5"
                  : "border-transparent text-white/95 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{t("nav_circulars")}</span>
              <ChevronDown className="ml-1 w-3.5 h-3.5 shrink-0 opacity-80" />
            </button>

            {/* Dropdown Menu */}
            {isCircularsDropdownOpen && (
              <div className="absolute left-0 top-20 w-64 bg-[#001A4D]/95 backdrop-blur-md text-white shadow-2xl overflow-hidden border-t-2 border-white/25 border-x border-b border-[#1E73BE]/50 divide-y divide-[#002B6B] z-[60] rounded-b-lg">
                <Link
                  to="/dar-circulars"
                  className="block px-5 py-3.5 text-[13px] font-bold uppercase tracking-wide hover:bg-[#1E73BE] hover:text-white transition-all group"
                  onClick={() => setIsCircularsDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-100 group-hover:text-white transition-colors">
                      {t("nav_dar_circulars")}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 block opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                </Link>
                <Link
                  to="/act-circulars"
                  className="block px-5 py-3.5 text-[13px] font-bold uppercase tracking-wide hover:bg-[#1E73BE] hover:text-white transition-all group"
                  onClick={() => setIsCircularsDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-100 group-hover:text-white transition-colors">
                      {t("nav_act_circulars")}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 block opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Direct Link for Important Links */}
          <Link
            to="/links"
            className={`flex items-center h-20 px-1.5 xl:px-2.5 2xl:px-3.5 text-[11px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-[3px] select-none ${
              location.pathname === "/links"
                ? "border-white text-white bg-white/5"
                : "border-transparent text-white/95 hover:text-white hover:bg-white/10"
            }`}
          >
            {t("nav_important_links")}
          </Link>

          {rightNavKeys.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center h-20 px-1.5 xl:px-2.5 2xl:px-3.5 text-[11px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-[3px] select-none ${
                  isActive
                    ? "border-white text-white bg-white/5"
                    : "border-transparent text-white/95 hover:text-white hover:bg-white/10"
                }`}
              >
                {t(item.key as any)}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button Banner */}
        <div className="lg:hidden flex items-center justify-between w-full h-16">
          <span className="font-bold text-[16px] uppercase tracking-widest text-white/90">
            {t("nav_menu")}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:bg-white/10 p-2 rounded-md focus:outline-none transition-colors border border-white/15"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-[#001A4D]/98 backdrop-blur-md border-t border-white/10 divide-y divide-white/5">
          <div className="px-3 py-3 space-y-1">
            {navKeys.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-[14px] font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-[#1E73BE] text-white shadow-md font-extrabold"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {t(item.key as any)}
                </Link>
              );
            })}

            {/* Mobile Dropdown for Circulars */}
            <div className="space-y-1">
              <button
                onClick={() =>
                  setIsCircularsDropdownOpen(!isCircularsDropdownOpen)
                }
                className="w-full text-left flex items-center justify-between px-4 py-3 rounded-lg text-[14px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/5 hover:text-white focus:outline-none"
              >
                <span>{t("nav_circulars")}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isCircularsDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isCircularsDropdownOpen && (
                <div className="pl-4 space-y-1 bg-[#002B6B]/60 py-2 rounded-lg">
                  <Link
                    to="/dar-circulars"
                    onClick={() => {
                      setIsOpen(false);
                      setIsCircularsDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-white/90 hover:bg-[#1E73BE] hover:text-white rounded-md transition-colors"
                  >
                    {t("nav_dar_circulars")}
                  </Link>
                  <Link
                    to="/act-circulars"
                    onClick={() => {
                      setIsOpen(false);
                      setIsCircularsDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-white/90 hover:bg-[#1E73BE] hover:text-white rounded-md transition-colors"
                  >
                    {t("nav_act_circulars")}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Link for Important Links */}
            <Link
              to="/links"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg text-[14px] font-bold uppercase tracking-wider transition-all ${
                location.pathname === "/links"
                  ? "bg-[#1E73BE] text-white shadow-md font-extrabold"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t("nav_important_links")}
            </Link>

            {rightNavKeys.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-[14px] font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-[#1E73BE] text-white shadow-md font-extrabold"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {t(item.key as any)}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
