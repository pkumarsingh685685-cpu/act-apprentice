import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, Key, ArrowRight } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "sonner";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function AdminLogin() {
  const login = useStore((state) => state.login);
  const isAdmin = useStore((state) => state.isAdmin);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState<"LOGIN" | "FORGOT" | "OTP">("LOGIN");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/dashboard");
    }
  }, [isAdmin, navigate]);

  // Clean up reCaptcha on component unmount to prevent invisible element issues
  useEffect(() => {
    return () => {
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          //@ts-ignore
          window.recaptchaVerifier = null;
        }
      } catch (err) {
        console.error("Cleanup error", err);
      }
    };
  }, []);

  if (isAdmin) {
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      login();
      navigate("/admin/dashboard");
    } else {
      setError(t('invalid_credentials'));
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number with country code (e.g., +9199732466).");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setLoading(true);
      console.log("OTP request started");
      console.log("Current Auth API Key:", auth.app.options.apiKey);
      console.log("Current Auth Project ID:", auth.app.options.projectId);

      // Lazily initialize reCAPTCHA
      if (!window.recaptchaVerifier) {
        console.log("Initializing RecaptchaVerifier for the first time...");
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {
            console.log("reCAPTCHA verified");
          },
          'expired-callback': () => {
            setError("reCAPTCHA expired. Please try again.");
          }
        });
      }

      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setStep("OTP");
      console.log("OTP sent successfully");
      toast.success("OTP sent to your phone number.");
    } catch (err: any) {
      console.error("OTP Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Phone Authentication is not enabled in Firebase Console. Please ask admin to enable it.");
      } else if (err.code === 'auth/invalid-phone-number') {
        setError("Invalid phone number format. Please include country code (e.g., +91).");
      } else {
        setError(`OTP failed: ${err.message || 'Error sending OTP'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!confirmationResult) {
      setError("Please request OTP first.");
      setLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(otp);
      login();
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(`Verification failed: ${err.message || 'Invalid OTP'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="bg-[#1c3f60] p-6 text-center text-white">
          <Shield className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h2 className="text-xl font-bold">{t('admin_portal')}</h2>
          <p className="opacity-80 text-sm mt-1">{t('admin_portal_subtitle')}</p>
        </div>

        <div className="p-6">
          <div id="recaptcha-container"></div>
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 font-medium">
              {error}
            </div>
          )}

          {step === "LOGIN" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('username')}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1c3f60]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password')}
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1c3f60]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#1c3f60] border-gray-300 rounded focus:ring-[#1c3f60]"
                  />
                  <span className="font-medium text-gray-700">{t('remember_me')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("FORGOT");
                    setError("");
                  }}
                  className="text-[#1c3f60] hover:text-[#e31837] font-medium"
                >
                  {t('forgot_password_username')}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#e31837] text-white py-2.5 rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {t('login')} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === "FORGOT" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (E.164 format)
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1c3f60] tracking-wider"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+9199732466"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1c3f60] text-white py-2.5 rounded-md font-semibold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Sending..." : t('send_otp')} <Key className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep("LOGIN")}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                {t('back_to_login')}
              </button>
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border mb-2 text-center">
                {t('otp_sent_to')} <strong>{phoneNumber}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('enter_otp')}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e31837] text-center tracking-widest text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e31837] text-white py-2.5 rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Verifying..." : t('verify_login')} <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep("FORGOT")}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-md font-medium hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                {t('resend_otp') || "Try Different Number"}
              </button>
             </form>
          )}
        </div>
      </div>
    </div>
  );
}
