import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { 
  ShieldAlert, 
  Search, 
  Trash2, 
  RefreshCw, 
  FileText, 
  User, 
  Clock, 
  Cpu,
  Badge,
  Filter,
  ArrowRightLeft
} from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  type: string;
  action: string;
  details?: any;
  user?: string;
  timestamp: string;
  agent?: string;
}

export function AuditLogManager() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
      const querySnapshot = await getDocs(q);
      const fetchedLogs: AuditLog[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as AuditLog);
      });
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching audit logs: ", error);
      toast.error("Failed to fetch administrative audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all administrative audit logs? This action is irreversible.")) {
      return;
    }
    setLoading(true);
    try {
      // Clear in-memory client list and delete Firestore collection items
      const deletePromises = logs.map(l => deleteDoc(doc(db, "audit_logs", l.id)));
      await Promise.all(deletePromises);
      
      // Auto write a reset log
      await addDoc(collection(db, "audit_logs"), {
        type: "SYSTEM_RESET",
        action: "Administrative audit logs cleared by Admin",
        timestamp: new Date().toISOString(),
        user: "System Administrator",
        agent: "Security Protocol Manager"
      });

      toast.success("Audit log trail successfully purged.");
      fetchLogs();
    } catch (err) {
      console.error("Purge fail:", err);
      toast.error("Failed to clear some audit files.");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "SF_GENERATED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CHECKLIST_UPDATE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "APO_ALLOTMENT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SYSTEM_RESET":
        return "bg-red-50 text-red-700 border-red-200";
      case "CIRCULAR_ADDED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    return matchesSearch && log.type === filterType;
  });

  const uniqueTypes: string[] = Array.from(new Set(logs.map(l => l.type || "OTHER")));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Personnel & D&AR Real-time Audit Trail
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse legally compliant activity records of standard forms, material checklists, circular updates, and APO files.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={fetchLogs} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border rounded-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button 
            type="button"
            onClick={handleClearLogs}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge Logs
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operational logs by summary, officer name, or type..."
            className="w-full text-sm outline-none border border-gray-300 rounded-md pl-10 pr-4 py-2 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Category:
          </span>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 text-xs border border-gray-300 rounded-md px-2.5 py-2 bg-white"
          >
            <option value="all">All Operations</option>
            {uniqueTypes.map(ut => (
              <option key={ut} value={ut}>{ut.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading && logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
          <p className="text-sm font-semibold">Synchronizing audit data from railway security center...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg border-gray-200">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500">No matching security log entries discovered.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th scope="col" className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Action Type</th>
                <th scope="col" className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Operational Summary</th>
                <th scope="col" className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Authorized User</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(log.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getBadgeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 font-medium leading-tight">{log.action}</p>
                        {log.details && (
                          <span className="text-[10px] text-indigo-600 font-bold block mt-1 underline hover:text-indigo-800">
                            {isExpanded ? "Hide granular metadata" : "Inspect technical payload"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {log.user || "System Access"}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded details view */}
                    {isExpanded && log.details && (
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-4 border-t border-b border-gray-100">
                          <div className="rounded-md border border-gray-200 bg-[#1e293b] text-[#f8fafc] p-4 text-xs font-mono max-w-full overflow-x-auto shadow-inner">
                            <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase tracking-widest mb-2 border-b border-slate-700 pb-1">
                              <Cpu className="w-3.5 h-3.5 text-green-400" />
                              Inspection Metadata Payload (Katihar Secure Link)
                            </span>
                            <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                            {log.agent && (
                              <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 flex justify-between">
                                <span>Platform Context: {log.agent}</span>
                                <span>Record ID: {log.id}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
