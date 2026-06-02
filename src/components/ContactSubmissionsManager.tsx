import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Download, Search, Trash2, Mail, Phone, Clock, Filter, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export function ContactSubmissionsManager() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, "contact_submissions"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = submissions;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.email || '').toLowerCase().includes(searchLower) ||
        (item.phone || '').toLowerCase().includes(searchLower) ||
        (item.message || '').toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(item => item.status === statusFilter);
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
  }, [submissions, search, statusFilter, sortField, sortOrder]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this submission?")) {
      try {
        await deleteDoc(doc(db, "contact_submissions", id));
        setSubmissions(prev => prev.filter(item => item.id !== id));
        toast.success("Submission deleted successfully");
      } catch (err) {
        console.error("Error deleting:", err);
        toast.error("Failed to delete submission");
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
        'Name': item.name || '',
        'Email': item.email || '',
        'Phone': item.phone || '',
        'Message': item.message || '',
        'Status': item.status || 'New'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    XLSX.writeFile(workbook, `Contact_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Exported successfully!");
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
          <h3 className="text-lg font-semibold text-gray-900">Form Submissions (Contact)</h3>
          <p className="text-sm text-gray-500">Manage and export messages sent via the contact form.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md font-medium hover:bg-emerald-700 transition"
        >
          <Download size={18} /> Export to Excel (.xlsx)
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name, email, phone or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-500" size={18} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('createdAt')}>
                <div className="flex items-center gap-1">Date <ArrowUpDown size={14} className="text-gray-400" /></div>
              </th>
              <th className="px-6 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">Name <ArrowUpDown size={14} className="text-gray-400" /></div>
              </th>
              <th className="px-6 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('email')}>
                <div className="flex items-center gap-1">Contact <ArrowUpDown size={14} className="text-gray-400" /></div>
              </th>
              <th className="px-6 py-3 font-semibold text-gray-700">Message</th>
              {/* <th className="px-6 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown size={14} className="text-gray-400" /></div>
              </th> */}
              <th className="px-6 py-3 font-semibold text-gray-700 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading submissions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 border-b-2 border-transparent">No submissions found.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.createdAt?.toDate ? (
                      <div className="flex flex-col">
                        <span>{item.createdAt.toDate().toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">{item.createdAt.toDate().toLocaleTimeString()}</span>
                      </div>
                    ) : 'Unknown Date'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> <a href={`mailto:${item.email}`} className="hover:text-blue-600">{item.email}</a></div>
                      {item.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {item.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-700 max-w-xs md:max-w-md line-clamp-2 hover:line-clamp-none cursor-pointer" title={item.message}>
                      {item.message}
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'New' ? 'bg-blue-100 text-blue-700' : item.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status || 'New'}
                    </span>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
      
      {!loading && filtered.length > 0 && (
        <div className="text-sm text-gray-500 text-right">
          Showing {filtered.length} of {submissions.length} submissions
        </div>
      )}
    </div>
  );
}
