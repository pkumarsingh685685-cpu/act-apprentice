import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { Plus, Trash2, Edit, Save, X, User, Mail, Phone, RefreshCw, Layers, Award } from "lucide-react";
import { toast } from "sonner";
import { ApoWorkAllotment } from "../types";

export function ApoAllotmentManager() {
  const apoWorkAllotments = useStore((state) => state.apoWorkAllotments || []);
  const addApoAllotment = useStore((state) => state.addApoAllotment);
  const updateApoAllotment = useStore((state) => state.updateApoAllotment);
  const deleteApoAllotment = useStore((state) => state.deleteApoAllotment);
  const config = useStore((state) => state.config);
  const updateConfig = useStore((state) => state.updateConfig);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sr. DPO fields
  const [srDpoNameEn, setSrDpoNameEn] = useState(config?.srDpoNameEn || "");
  const [srDpoNameHi, setSrDpoNameHi] = useState(config?.srDpoNameHi || "");
  const [srDpoDesignationEn, setSrDpoDesignationEn] = useState(config?.srDpoDesignationEn || "");
  const [srDpoDesignationHi, setSrDpoDesignationHi] = useState(config?.srDpoDesignationHi || "");

  // Sync when config loads
  useEffect(() => {
    if (config) {
      setSrDpoNameEn(config.srDpoNameEn || "");
      setSrDpoNameHi(config.srDpoNameHi || "");
      setSrDpoDesignationEn(config.srDpoDesignationEn || "");
      setSrDpoDesignationHi(config.srDpoDesignationHi || "");
    }
  }, [config]);

  const handleSaveSrDpo = () => {
    updateConfig("srDpoNameEn", srDpoNameEn);
    updateConfig("srDpoNameHi", srDpoNameHi);
    updateConfig("srDpoDesignationEn", srDpoDesignationEn);
    updateConfig("srDpoDesignationHi", srDpoDesignationHi);
    toast.success("Senior Divisional Personnel Officer (Sr. DPO) details updated successfully!");
  };

  // Form states
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [deptInput, setDeptInput] = useState(""); // Comma separated
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [order, setOrder] = useState(1);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editDeptInput, setEditDeptInput] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editOrder, setEditOrder] = useState(1);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Officer Name is required");
      return;
    }
    if (!designation.trim()) {
      toast.error("Designation (e.g. APO-I, APO-II) is required");
      return;
    }

    const departments = deptInput
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    addApoAllotment({
      name: name.trim(),
      designation: designation.trim(),
      departments,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      order: Number(order) || 1,
    });

    toast.success("APO Work Allotment added successfully");
    setName("");
    setDesignation("");
    setDeptInput("");
    setContactEmail("");
    setContactPhone("");
    setOrder(apoWorkAllotments.length + 2);
    setIsAdding(false);
  };

  const startEditing = (apo: ApoWorkAllotment) => {
    setEditingId(apo.id);
    setEditName(apo.name);
    setEditDesignation(apo.designation);
    setEditDeptInput(apo.departments.join(", "));
    setEditContactEmail(apo.contactEmail || "");
    setEditContactPhone(apo.contactPhone || "");
    setEditOrder(apo.order);
  };

  const handleEditSave = (id: string) => {
    if (!editName.trim()) {
      toast.error("Officer Name is required");
      return;
    }
    if (!editDesignation.trim()) {
      toast.error("Designation is required");
      return;
    }

    const departments = editDeptInput
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    updateApoAllotment(id, {
      name: editName.trim(),
      designation: editDesignation.trim(),
      departments,
      contactEmail: editContactEmail.trim() || undefined,
      contactPhone: editContactPhone.trim() || undefined,
      order: Number(editOrder) || 1,
    });

    toast.success("APO details updated successfully");
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this APO work allotment entry?")) {
      deleteApoAllotment(id);
      toast.success("Entry removed successfully");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">APO Work Allotment Manager</h2>
          <p className="text-sm text-gray-500">
            Configure Assistant Personnel Officers (APOs) and allot their departments/duties.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setOrder(apoWorkAllotments.length + 1);
          }}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Add New APO Allotment"}
        </button>
      </div>

      {/* Sr. DPO (Branch Officer) details section */}
      <div className="bg-slate-900/30 border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-700">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">
                ★ Senior Divisional Personnel Officer (Sr. DPO) Details
              </h3>
              <p className="text-xs text-slate-500">
                Manage details of the Branch Officer (Head of the Personnel Branch).
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveSrDpo}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all active:translate-y-[1px] shadow-sm shadow-indigo-600/10 cursor-pointer"
          >
            <Save size={14} />
            Save Sr. DPO Details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Sr. DPO Name (English)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={15} />
              </span>
              <input
                type="text"
                value={srDpoNameEn}
                onChange={(e) => setSrDpoNameEn(e.target.value)}
                placeholder="e.g. Sri Sanjeev Kumar"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 font-hindi">
              Sr. DPO Name (Hindi / हिंदी)
            </label>
            <input
              type="text"
              value={srDpoNameHi}
              onChange={(e) => setSrDpoNameHi(e.target.value)}
              placeholder="e.g. श्री संजीव कुमार"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Sr. DPO Designation (English)
            </label>
            <input
              type="text"
              value={srDpoDesignationEn}
              onChange={(e) => setSrDpoDesignationEn(e.target.value)}
              placeholder="e.g. Sr. DPO / KIR"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 font-hindi">
              Sr. DPO Designation (Hindi / हिंदी)
            </label>
            <input
              type="text"
              value={srDpoDesignationHi}
              onChange={(e) => setSrDpoDesignationHi(e.target.value)}
              placeholder="e.g. वरिष्ठ मंडल कार्मिक अधिकारी / कटिहार (Sr. DPO / KIR)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Plus className="text-indigo-600" size={18} />
            Add Officer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Officer Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Sri A. K. Sinha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Designation *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Layers size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. APO-I, APO-II, APO (Welfare)"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Display Order No. *</label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contact Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="apo1@nfr.railnet.gov.in"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contact Phone/Rly No.</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. 9771441600 / Rly: 94103"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">
              Work Allotments / Supervised Departments * (Separate with commas)
            </label>
            <textarea
              placeholder="e.g. Mechanical Department, Electrical Branch, S&T Section, Staff Grievance Cell, Bill Section"
              rows={3}
              value={deptInput}
              onChange={(e) => setDeptInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              required
            ></textarea>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Enter each branch or description separated by commas. Each item will become an elegant 3D bubble/node on the public interactive diagram.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md"
            >
              Add APO
            </button>
          </div>
        </form>
      )}

      {/* Roster of Officers */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b pb-2">
          <Layers size={18} className="text-indigo-600" />
          Active APO Officers Diagram Hierarchy
        </h3>

        {apoWorkAllotments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-dashed rounded-xl">
            <RefreshCw className="mx-auto text-gray-400 animate-spin mb-3" size={24} />
            <p className="text-gray-500 font-medium">No APO work allotments found in Database.</p>
            <p className="text-xs text-gray-400 mt-1">Click &quot;Add New APO Allotment&quot; to define your first officer diagram.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {apoWorkAllotments.map((apo) => {
              const isEditing = editingId === apo.id;
              return (
                <div
                  key={apo.id}
                  className={`border rounded-xl p-5 transition-all shadow-sm bg-white ${
                    isEditing ? "ring-2 ring-indigo-500 border-indigo-300" : "hover:border-indigo-200"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-bold text-indigo-700">Editing Entry ({apo.designation})</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(apo.id)}
                            className="p-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors flex items-center gap-1"
                          >
                            <Save size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded transition-colors flex items-center gap-1"
                          >
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Officer Name *</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Designation *</label>
                          <input
                            type="text"
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Order *</label>
                          <input
                            type="number"
                            min="1"
                            value={editOrder}
                            onChange={(e) => setEditOrder(Number(e.target.value))}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white font-bold"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                          <input
                            type="email"
                            value={editContactEmail}
                            onChange={(e) => setEditContactEmail(e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone / Rly No.</label>
                          <input
                            type="text"
                            value={editContactPhone}
                            onChange={(e) => setEditContactPhone(e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">
                          Handled Departments / Allotments (Comma-separated)
                        </label>
                        <textarea
                          rows={3}
                          value={editDeptInput}
                          onChange={(e) => setEditDeptInput(e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          required
                        ></textarea>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white uppercase rounded shadow-sm">
                            {apo.designation}
                          </span>
                          <h4 className="text-base font-bold text-gray-900">{apo.name}</h4>
                          <span className="text-xs text-slate-400 font-medium ml-auto lg:ml-0">
                            Order: <span className="font-bold text-slate-600">{apo.order}</span>
                          </span>
                        </div>

                        {/* Contacts */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          {apo.contactPhone && (
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              <Phone size={11} className="text-slate-400" />
                              {apo.contactPhone}
                            </span>
                          )}
                          {apo.contactEmail && (
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              <Mail size={11} className="text-slate-400" />
                              {apo.contactEmail}
                            </span>
                          )}
                        </div>

                        {/* Department Bubbles */}
                        <div className="pt-2">
                          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                            Allotted Work Departments:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {apo.departments.map((dept, di) => (
                              <span
                                key={di}
                                className="px-3 py-1.5 text-xs md:text-sm font-black bg-amber-50 text-amber-800 rounded-lg border-2 border-amber-300 transition-colors hover:bg-amber-100 shadow-sm flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full shrink-0" />
                                {dept}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex gap-2 self-end lg:self-center">
                        <button
                          onClick={() => startEditing(apo)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-all border border-indigo-100/40"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(apo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all border border-red-100/40"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
