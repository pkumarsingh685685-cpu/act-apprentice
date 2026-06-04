import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List as ListIcon, Loader2, Save, X, Database, Search, ArrowLeft, Download, FileText, Settings, Eye } from "lucide-react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from "firebase/firestore";
import { toast } from "sonner";

export function DynamicRegistersManager() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [activeRegister, setActiveRegister] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // States for creating/editing a register
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [columns, setColumns] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "dynamic_registers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRegisters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreateNew = () => {
    setEditingRegister(null);
    setFormName("");
    setFormDesc("");
    setColumns([{ id: Date.now().toString(), name: "Employee Name", type: "text" }]);
    setIsFormOpen(true);
  };

  const handleEditRegister = (reg: any) => {
    setEditingRegister(reg);
    setFormName(reg.name);
    setFormDesc(reg.description || "");
    setColumns(reg.columns || []);
    setIsFormOpen(true);
  };

  const handleSaveRegister = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a register name.");
      return;
    }
    if (columns.length === 0) {
      toast.error("Please add at least one column.");
      return;
    }

    try {
      const regData = {
        name: formName.trim(),
        description: formDesc.trim(),
        columns: columns,
        updatedAt: serverTimestamp()
      };

      if (editingRegister) {
        await updateDoc(doc(db, "dynamic_registers", editingRegister.id), regData);
        toast.success("Register updated.");
      } else {
        await addDoc(collection(db, "dynamic_registers"), {
          ...regData,
          createdAt: serverTimestamp()
        });
        toast.success("Register created.");
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save register.");
    }
  };

  const handleDeleteRegister = async (id: string) => {
    if (confirm("Are you sure? This will delete the register schema. Existing records might become orphaned.")) {
      try {
        await deleteDoc(doc(db, "dynamic_registers", id));
        toast.success("Register deleted.");
        if (activeRegister && activeRegister.id === id) setActiveRegister(null);
      } catch (err: any) {
        toast.error("Failed to delete.");
      }
    }
  };

  const addColumn = () => {
    setColumns([...columns, { id: Date.now().toString(), name: "", type: "text" }]);
  };

  const updateColumn = (id: string, updates: any) => {
    setColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
  };

  if (activeRegister) {
    return <DynamicRegisterDataView register={activeRegister} onBack={() => setActiveRegister(null)} />;
  }

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {editingRegister ? "Edit Register Schema" : "Create New Register"}
            </h2>
          </div>
          <button onClick={handleSaveRegister} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Save size={16} /> Save Register
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Register Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Retirement Register 2027"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="e.g. Monitor all upcoming retirements"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Column Configuration</h3>
            <button onClick={addColumn} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition">
              <Plus size={14} /> Add Column
            </button>
          </div>
          
          <div className="space-y-3">
            {columns.map((col, index) => (
              <div key={col.id} className="flex items-start gap-4 p-4 border rounded-md bg-gray-50 group">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Column Name</label>
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                      placeholder="e.g. Employee ID"
                      className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Data Type</label>
                    <select
                      value={col.type}
                      onChange={(e) => updateColumn(col.id, { type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text (Remarks)</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="dropdown">Dropdown (Select)</option>
                    </select>
                  </div>
                  {col.type === "dropdown" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Options (Comma separated)</label>
                      <input
                        type="text"
                        value={col.options || ""}
                        onChange={(e) => updateColumn(col.id, { options: e.target.value })}
                        placeholder="Option 1, Option 2, ..."
                        className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
                <div className="pt-6">
                  <button 
                    onClick={() => removeColumn(col.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {columns.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-md">
                No columns defined. Click "Add Column" to start building your register schema.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Database className="text-blue-600" />
            Dynamic Registers Console
          </h2>
          <p className="text-gray-500">Create completely customized data collection registers on the fly.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Configure New Register
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : registers.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Dynamic Registers Found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Create customized registers with tailored columns to suit any data collection requirement permanently without any code changes.</p>
          <button onClick={handleCreateNew} className="text-blue-600 hover:underline font-medium">Create your first register</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registers.map(reg => (
            <div key={reg.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-1 border border-blue-100">
                  <FileText size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditRegister(reg)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Settings size={16} /></button>
                  <button onClick={() => handleDeleteRegister(reg.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{reg.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{reg.description || "No description provided."}</p>
              
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{reg.columns?.length || 0} Columns</span>
                <button
                  onClick={() => setActiveRegister(reg)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 transition font-medium rounded-md text-sm flex items-center gap-2"
                >
                  <Eye size={16} /> Open Reg.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ //
// DATA ENTRY VIEW FOR A SPECIFIC REGISTER
// ------------------------------------------------------------------------------------------------ //

function DynamicRegisterDataView({ register, onBack }: { register: any, onBack: () => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const columns = register.columns || [];

  useEffect(() => {
    const q = query(
      collection(db, "dynamic_register_records"), 
      orderBy("createdAt", "desc")
    );
    // Filtering by registerId client-side initially to avoid needing a composite index for text search
    // Optionally firestore 'where' query can be used, but let's keep it simple.
    
    const unsub = onSnapshot(q, (snap) => {
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const myDocs = allDocs.filter((d: any) => d.registerId === register.id);
      setRecords(myDocs);
      setLoading(false);
    });
    return unsub;
  }, [register.id]);

  const handleOpenNew = () => {
    setEditingRecord(null);
    setFormData({});
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setFormData(record.data || {});
    setIsFormOpen(true);
  };

  const handleSaveRecord = async () => {
    // Basic validation
    let hasData = false;
    for (const key of Object.keys(formData)) {
      if (formData[key] !== undefined && formData[key] !== "") hasData = true;
    }
    if (!hasData) {
      toast.error("Please enter some data.");
      return;
    }

    try {
      const recordPayload = {
        registerId: register.id,
        registerName: register.name,
        data: formData,
        updatedAt: serverTimestamp(),
      };

      if (editingRecord) {
        await updateDoc(doc(db, "dynamic_register_records", editingRecord.id), recordPayload);
        toast.success("Record updated.");
      } else {
        await addDoc(collection(db, "dynamic_register_records"), {
          ...recordPayload,
          createdAt: serverTimestamp()
        });
        toast.success("Record added.");
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save record.");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm("Delete this record permanently?")) {
      try {
        await deleteDoc(doc(db, "dynamic_register_records", id));
        toast.success("Record deleted.");
      } catch (err: any) {
        toast.error("Failed to delete.");
      }
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return toast.info("No records to export.");
    
    const headers = columns.map((c: any) => c.name);
    let csvContent = headers.join(",") + "\n";

    records.forEach(r => {
      const row = columns.map((c: any) => {
        let val = (r.data && r.data[c.id]) || "";
        val = String(val).replace(/"/g, '""'); // Escape quotes
        return `"${val}"`;
      });
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${register.name.replace(/\s+/g, '_')}_Export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true;
    const values = Object.values(r.data || {}).join(" ").toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"><ArrowLeft size={18} /></button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{register.name}</h2>
            <p className="text-sm text-gray-500">{records.length} records</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Search register..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md outline-none focus:border-blue-500"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button onClick={handleExportCSV} title="Export CSV" className="p-1.5 border rounded text-gray-600 hover:bg-gray-50"><Download size={18} /></button>
          <button
            onClick={handleOpenNew}
            className="bg-[#1c3f60] hover:bg-[#15304a] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-gray-700 bg-gray-50 border-b uppercase">
              <tr>
                <th className="px-6 py-3 w-16">#</th>
                {columns.map((col: any) => (
                  <th key={col.id} className="px-6 py-3 whitespace-nowrap tracking-wider">{col.name}</th>
                ))}
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500">
                    No records found. Click "Add Record" to insert data.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => (
                  <tr key={r.id} className="border-b hover:bg-blue-50/50 transition">
                    <td className="px-6 py-3 font-medium text-gray-500">{i + 1}</td>
                    {columns.map((col: any) => (
                      <td key={col.id} className="px-6 py-3">
                        {r.data ? String(r.data[col.id] || "-") : "-"}
                      </td>
                    ))}
                    <td className="px-6 py-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleEditRecord(r)} className="text-blue-600 hover:underline text-xs font-semibold">Edit</button>
                      <button onClick={() => handleDeleteRecord(r.id)} className="text-red-500 hover:underline text-xs font-semibold">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editingRecord ? "Edit Record" : "New Record"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {columns.map((col: any) => (
                <div key={col.id}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{col.name}</label>
                  
                  {col.type === "textarea" ? (
                    <textarea 
                      value={formData[col.id] || ""}
                      onChange={(e) => setFormData({...formData, [col.id]: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:border-blue-500 outline-none min-h-[80px]"
                    />
                  ) : col.type === "dropdown" ? (
                    <select
                      value={formData[col.id] || ""}
                      onChange={(e) => setFormData({...formData, [col.id]: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select an option</option>
                      {(col.options || "").split(",").map((opt: string) => opt.trim()).filter((o: string) => o).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                      value={formData[col.id] || ""}
                      onChange={(e) => setFormData({...formData, [col.id]: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:border-blue-500 outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition">Cancel</button>
              <button onClick={handleSaveRecord} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition shadow-sm">Save Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
