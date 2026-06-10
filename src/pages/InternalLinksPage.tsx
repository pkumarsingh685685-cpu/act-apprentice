import React, { useState } from "react";
import { Shield, Lock, ExternalLink, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store/useStore";

export default function InternalLinksPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const externalLinks = useStore((state) => state.externalLinks);
  const internalLinks = useStore((state) => state.internalLinks);
  const { t } = useTranslation();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError(t('internal_links_invalid_password'));
    }
  };

  const handleForgotPassword = () => {
    setError(t('internal_links_contact_admin'));
  };

  return (
    <div className="flex-1 w-full bg-slate-50 py-8 min-h-[500px] animate-fade-in">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#002B6B] mb-8 flex items-center gap-2 border-b-2 border-gray-200 pb-4">
          <Shield className="text-[#1E73BE] w-8 h-8 font-extrabold" />
          <span>{t('nav_important_links')}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 1: Public External Links (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#1E73BE] px-6 py-4 text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-100" />
                <h2 className="text-lg font-bold tracking-wide">{t('nav_external_links')}</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(externalLinks || [])
                    .sort((a, b) => a.order - b.order)
                    .map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-300 group shadow-sm hover:shadow"
                      >
                        <div className="overflow-hidden mr-2">
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-[#002B6B] transition-colors block truncate">
                            {link.name}
                          </span>
                          <span className="text-xs font-mono text-gray-400 block truncate max-w-[200px]">
                            {link.url}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#1E73BE] shrink-0 transition-colors" />
                      </a>
                    ))}
                  {(!externalLinks || externalLinks.length === 0) && (
                    <div className="col-span-full p-8 text-center text-gray-400 font-medium">
                      {t('links_no_configured')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Password-Protected Internal Links (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
              <div className="bg-[#002B6B] px-6 py-4 text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-200" />
                <h2 className="text-lg font-bold tracking-wide">
                  {t('nav_internal_links')}
                </h2>
              </div>

              {!isAuthenticated ? (
                <div className="p-6 flex flex-col justify-center h-full">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                      {t('internal_links_subtitle')}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100 font-medium text-center font-semibold animate-shake">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('password')}
                      </label>
                      <input
                        type="password"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B6B]/40 focus:bg-white transition-all text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('internal_links_password_placeholder')}
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-[#002B6B] hover:underline font-semibold"
                      >
                        {t('forgot_password')}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#1E73BE] hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition shadow-sm text-sm"
                    >
                      {t('internal_links_login')}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-100 mb-6">
                    <Shield className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">Access Granted - Authorized Session</span>
                  </div>

                  <div className="space-y-4">
                    {(internalLinks || []).map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-300 group"
                      >
                        <div className="bg-green-50 text-green-700 p-2 rounded shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-sm text-gray-800 group-hover:text-green-700 transition-colors leading-snug truncate">
                            {link.name}
                          </h3>
                          <p className="text-xs font-mono text-gray-400 mt-1 truncate">
                            {link.url}
                          </p>
                        </div>
                      </a>
                    ))}
                    {(!internalLinks || internalLinks.length === 0) && (
                      <div className="text-center p-8 text-gray-400 font-medium">
                        {t('links_no_configured')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
