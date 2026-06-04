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
  { key: "nav_ai_search", path: "/ai-search" },
  { key: "nav_admin_login", path: "/admin" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCircularsDropdownOpen, setIsCircularsDropdownOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="bg-[#1e40af] text-white sticky top-0 z-50 shadow-md">
      <div className="w-full mx-auto px-4 sm:px-8">
        {/* Desktop Menu */}
        <div className="hidden lg:flex flex-wrap items-center">
          {navKeys.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] hover:text-[#e31837] transition-colors ${
                location.pathname === item.path
                  ? "border-[#e31837] text-white"
                  : "border-transparent text-gray-200"
              }`}
            >
              {t(item.key as any)}
            </Link>
          ))}

          {/* Dropdown for Circulars */}
          <div
            className="relative group"
            onMouseEnter={() => setIsCircularsDropdownOpen(true)}
            onMouseLeave={() => setIsCircularsDropdownOpen(false)}
          >
            <button
              className={`flex items-center px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] hover:text-[#e31837] transition-colors ${
                location.pathname.includes("/dar-circulars") ||
                location.pathname.includes("/act-circulars")
                  ? "border-[#e31837] text-[#e31837]"
                  : "border-transparent text-gray-200"
              }`}
            >
              {t("nav_circulars")} <ChevronDown className="ml-1 w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isCircularsDropdownOpen && (
              <div className="absolute left-0 top-full w-56 bg-[#1e3a8a] text-white shadow-xl rounded-b-md overflow-hidden border border-[#172554] divide-y divide-[#1e40af]">
                <Link
                  to="/dar-circulars"
                  className="block px-4 py-3 text-[18px] font-medium italic hover:bg-[#1e40af] transition-colors group"
                  onClick={() => setIsCircularsDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200 group-hover:text-[#e31837] transition-colors">
                      {t("nav_dar_circulars")}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#fca5a5] block opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                </Link>
                <Link
                  to="/act-circulars"
                  className="block px-4 py-3 text-[18px] font-medium italic hover:bg-[#1e40af] transition-colors group"
                  onClick={() => setIsCircularsDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200 group-hover:text-[#e31837] transition-colors">
                      {t("nav_act_circulars")}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#fca5a5] block opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Dropdown for Important Links */}
          <div
            className="relative group"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button
              className={`flex items-center px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] hover:text-[#e31837] transition-colors ${
                location.pathname.includes("/links") ||
                location.pathname.includes("/internal")
                  ? "border-[#e31837] text-[#e31837]"
                  : "border-transparent text-gray-200"
              }`}
            >
              {t("nav_important_links")} <ChevronDown className="ml-1 w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full w-56 bg-[#1e3a8a] text-white shadow-xl rounded-b-md overflow-hidden border border-[#172554] divide-y divide-[#1e40af]">
                <Link
                  to="/links"
                  className="block px-4 py-3 text-[18px] font-medium italic hover:bg-[#1e40af] transition-colors group"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200 group-hover:text-[#e31837] transition-colors">
                      {t("nav_external_links")}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#fca5a5] block opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                </Link>
                <Link
                  to="/internal-links"
                  className="block px-4 py-3 text-[18px] font-medium italic hover:bg-[#1e40af] transition-colors group"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200 group-hover:text-[#e31837] transition-colors">
                      {t("nav_internal_links")}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#fca5a5] block opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {rightNavKeys.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] hover:text-[#e31837] transition-colors ${
                location.pathname === item.path
                  ? "border-[#e31837] text-white"
                  : "border-transparent text-gray-200"
              }`}
            >
              {t(item.key as any)}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center justify-between py-3">
          <span className="font-semibold italic px-2">{t("nav_menu")}</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:bg-[#1e3a8a] p-2 rounded-md"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[#1e3a8a]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navKeys.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-lg font-semibold italic ${
                  location.pathname === item.path
                    ? "bg-[#e31837] text-white"
                    : "text-gray-200 hover:bg-[#1e40af] hover:text-[#e31837]"
                }`}
              >
                {t(item.key as any)}
              </Link>
            ))}

            {/* Mobile Dropdown for Circulars */}
            <div className="space-y-1">
              <button
                onClick={() =>
                  setIsCircularsDropdownOpen(!isCircularsDropdownOpen)
                }
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-lg font-semibold italic text-gray-200 hover:bg-[#1e40af] hover:text-[#e31837]"
              >
                {t("nav_circulars")}
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${isCircularsDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isCircularsDropdownOpen && (
                <div className="pl-6 space-y-1 bg-[#172554] py-2 rounded-md">
                  <Link
                    to="/dar-circulars"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-[#e31837] tracking-wide"
                  >
                    {t("nav_dar_circulars")}
                  </Link>
                  <Link
                    to="/act-circulars"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-[#e31837] tracking-wide"
                  >
                    {t("nav_act_circulars")}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-lg font-semibold italic text-gray-200 hover:bg-[#1e40af] hover:text-[#e31837]"
              >
                {t("nav_important_links")}
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="pl-6 space-y-1 bg-[#172554] py-2 rounded-md">
                  <Link
                    to="/links"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-[#e31837] tracking-wide"
                  >
                    {t("nav_external_links")}
                  </Link>
                  <Link
                    to="/internal-links"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-[#e31837] tracking-wide"
                  >
                    {t("nav_internal_links")}
                  </Link>
                </div>
              )}
            </div>

            {rightNavKeys.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-lg font-semibold italic ${
                  location.pathname === item.path
                    ? "bg-[#e31837] text-white"
                    : "text-gray-200 hover:bg-[#1e40af] hover:text-[#e31837]"
                }`}
              >
                {t(item.key as any)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
