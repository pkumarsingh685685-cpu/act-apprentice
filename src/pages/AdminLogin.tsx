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
  const [username, setUsername] = useState("9199732466");
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
    if ((username === "9199732466" || username === "admin") && password === "admin123") {
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
        setError("Firebase Error: Phone Auth is NOT enabled in your Firebase Console OR the current Domain is not authorized.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Firebase Error: This app's domain is not added to Firebase 'Authorized domains'.");
      } else if (err.code === 'auth/invalid-phone-number') {
        setError("Invalid phone number format. Please include country code (e.g., +91).");
      } else {
        setError(`OTP failed: ${err.message || String(err)}`);
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
    <div className="flex-1 flex items-center justify-center p-4 bg-[#132039] min-h-screen relative overflow-hidden font-sans">
      {/* Immersive Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40" />

      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-[0_24px_50px_rgba(0,0,0,0.7),0_12px_0_0_#090d16,inset_0_1px_1px_rgba(255,255,255,0.06)] transform transition-transform hover:scale-[1.005] duration-300 overflow-hidden">
        {/* Top 3D Header Bar Group */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900/60 p-6 text-center text-white border-b border-slate-800/80 relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-600 via-amber-400 to-blue-600" />
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-950 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_4px_0_0_#020617] border border-slate-800">
            <Shield className="w-7 h-7 text-red-500 hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-xl font-extrabold uppercase tracking-wider text-white">
            {t('admin_portal') || "Admin Portal"}
          </h2>
          <p className="opacity-75 text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
            {t('admin_portal_subtitle') || "NFR Control Console • उत्तर पूर्व सीमांत रेलवे"}
          </p>
        </div>

        <div className="p-7 space-y-6">
          <div id="recaptcha-container" />
          
          {error && (
            <div className="bg-red-950/40 border border-red-800/60 text-red-400 p-4 rounded-xl text-xs font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
              ⚠️ {error}
            </div>
          )}

          {step === "LOGIN" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  {t('username') || "Username / Phone"}
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 text-white placeholder-slate-600 px-4 py-3 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin ID"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  {t('password') || "Password"}
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 text-white placeholder-slate-600 px-4 py-3 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span className="font-bold text-slate-400 group-hover:text-white transition-colors">{t('remember_me') || "Remember Device"}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("FORGOT");
                    setError("");
                  }}
                  className="text-slate-400 hover:text-red-400 font-bold tracking-wide transition-colors"
                >
                  {t('forgot_password_username') || "Verify Phone?"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:brightness-110 active:translate-y-[3px] active:shadow-none transition-all shadow-[0_5px_0_0_#7f1d1d,0_10px_20px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {t('login') || "Confirm & Enter Server"} <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </form>
          )}

          {step === "FORGOT" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  Phone Number (E.164 format)
                </label>
                <input
                  type="tel"
                  className="w-full bg-slate-950 text-white placeholder-slate-600 px-4 py-3 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium tracking-wider transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+9199732466"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:brightness-110 active:translate-y-[3px] active:shadow-none transition-all shadow-[0_5px_0_0_#312e81,0_10px_20px_rgba(99,102,241,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Transmitting..." : t('send_otp') || "Dispatch OTP Code"} <Key className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={() => setStep("LOGIN")}
                className="w-full bg-slate-800/80 text-slate-300 py-3 rounded-xl font-bold uppercase tracking-wider text-xs border border-slate-700/50 hover:bg-slate-800 active:translate-y-[2px] active:shadow-none transition-all shadow-[0_3px_0_0_#0f172a]"
              >
                {t('back_to_login') || "Cancel & Go Back"}
              </button>
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-xs text-slate-400 bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center leading-relaxed">
                {t('otp_sent_to') || "OTP sent successfully to:"} <strong className="text-emerald-400 font-mono text-sm block mt-1 tracking-wider">{phoneNumber}</strong>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                  {t('enter_otp') || "One-Time-Passcode"}
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-950 text-white placeholder-slate-700 px-4 py-3.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center tracking-[1em] text-xl font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:brightness-110 active:translate-y-[3px] active:shadow-none transition-all shadow-[0_5px_0_0_#064e3b,0_10px_20px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Validating..." : t('verify_login') || "Verify Credentials"} <ArrowRight className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={() => setStep("FORGOT")}
                className="w-full bg-slate-800/80 text-slate-300 py-3 rounded-xl font-bold uppercase tracking-wider text-xs border border-slate-700/50 hover:bg-slate-800 active:translate-y-[2px] active:shadow-none transition-all shadow-[0_3px_0_0_#0f172a]"
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
