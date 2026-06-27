import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Search, Train, Calendar, MapPin, Users, Ticket, AlertCircle, Info, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Passenger {
  passengerNo: number;
  bookingStatus: string;
  currentStatus: string;
  coach: string;
  berth: number;
  berthCode: string;
}

interface PnrData {
  pnr: string;
  trainNumber: string;
  trainName: string;
  dateOfJourney: string;
  fromStation: string;
  toStation: string;
  boardingStation: string;
  reservationUpto: string;
  class: string;
  chartStatus: string;
  passengers: Passenger[];
  simulated?: boolean;
  apiError?: string;
}

export default function PnrStatus() {
  const { t } = useTranslation();
  const [pnrNumber, setPnrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PnrData | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const cleanPnr = pnrNumber.trim().replace(/\D/g, "");
    if (cleanPnr.length !== 10) {
      setError(t("pnr_length_error") || "Please enter a valid 10-digit numeric PNR number.");
      toast.error(t("pnr_length_error") || "Please enter a valid 10-digit numeric PNR number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/railway/pnr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pnr: cleanPnr })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch PNR status.");
      }

      setResult(data.data);
      toast.success("PNR Status retrieved successfully.");
    } catch (err: any) {
      console.error("PNR Search Error:", err);
      setError(err.message || "An unexpected error occurred while checking PNR status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if all passengers are confirmed
  const getOverallStatus = (pnrData: PnrData) => {
    const statuses = pnrData.passengers.map(p => p.currentStatus.toUpperCase());
    const allCnf = statuses.every(s => s.includes("CNF") || s.includes("CONFIRM"));
    const anyRac = statuses.some(s => s.includes("RAC"));
    const allWl = statuses.every(s => s.includes("WL") || s.includes("W/L"));

    if (allCnf) return { label: "CONFIRMED (CNF)", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 };
    if (anyRac) return { label: "RESERVATION AGAINST CANCELLATION (RAC)", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: Clock };
    if (allWl) return { label: "WAITLISTED (WL)", color: "bg-rose-500/10 text-rose-400 border-rose-500/30", icon: ShieldAlert };
    return { label: "PARTIALLY CONFIRMED", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Info };
  };

  const statusMeta = result ? getOverallStatus(result) : null;
  const StatusIcon = statusMeta ? statusMeta.icon : Info;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header section with display typography */}
      <div className="text-center mb-8 md:mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider mb-4"
        >
          <Ticket size={14} />
          {t("pnr_online_check") || "N.F. Railway Service"}
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight"
        >
          {t("nav_pnr_status") || "PNR Status Check"}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 text-sm md:text-base text-gray-500 max-w-2xl mx-auto"
        >
          {t("pnr_subtitle") || "Enter your 10-digit Indian Railways PNR number to fetch real-time seat allocation, coach info, and chart status."}
        </motion.p>
      </div>

      {/* Input / Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-8"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="pnr-input" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {t("pnr_input_label") || "Enter PNR Number (10 Digits)"}
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Ticket size={18} />
              </div>
              <input
                id="pnr-input"
                type="text"
                pattern="[0-9]*"
                maxLength={10}
                value={pnrNumber}
                onChange={(e) => setPnrNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 6461250996"
                className="block w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-gray-250 rounded-xl text-slate-800 text-sm font-semibold tracking-widest placeholder:tracking-normal focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white py-3.5 px-6 rounded-xl text-sm font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t("pnr_searching") || "Checking Status..."}</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>{t("pnr_btn_check") || "Check PNR Status"}</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Disclaimer for simulation */}
            {result.simulated && (
              <div className="max-w-4xl mx-auto space-y-3">
                <div className="flex items-start gap-3 bg-amber-50 text-amber-800 border border-amber-200 p-5 rounded-xl text-xs md:text-sm shadow-sm">
                  <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm text-amber-900">⚠️ Demo/Simulation Mode Active (RapidAPI key returned 403)</span>
                    <p className="mt-1 text-amber-800/90 leading-relaxed">
                      Your RapidAPI key is <strong>not subscribed</strong> to the <em>IRCTC Indian Railway PNR Status</em> API, or the subscription is inactive. Because of this, the system is automatically showing simulated realistic data so the application doesn't crash.
                    </p>
                    {result.apiError && (
                      <p className="mt-2.5 bg-amber-100/50 p-2.5 rounded border border-amber-200 text-xs font-mono text-amber-900">
                        <strong>Raw API Error Details:</strong> {result.apiError}
                      </p>
                    )}
                    <div className="mt-4 bg-white p-4 rounded-xl border border-amber-200 text-xs space-y-2 text-slate-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      <p className="font-bold text-slate-800">How to get correct/real-time live status:</p>
                      <ol className="list-decimal pl-4 space-y-1.5">
                        <li>Log in to your <strong>RapidAPI</strong> account.</li>
                        <li>Search for <strong>"irctc-indian-railway-pnr-status"</strong> (Indian Railway PNR Status) API.</li>
                        <li>Click on the <strong>"Pricing"</strong> tab and subscribe to their plan (there is a free tier available for testing).</li>
                        <li>Once subscribed, make sure you configure your <code>RAPIDAPI_KEY</code> under the AI Studio Settings menu or in your environment variables.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PNR Status Header Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl mx-auto">
              {/* Card Title & PNR Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      {t("pnr_header") || "Passenger Name Record (PNR)"}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black tracking-widest mt-1 text-white">
                      {result.pnr}
                    </h2>
                  </div>
                  {statusMeta && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black tracking-wider shadow-sm uppercase ${statusMeta.color}`}>
                      <StatusIcon size={16} />
                      <span>{statusMeta.label}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 border-t border-white/10 mt-6 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-indigo-300">
                      <Train size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-indigo-200/70 block">
                        {t("pnr_train") || "Train Details"}
                      </span>
                      <span className="text-sm font-bold block mt-0.5">
                        {result.trainNumber} - {result.trainName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-indigo-300">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-indigo-200/70 block">
                        {t("pnr_journey_date") || "Date of Journey"}
                      </span>
                      <span className="text-sm font-bold block mt-0.5">
                        {result.dateOfJourney}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-indigo-300">
                      <Ticket size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-indigo-200/70 block">
                        {t("pnr_class") || "Travel Class & Chart"}
                      </span>
                      <span className="text-sm font-bold block mt-0.5">
                        {result.class} • <span className="text-indigo-300 font-extrabold">{result.chartStatus}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Journey Route details */}
              <div className="bg-slate-50 border-b border-gray-100 p-5 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-red-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-gray-400 block">{t("pnr_from") || "From Station"}</span>
                    <span className="text-xs font-bold text-gray-700">{result.fromStation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-gray-400 block">{t("pnr_boarding") || "Boarding Point"}</span>
                    <span className="text-xs font-bold text-gray-700">{result.boardingStation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-gray-400 block">{t("pnr_to") || "Reservation Up To"}</span>
                    <span className="text-xs font-bold text-gray-700">{result.reservationUpto}</span>
                  </div>
                </div>
              </div>

              {/* Passenger List Grid */}
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <Users size={18} className="text-[#1E73BE]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    {t("pnr_passengers") || "Passenger Seat Allocation & Status"}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 bg-slate-50">
                        <th className="py-3 px-4 rounded-l-lg">{t("pnr_no") || "Passenger No"}</th>
                        <th className="py-3 px-4">{t("pnr_booking_status") || "Booking Status"}</th>
                        <th className="py-3 px-4">{t("pnr_current_status") || "Current Status"}</th>
                        <th className="py-3 px-4">{t("pnr_coach") || "Coach"}</th>
                        <th className="py-3 px-4 rounded-r-lg">{t("pnr_berth") || "Berth / No"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
                      {result.passengers.map((passenger) => {
                        const isCnf = passenger.currentStatus.toUpperCase().includes("CNF") || passenger.currentStatus.toUpperCase().includes("CONFIRM");
                        return (
                          <tr key={passenger.passengerNo} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-bold text-gray-700">
                              #{passenger.passengerNo}
                            </td>
                            <td className="py-4 px-4 font-semibold text-gray-500">
                              {passenger.bookingStatus}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isCnf 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isCnf ? "bg-emerald-500" : "bg-amber-500"}`} />
                                {passenger.currentStatus}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-800">
                              {passenger.coach || "-"}
                            </td>
                            <td className="py-4 px-4">
                              {passenger.berth ? (
                                <span className="font-semibold text-slate-800">
                                  {passenger.berth} <span className="text-gray-400 font-bold">({passenger.berthCode})</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
