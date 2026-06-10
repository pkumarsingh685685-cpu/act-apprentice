import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { User, Calendar, LogIn, AlertCircle, MessageSquare, FileText, Send, Phone, Mail, Clock, Rocket } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore";

export default function CandidateLogin() {
  const config = useStore((state) => state.config) as any;
  const navigate = useNavigate();
  const sheetUrl = config.candidateDataCsvUrl;

  const [employeeNum, setEmployeeNum] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [error, setError] = useState("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Dashboard Tabs State
  const [activeTab, setActiveTab] = useState<'none' | 'form' | 'details' | 'my_queries' | 'application'>('none');

  // Query Form State
  const [queryData, setQueryData] = useState({
    department: "",
    mobile: "9199732466",
    email: "",
    queryType: "",
    remarks: ""
  });
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const [myQueries, setMyQueries] = useState<any[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);

  useEffect(() => {
    if (candidateData && employeeNum) {
      fetchMyQueries();
    }
  }, [candidateData]);

  const fetchMyQueries = async () => {
    setLoadingQueries(true);
    try {
      const q = query(
        collection(db, "candidate_queries"), 
        where("employeeNo", "==", employeeNum),
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory as composite index is required for where + orderBy together
      data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyQueries(data);
    } catch (err) {
      console.error("Error fetching queries:", err);
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    // If we have a URL, fetch and parse it on mount or lazy-load it
    if (sheetUrl) {
      Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
          setDataLoaded(true);
        },
        error: (error: any) => {
          console.error("Error fetching candidate data:", error);
          setError("Data source configuration error. Please contact admin.");
          setDataLoaded(true); // Allow fallback
        }
      });
    } else {
      setDataLoaded(true); // allow fallback if no url setting needed
    }
  }, [sheetUrl]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Fallback logic for test candidate
    const isTestCandidate = employeeNum.trim() === "9199732466" && 
                          (dob.trim() === "1999-03-20" || dob.trim() === "20-03-1999");
                          
    if (!sheetUrl && !isTestCandidate) {
      setError("Candidate data source is not configured yet. Please try again later.");
      return;
    }

    if (!dataLoaded) {
      toast.info("Candidate data is still loading. Please try again in a few seconds.");
      return;
    }

    setLoading(true);

    try {
      if (isTestCandidate) {
        setCandidateData({
          "Employee No.": "9199732466",
          "Name": "Sample Test Candidate",
          "Date of Birth": dob,
          "Trade": "Fitter",
          "Division": "Katihar",
          "Status": "Active"
        });
        setShowWelcomeAnimation(true);
        setTimeout(() => setShowWelcomeAnimation(false), 2500);
        setLoading(false);
        return;
      }

      // Find candidate in parsed CSV data
      const candidate = csvData.find((row) => {
        const empNoMatch = Object.keys(row).some(k => 
          (k.toLowerCase().includes("employee") || k.toLowerCase().includes("emp") || k.toLowerCase().includes("id")) &&
          row[k] === employeeNum.trim()
        );
        const dobMatch = Object.keys(row).some(k => 
          (k.toLowerCase().includes("dob") || k.toLowerCase().includes("date")) &&
          row[k] === dob.trim()
        );
        
        return empNoMatch && dobMatch;
      });

      if (candidate) {
        setCandidateData(candidate);
        setShowWelcomeAnimation(true);
        setTimeout(() => setShowWelcomeAnimation(false), 2500);
      } else {
        setError("Invalid Employee Number or DOB. Please check your credentials.");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCandidateData(null);
    setEmployeeNum("");
    setDob("");
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!queryData.department || !queryData.mobile || !queryData.queryType || !queryData.remarks) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    setSubmittingQuery(true);
    try {
      await addDoc(collection(db, "candidate_queries"), {
        employeeNo: employeeNum,
        name: candidateData?.['Name'] || candidateData?.['name'] || "Unknown Candidate",
        department: queryData.department,
        mobile: queryData.mobile,
        email: queryData.email,
        queryType: queryData.queryType,
        remarks: queryData.remarks,
        status: "New",
        createdAt: serverTimestamp(),
      });
      toast.success("Your query has been submitted successfully.");
      setQueryData({ ...queryData, department: "", queryType: "", remarks: "" });
      setActiveTab('my_queries'); // switch to see the query
      fetchMyQueries(); // refresh list
    } catch (err: any) {
      console.error("Error submitting query:", err);
      toast.error(`Error: ${err.message || 'Failed to submit query.'}`);
    } finally {
      setSubmittingQuery(false);
    }
  };

  return (
    <div className="w-full flex-col flex items-center justify-center py-10 px-4 relative min-h-screen bg-slate-50">
      {/* Small Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer z-50 select-none flex items-center gap-1"
        title="Go back / पीछे जाएं"
      >
        <span>←</span> <span>Back</span>
      </button>
      
      {showWelcomeAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-md overflow-hidden">
          <div className="animate-launch flex flex-col items-center">
            <Rocket className="w-32 h-32 text-orange-400 drop-shadow-[0_0_25px_rgba(251,146,60,0.8)]" strokeWidth={1.5} />
            <h2 className="text-5xl md:text-7xl font-extrabold text-white mt-8 tracking-widest uppercase drop-shadow-lg">
              Welcome
            </h2>
          </div>
        </div>
      )}

      {!candidateData ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-md w-full border border-gray-200">
          <div className="bg-[#1c3f60] p-6 text-white text-center">
            <h2 className="text-2xl font-bold tracking-tight">Candidate Login</h2>
            <p className="opacity-90 mt-2 text-sm text-blue-100">
              Access your personalized updates and data.
            </p>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Number / Registration ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={employeeNum}
                    onChange={(e) => setEmployeeNum(e.target.value)}
                    className="pl-10 w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#1c3f60] focus:border-transparent"
                    placeholder="Enter Employee No."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="pl-10 w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#1c3f60] focus:border-transparent"
                  />
                  {/* Note for fallback if date formats vary */}
                  <div className="text-xs text-gray-500 mt-1 pl-1">Format: YYYY-MM-DD (or as provided by Admin)</div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !dataLoaded}
                className="w-full bg-[#e31837] hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"} <LogIn className="w-5 h-5" />
              </button>
            </form>

            {/* Test Credentials Helper Box */}
            <div className="mt-5 p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
              <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Testing / Demo Account Credentials:
              </div>
              <div className="space-y-1 mt-2">
                <div><span className="font-semibold">Employee No:</span> <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">9199732466</code></div>
                <div><span className="font-semibold">Date of Birth:</span> <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">20-03-1999</code> or <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">1999-03-20</code></div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmployeeNum("9199732466");
                  setDob("1999-03-20");
                  toast.success("Demo credentials autofilled!");
                }}
                className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-3 rounded text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                🪄 Quick Autofill Test ID
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>For support, please contact: <a href={`mailto:${config.contactEmail}`} className="text-blue-600 hover:underline">{config.contactEmail}</a></p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-4xl w-full border border-gray-200">
          {/* Header section */}
          <div className="bg-[#1c3f60] p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Candidate Dashboard</h2>
              <p className="opacity-90 mt-1 text-sm text-blue-100">
                Welcome back, {candidateData?.['Name'] || candidateData?.['name'] || "Candidate"}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded font-medium transition-colors border border-white/20"
            >
              Logout
            </button>
          </div>

          {activeTab !== 'none' && (
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <button 
                onClick={() => setActiveTab('none')}
                className="flex items-center gap-2 text-blue-800 hover:text-blue-900 font-semibold px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          )}

          <div className="p-6 md:p-8 bg-white min-h-[400px]">
            {activeTab === 'none' ? (
              <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                 <div className="text-center mb-10 w-full">
                   <h3 className="text-3xl font-bold text-gray-800 mb-3">Welcome to Your Dashboard</h3>
                   <p className="text-gray-500 max-w-xl mx-auto text-lg">
                     Please select an option below to view your details, submit queries, track replies, or access your application form.
                   </p>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
                    {/* Candidate Details Box */}
                    <div 
                      onClick={() => setActiveTab('details')}
                      className="group cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                      <div className="bg-white p-4.5 rounded-full shadow-md text-blue-600 mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">Candidate Details</h4>
                      <p className="text-gray-600 text-xs">
                        View your personal information, employment data, and official records seamlessly.
                      </p>
                    </div>

                    {/* Submission Form for Query Box */}
                    <div 
                      onClick={() => {
                        setActiveTab('form');
                      }}
                      className="group cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                      <div className="bg-white p-4.5 rounded-full shadow-md text-orange-500 mb-5 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">Submit New Query</h4>
                      <p className="text-gray-600 text-xs">
                        Submit a dynamic query or request directly to the administrative department.
                      </p>
                    </div>

                    {/* Track Queries & Replies Box */}
                    <div 
                      onClick={() => {
                        setActiveTab('my_queries');
                        fetchMyQueries();
                      }}
                      className="group cursor-pointer bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                      <div className="bg-white p-4.5 rounded-full shadow-md text-purple-600 mb-5 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                        <MessageSquare className="w-8 h-8 text-purple-600 group-hover:text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">My Queries & Replies</h4>
                      <p className="text-gray-600 text-xs">
                        Track previous issues and instantly read replies given by the department admin.
                      </p>
                    </div>

                    {/* Application Form Box */}
                    <div 
                      onClick={() => setActiveTab('application')}
                      className="group cursor-pointer bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                      <div className="bg-white p-4.5 rounded-full shadow-md text-emerald-600 mb-5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                        <User className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-emerald-700 transition-colors">Application Form</h4>
                      <p className="text-gray-600 text-xs">
                        Access, view, and manage your complete application form details with a click.
                      </p>
                    </div>
                 </div>
              </div>
            ) : activeTab === 'form' ? (
              <div className="max-w-2xl mx-auto">
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-800">Submit a Query</h3>
                  <p className="text-gray-500 text-sm mt-1">Fill out the form below to submit a query to the department.</p>
                </div>

                <form onSubmit={handleSubmitQuery} className="space-y-5 bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Read-Only Employee No */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number</label>
                      <input 
                        type="text" 
                        value={employeeNum}
                        readOnly 
                        className="w-full p-2.5 border border-gray-200 rounded-md bg-gray-100 text-gray-600 font-medium select-none"
                      />
                    </div>
                    {/* Read-Only DOB */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input 
                        type="text" 
                        value={dob}
                        readOnly 
                        className="w-full p-2.5 border border-gray-200 rounded-md bg-gray-100 text-gray-600 font-medium select-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Department <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={queryData.department}
                      onChange={e => setQueryData({...queryData, department: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1c3f60] focus:border-transparent bg-white"
                    >
                      <option value="">-- Choose Department --</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Operating">Operating</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Personnel">Personnel</option>
                      <option value="Signal & Telecom">Signal & Telecom</option>
                      <option value="Medical">Medical</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="tel"
                          required
                          value={queryData.mobile}
                          onChange={e => setQueryData({...queryData, mobile: e.target.value})}
                          className="pl-9 w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1c3f60] focus:border-transparent" 
                          placeholder="Enter 10-digit number"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="email" 
                          value={queryData.email}
                          onChange={e => setQueryData({...queryData, email: e.target.value})}
                          className="pl-9 w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1c3f60] focus:border-transparent"
                          placeholder="Your email address"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Query Related To <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={queryData.queryType}
                      onChange={e => setQueryData({...queryData, queryType: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1c3f60] focus:border-transparent bg-white"
                    >
                      <option value="">-- Choose Category --</option>
                      <option value="Payment Regarding">Payment Regarding</option>
                      <option value="Certificate Regarding">Certificate Regarding</option>
                      <option value="Contract Regarding">Contract Regarding</option>
                      <option value="Leave Regarding">Leave Regarding</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submit your remarks in detail <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      value={queryData.remarks}
                      onChange={e => setQueryData({...queryData, remarks: e.target.value})}
                      rows={4}
                      className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1c3f60] focus:border-transparent resize-y"
                      placeholder="Please clearly describe your issue or query here..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingQuery}
                    className="w-full bg-[#1c3f60] hover:bg-blue-900 text-white font-bold py-3.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submittingQuery ? "Submitting..." : "Submit Query"} <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            ) : activeTab === 'details' ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-6 border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-800">Your Information Details</h3>
                  <p className="text-gray-500 text-sm">Personal and employment data as per our records.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(candidateData).map(([key, value]) => {
                    if (key === "" || (value as string).trim() === "") return null;
                    return (
                      <div key={key} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">{key}</div>
                        <div className="text-slate-900 font-medium text-lg break-words">{value as string}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'application' ? (
              <div className="animate-in fade-in zoom-in-95 duration-200 max-w-4xl mx-auto">
                <div className="mb-6 border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-800">Application Form</h3>
                  <p className="text-gray-500 text-sm">View and manage your submitted application form.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center">
                  <User className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-emerald-900 mb-2">Application Record Found</h4>
                  <p className="text-emerald-700 max-w-lg mx-auto mb-6">
                    Your application form has been successfully submitted and is currently under processing by the division.
                  </p>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto shadow-sm">
                    <FileText className="w-5 h-5" />
                    Download Application PDF
                  </button>
                </div>
              </div>
            ) : activeTab === 'my_queries' ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-6 border-b pb-4 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">My Submitted Queries</h3>
                    <p className="text-gray-500 text-sm">Track the status of all your departmental queries.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('form')}
                    className="bg-[#1c3f60] hover:bg-blue-900 text-white font-medium py-2 px-4 rounded transition-colors flex items-center gap-2"
                  >
                    Submit New Query <Send className="w-4 h-4" />
                  </button>
                </div>
                
                {loadingQueries ? (
                  <div className="py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1c3f60]"></div>
                  </div>
                ) : myQueries.length === 0 ? (
                  <div className="py-16 text-center bg-gray-50 border border-gray-200 rounded-lg">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-gray-700 font-medium text-lg">No Queries Found</h4>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">You haven't submitted any queries yet.</p>
                    <button 
                      onClick={() => setActiveTab('form')}
                      className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Submit your first query &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myQueries.map((query) => (
                      <div key={query.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                          <h4 className="font-semibold text-gray-800 text-lg">{query.queryType}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            query.status === 'New' ? 'bg-blue-100 text-blue-800' :
                            query.status === 'Processing' ? 'bg-amber-100 text-amber-800' :
                            query.status === 'Replied' ? 'bg-purple-100 text-purple-800 border border-purple-200 animate-pulse' :
                            query.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {query.status || 'New'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                          <div>
                            <span className="block text-gray-400 text-xs uppercase mb-0.5">Department</span>
                            <span className="font-medium text-gray-800">{query.department}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 text-xs uppercase mb-0.5">Date Submitted</span>
                            <span className="font-medium text-gray-800">
                              {query.createdAt?.seconds 
                                ? new Date(query.createdAt.seconds * 1000).toLocaleDateString()
                                : 'Recent'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                            <span className="block text-gray-500 text-xs font-semibold uppercase mb-1.5">My Remarks / Issue</span>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{query.remarks}</p>
                          </div>

                          {query.adminReply && (
                            <div className="bg-purple-50/75 p-4 rounded-md border border-purple-100 shadow-sm">
                              <span className="block text-purple-600 text-xs font-bold uppercase mb-1.5 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-purple-600"></span>
                                Administration Reply / विभाग का उत्तर
                              </span>
                              <p className="text-indigo-950 text-sm font-medium whitespace-pre-wrap leading-relaxed">{query.adminReply}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
