import { useState } from "react";
import { Shield, Lock, ExternalLink } from "lucide-react";
import { useStore } from "../store/useStore";

export default function InternalLinksPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const internalLinks = useStore((state) => state.internalLinks);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  const handleForgotPassword = () => {
    setError("Please contact the system administrator to reset your password.");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex justify-center mt-12 px-4 mb-20 animate-fade-in pb-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md overflow-hidden self-start">
          <div className="bg-[#1c3f60] p-6 text-center text-white">
            <Lock className="w-12 h-12 mx-auto mb-3 text-white" />
            <h2 className="text-xl font-bold">Admin Portal</h2>
            <p className="opacity-80 text-sm mt-1">
              Please enter admin password to view internal links
            </p>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 font-medium text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1c3f60]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#1c3f60] hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-[#e31837] text-white py-2 rounded font-medium hover:bg-red-700 transition shadow-sm"
              >
                Login to Access Links
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-slate-50 py-10 min-h-[500px] animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1c3f60] mb-8 flex items-center gap-2 border-b pb-4">
          <Shield className="text-[#e31837] w-8 h-8" /> Internal Department
          Links
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internalLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-3"
            >
              <div className="bg-blue-50 text-blue-700 p-2 rounded shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">
                  {link.name}
                </h3>
                <p className="text-sm font-mono text-gray-500 mt-2 truncate w-[200px] md:w-[220px]">
                  {link.url}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
