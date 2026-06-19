import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { Part2Field } from "../types";
import { Plus, Trash2, Edit, ArrowUp, ArrowDown, Check, X, List, Info } from "lucide-react";
import { toast } from "sonner";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export function ChecklistManager() {
  const part2Template = useStore((state) => state.part2Template) || [];
  const addPart2TemplateField = useStore((state) => state.addPart2TemplateField);
  const updatePart2TemplateField = useStore((state) => state.updatePart2TemplateField);
  const deletePart2TemplateField = useStore((state) => state.deletePart2TemplateField);
  const reorderPart2TemplateFields = useStore((state) => state.reorderPart2TemplateFields);

  // Form states for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [customId, setCustomId] = useState("");
  const [isSubField, setIsSubField] = useState(false);

  // Sorting query filtered view
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenAdd = () => {
    setEditingId(null);
    setLabel("");
    setCustomId(`p2_${Math.random().toString(36).substring(2, 9)}`);
    setIsSubField(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (field: Part2Field) => {
    setEditingId(field.id);
    setLabel(field.label);
    setCustomId(field.id);
    setIsSubField(!!field.isSubField);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setLabel("");
    setCustomId("");
    setIsSubField(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Please enter a label for the checklist row");
      return;
    }
    if (!customId.trim()) {
      toast.error("Please provide a unique target Identifier / ID");
      return;
    }

    if (editingId) {
      // Update
      updatePart2TemplateField(editingId, {
        id: customId,
        label: label.trim(),
        isSubField,
      });
      addDoc(collection(db, "audit_logs"), {
        type: "CHECKLIST_UPDATE",
        action: `Updated checklist entry: "${label.trim()}" (ID: ${customId})`,
        details: { editingId, customId, label: label.trim(), isSubField },
        user: "Admin / Personnel Officer",
        timestamp: new Date().toISOString(),
        agent: "HQ Material Checklist Registry"
      }).catch(console.error);
      toast.success("Checklist row updated successfully!");
    } else {
      // Check duplicated ID
      if (part2Template.some(f => f.id === customId)) {
        toast.error(`Identifier ID "${customId}" already exists. Please choose a different unique ID.`);
        return;
      }
      // Add
      addPart2TemplateField({
        id: customId,
        label: label.trim(),
        isSubField,
      });
      addDoc(collection(db, "audit_logs"), {
        type: "CHECKLIST_UPDATE",
        action: `Added new checklist row: "${label.trim()}" (ID: ${customId})`,
        details: { customId, label: label.trim(), isSubField },
        user: "Admin / Personnel Officer",
        timestamp: new Date().toISOString(),
        agent: "HQ Material Checklist Registry"
      }).catch(console.error);
      toast.success("New checklist row added successfully!");
    }
    handleCloseForm();
  };

  const handleDelete = (id: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete checklist row "${label}"? This action synced automatically in Firestore.`)) {
      deletePart2TemplateField(id);
      addDoc(collection(db, "audit_logs"), {
        type: "CHECKLIST_UPDATE",
        action: `Deleted checklist row: "${label}" (ID: ${id})`,
        details: { id, label },
        user: "Admin / Personnel Officer",
        timestamp: new Date().toISOString(),
        agent: "HQ Material Checklist Registry"
      }).catch(console.error);
      toast.success("Checklist row deleted successfully!");
    }
  };

  // Reordering functions
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...part2Template];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    reorderPart2TemplateFields(reordered);
    toast.success("Row order updated");
  };

  const handleMoveDown = (index: number) => {
    if (index === part2Template.length - 1) return;
    const reordered = [...part2Template];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    reorderPart2TemplateFields(reordered);
    toast.success("Row order updated");
  };

  // Filter template list
  const filteredTemplate = part2Template.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden" id="checklist_manager_container">
      {/* Header Panel */}
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <List className="w-5 h-5 text-indigo-600" />
            Checklist Management Control Panel
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Build, edit, delete, and reorder all rows of the HQ Material checklist. Changes update live in the active cases.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition shadow-sm hover:shadow"
          id="add_new_checklist_btn"
        >
          <Plus className="w-4 h-4" />
          Add Checklist Row
        </button>
      </div>

      {/* Info Notice details */}
      <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <strong>Important Configuration Advisory:</strong> Adding or editing checklist items here will dynamically populate and restructure the <strong>Checklist index & form</strong> instantly. If you customize key identifiers like <code className="bg-amber-100 px-1 py-0.5 rounded">p2_17_a</code>, ensure any conditional rules (e.g., auto-filling NA fields) align with the parent targets.
        </div>
      </div>

      {/* Grid Container */}
      <div className="p-6">
        {/* Search tool */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search checklist row label or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Modal / Inline Add-Edit form */}
        {isFormOpen && (
          <div className="mb-6 p-6 border-2 border-indigo-100 rounded-lg bg-indigo-50/50" id="checklist_form_editor">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                {editingId ? "Edit Checklist Item Properties" : "Create New Checklist Item Row"}
              </h3>
              <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identifier / Target ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="e.g. p2_31"
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Unique internal identifier. For sub-fields, usually appended with letters (e.g. <code className="bg-slate-100 px-1 py-0.2 rounded">p2_9_b</code>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Label/Task Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. 31 (a) Whether any administrative orders have been parsed..."
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk_is_sub_field"
                  checked={isSubField}
                  onChange={(e) => setIsSubField(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="chk_is_sub_field" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Is Sub-Field? (Indents under standard main rows)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List of row definitions */}
        {filteredTemplate.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No checklist items matches your search query.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-xs font-semibold border-b border-slate-200">
                  <th className="p-3 text-center w-12">No.</th>
                  <th className="p-3 w-28">Identifier ID</th>
                  <th className="p-3">Label Text</th>
                  <th className="p-3 w-28 text-center">Type</th>
                  <th className="p-3 w-56 text-center">Actions / Reordering</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredTemplate.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/50 transition ${item.isSubField ? "bg-indigo-50/10" : ""}`}
                  >
                    <td className="p-3 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="p-3">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[11px] font-bold">
                        {item.id}
                      </span>
                    </td>
                    <td className={`p-3 font-medium leading-relaxed ${item.isSubField ? "pl-8 text-slate-500 border-l-[3px] border-indigo-200" : "text-slate-800 font-semibold"}`}>
                      {item.label}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.isSubField ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {item.isSubField ? "Sub-Field" : "Main Field"}
                      </span>
                    </td>
                    <td className="p-3 flex items-center justify-center gap-1.5">
                      {/* Reordering */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move Row Up"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === part2Template.length - 1}
                        title="Move Row Down"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Editing */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Row"
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded ml-2"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Deleting */}
                      <button
                        onClick={() => handleDelete(item.id, item.label)}
                        title="Delete Row"
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
