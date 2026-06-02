import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Download, Search, Trash2, Mail, Phone, MessageSquare, Reply, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export function CandidateQueriesManager() {
  const [queriesList, setQueriesList] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const q = query(collection(db, "candidate_queries"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQueriesList(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error fetching queries:", err);
      toast.error("Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = queriesList;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.employeeNo || '').toLowerCase().includes(searchLower) ||
        (item.department || '').toLowerCase().includes(searchLower) ||
        (item.queryType || '').toLowerCase().includes(searchLower)
      );
    }

    result = [...result].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'createdAt') {
        valA = a.createdAt?.seconds || 0;
        valB = b.createdAt?.seconds || 0;
      } else {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(result);
  }, [queriesList, search, sortField, sortOrder]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this query?")) {
      try {
        await deleteDoc(doc(db, "candidate_queries", id));
        setQueriesList(prev => prev.filter(item => item.id !== id));
        toast.success("Query deleted successfully");
      } catch (err) {
        console.error("Error deleting:", err);
        toast.error("Failed to delete query");
      }
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("No records to export");
      return;
    }

    const exportData = filtered.map(item => {
      const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
      return {
        'Date & Time': d.toLocaleString(),
        'Emp No': item.employeeNo || '',
        'Name': item.name || '',
        'Department': item.department || '',
        'Type': item.queryType || '',
        'Mobile': item.mobile || '',
        'Email': item.email || '',
        'Remarks': item.remarks || '',
        'Status': item.status || 'New',
        'Admin Reply': item.adminReply || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Queries");
    XLSX.writeFile(workbook, `Candidate_Queries_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Exported successfully!");
  };

  const handleSendReply = async (id: string) => {
    const text = replyText[id];
    if (!text || text.trim() === '') {
      toast.error("Reply text cannot be empty");
      return;
    }

    setSubmittingReply(id);
    try {
      await updateDoc(doc(db, "candidate_queries", id), {
        adminReply: text,
        status: "Replied",
        repliedAt: new Date()
      });
      toast.success("Reply sent successfully");
      setQueriesList(prev => prev.map(item => item.id === id ? { ...item, adminReply: text, status: "Replied" } : item));
      setReplyText(prev => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSubmittingReply(null);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Candidate Queries</h3>
          <p className="text-sm text-gray-500">Manage and reply to queries submitted by candidates.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md font-medium hover:bg-emerald-700 transition"
        >
          <Download size={18} /> Export to Excel
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name, emp no, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('createdAt')}>
                Date
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700">Candidate Info</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Query Details</th>
              <th className="px-4 py-3 font-semibold text-gray-700 w-1/3">Admin Reply</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading queries...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 border-b-2 border-transparent">No queries found.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 p-2">
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600 align-top">
                    {item.createdAt?.toDate ? (
                      <div className="flex flex-col">
                        <span>{item.createdAt.toDate().toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">{item.createdAt.toDate().toLocaleTimeString()}</span>
                      </div>
                    ) : 'Unknown Date'}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Emp No: {item.employeeNo}</div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1"><Phone size={10}/> {item.mobile}</div>
                      {item.email && <div className="flex items-center gap-1"><Mail size={10}/> {item.email}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top max-w-xs">
                    <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded mb-1 border border-blue-100 font-medium">
                      {item.queryType} &bull; {item.department}
                    </div>
                    <div className="text-gray-700 mt-1 text-sm bg-gray-50 p-2 rounded border border-gray-100">
                      {item.remarks}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {item.adminReply ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-2 rounded text-emerald-800 text-sm">
                        <span className="font-semibold text-xs block mb-1">Your Reply:</span>
                        {item.adminReply}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <textarea 
                          placeholder="Type your reply here..."
                          className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 resize-y"
                          rows={2}
                          value={replyText[item.id] || ''}
                          onChange={(e) => setReplyText({...replyText, [item.id]: e.target.value})}
                        ></textarea>
                        <button 
                          onClick={() => handleSendReply(item.id)}
                          disabled={submittingReply === item.id || !replyText[item.id]}
                          className="self-end bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {submittingReply === item.id ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center align-top">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete record">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
