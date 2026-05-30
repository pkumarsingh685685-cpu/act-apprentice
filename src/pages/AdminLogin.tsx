import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { Shield, Key, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const login = useStore((state) => state.login);
  const isAdmin = useStore((state) => state.isAdmin);
  const navigate = useNavigate();

  const [step, setStep] = useState<"LOGIN" | "FORGOT" | "OTP">("LOGIN");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/dashboard");
    }
  }, [isAdmin, navigate]);

  if (isAdmin) {
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      login();
      navigate("/admin/dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("OTP");
    setError("");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === "1234") {
      login();
      navigate("/admin/dashboard");
    } else {
      setError("Invalid OTP (hint: use 1234)");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="bg-[#1c3f60] p-6 text-center text-white">
          <Shield className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h2 className="text-xl font-bold">Admin Portal</h2>
          <p className="opacity-80 text-sm mt-1">Authorized personnel only</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 font-medium">
              {error}
            </div>
          )}

          {step === "LOGIN" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
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
                  Password
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
                  <span className="font-medium text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("FORGOT");
                    setError("");
                  }}
                  className="text-[#1c3f60] hover:text-[#e31837] font-medium"
                >
                  Forgot Password/Username?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#e31837] text-white py-2.5 rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                Login <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === "FORGOT" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                OTP will be sent to registered mobile:{" "}
                <strong>+91 9199732466</strong>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1c3f60] text-white py-2.5 rounded-md font-semibold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
              >
                Send OTP <Key className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep("LOGIN")}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e31837] text-center tracking-widest text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#e31837] text-white py-2.5 rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                Verify & Login <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep("FORGOT")}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                Resend OTP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
