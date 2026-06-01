import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
  { name: "Notice Board", path: "/notice-board" },
  { name: "Apprentice Notification", path: "/notifications" },
  { name: "Merit Panel", path: "/merit" },
  { name: "Results", path: "/results" },
];

const rightNavItems = [
  { name: "Contact Us", path: "/contact" },
  { name: "Admin Login", path: "/admin" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCircularsDropdownOpen, setIsCircularsDropdownOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-[#1e40af] text-white sticky top-0 z-50 shadow-md">
      <div className="w-full mx-auto px-4 sm:px-8">
        {/* Desktop Menu */}
        <div className="hidden lg:flex flex-wrap items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] transition-colors ${
                location.pathname === item.path
                  ? "border-[#e31837] text-white"
                  : "border-transparent text-gray-200"
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* Dropdown for Circulars */}
          <div
            className="relative group"
            onMouseEnter={() => setIsCircularsDropdownOpen(true)}
            onMouseLeave={() => setIsCircularsDropdownOpen(false)}
          >
            <button
              className={`flex items-center px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] transition-colors ${
                location.pathname.includes("/dar-circulars") ||
                location.pathname.includes("/act-circulars")
                  ? "border-[#e31837] text-white"
                  : "border-transparent text-gray-200"
              }`}
            >
              Circulars <ChevronDown className="ml-1 w-4 h-4" />
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
                    <span className="text-gray-200 group-hover:text-white">
                      DAR Circulars
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
                    <span className="text-gray-200 group-hover:text-white">
                      Act Apprentice Circulars
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
              className={`flex items-center px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] transition-colors ${
                location.pathname.includes("/links") ||
                location.pathname.includes("/internal")
                  ? "border-[#e31837] text-white"
                  : "border-transparent text-gray-200"
              }`}
            >
              Important Links <ChevronDown className="ml-1 w-4 h-4" />
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
                    <span className="text-gray-200 group-hover:text-white">
                      External Links
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
                    <span className="text-gray-200 group-hover:text-white">
                      Internal Links
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#fca5a5] block opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {rightNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-3 text-[18px] font-semibold italic border-b-2 hover:bg-[#1e3a8a] transition-colors ${
                location.pathname === item.path
                  ? "border-[#e31837] text-white"
                  : "border-transparent text-gray-200"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center justify-between py-3">
          <span className="font-semibold italic px-2">Menu</span>
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
            {[...navItems].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-lg font-semibold italic ${
                  location.pathname === item.path
                    ? "bg-[#e31837] text-white"
                    : "text-gray-200 hover:bg-[#1e40af]"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile Dropdown for Circulars */}
            <div className="space-y-1">
              <button
                onClick={() =>
                  setIsCircularsDropdownOpen(!isCircularsDropdownOpen)
                }
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-lg font-semibold italic text-gray-200 hover:bg-[#1e40af]"
              >
                Circulars
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${isCircularsDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isCircularsDropdownOpen && (
                <div className="pl-6 space-y-1 bg-[#172554] py-2 rounded-md">
                  <Link
                    to="/dar-circulars"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-white"
                  >
                    DAR Circulars
                  </Link>
                  <Link
                    to="/act-circulars"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-white"
                  >
                    Act Apprentice Circulars
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-lg font-semibold italic text-gray-200 hover:bg-[#1e40af]"
              >
                Important Links
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="pl-6 space-y-1 bg-[#172554] py-2 rounded-md">
                  <Link
                    to="/links"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-white"
                  >
                    External Links
                  </Link>
                  <Link
                    to="/internal-links"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold italic text-gray-300 hover:text-white"
                  >
                    Internal Links
                  </Link>
                </div>
              )}
            </div>

            {rightNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-lg font-semibold italic ${
                  location.pathname === item.path
                    ? "bg-[#e31837] text-white"
                    : "text-gray-200 hover:bg-[#1e40af]"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
