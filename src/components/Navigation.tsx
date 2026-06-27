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
  { key: "nav_pnr_status", path: "/pnr" },
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
          linear-gradient(90deg, #0f2c59 0%, #1c4b82 20%, #2563eb 50%, #1c4b82 80%, #0f2c59 100%)
        `
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
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
        <div className="lg:hidden bg-[#0f2c59]/98 backdrop-blur-md border-t border-white/10 divide-y divide-white/5">
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
