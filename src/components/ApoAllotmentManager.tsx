import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  RefreshCw, 
  Layers, 
  Award, 
  Users, 
  GitFork, 
  Briefcase 
} from "lucide-react";
import { toast } from "sonner";
import { ApoWorkAllotment } from "../types";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";

const PREDEFINED_DEPTS = [
  {
    name: "E/ENGINEERING CADRE AND BILL OF KATIHAR DIVISION",
    titleEn: "E/ENGINEERING CADRE AND BILL OF KATIHAR DIVISION",
    titleHi: "(इंजीनियरिंग कैडर और बिल)",
    desc: "All work related to Engineering Cadre & Bill processing.",
  },
  {
    name: "E/MEDICAL CADRE AND BILL OF KATIHAR DIVISION",
    titleEn: "E/MEDICAL CADRE AND BILL OF KATIHAR DIVISION",
    titleHi: "(मेडिकल कैडर और बिल)",
    desc: "All work related to Medical Cadre & Bill processing.",
  },
  {
    name: "COURT CELL",
    titleEn: "COURT CELL",
    titleHi: "(कोर्ट सेल)",
    desc: "All court cases, legal matters and related correspondence.",
  },
  {
    name: "COORDINATION WITH SECURITY",
    titleEn: "COORDINATION WITH SECURITY",
    titleHi: "(सुरक्षा समन्वय)",
    desc: "Coordination & liaison with Security Departments.",
  },
  {
    name: "ACCOUNTS AND SOTES DEPTT. OF KIR DIVISION",
    titleEn: "ACCOUNTS AND SOTES DEPTT. OF KIR DIVISION",
    titleHi: "(लेखा एवं स्टोर विभाग)",
    desc: "All accounts related work & SOIEs department tasks.",
  },
  {
    name: "GENERATION OF UMID CARD",
    titleEn: "GENERATION OF UMID CARD",
    titleHi: "(यूएमआईडी कार्ड जनरेशन)",
    desc: "Generation, verification and coordination of UMID Cards.",
  },
  {
    name: "E/COMPLAINT",
    titleEn: "E/COMPLAINT",
    titleHi: "(शिकायत निवारण)",
    desc: "Handling employee complaints and ensuring timely redressal.",
  },
  {
    name: "NIRAKARAN CELL (CPGRAMS) VIP REFERENCE ETC.",
    titleEn: "NIRAKARAN CELL (CPGRAMS) VIP REFERENCE ETC.",
    titleHi: "(निराकरण सेल - CPGRAMS)",
    desc: "CPGRAMS, VIP references and grievance redressal related work.",
  },
  {
    name: "E/DAR CELL OF KIR DIV.",
    titleEn: "E/DAR CELL OF KIR DIV.",
    titleHi: "(डीएआर सेल)",
    desc: "DAR cases processing and related correspondence.",
  },
  {
    name: "RTI CELL",
    titleEn: "RTI CELL",
    titleHi: "(आरटीआई सेल)",
    desc: "All application processing under the Right to Information Act.",
  },
  {
    name: "ANY OTHER ALLOTTED WORKING AREAS OR WELFARE WORKS",
    titleEn: "ANY OTHER ALLOTTED WORKING AREAS OR WELFARE WORKS",
    titleHi: "(अन्य आवंटित कार्य एवं कल्याणकारी कार्य)",
    desc: "All non-predefined administrative works and welfare items.",
  },
];

export function ApoAllotmentManager() {
  const apoWorkAllotments = useStore((state) => state.apoWorkAllotments || []);
  const addApoAllotment = useStore((state) => state.addApoAllotment);
  const updateApoAllotment = useStore((state) => state.updateApoAllotment);
  const deleteApoAllotment = useStore((state) => state.deleteApoAllotment);
  const config = useStore((state) => state.config);
  const updateConfig = useStore((state) => state.updateConfig);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Department card customization states
  const [customDepts, setCustomDepts] = useState<Record<string, { titleEn?: string; titleHi?: string; desc?: string }>>({});
  const [selectedDeptToCustomize, setSelectedDeptToCustomize] = useState<string>("");
  const [customDeptTitleEn, setCustomDeptTitleEn] = useState<string>("");
  const [customDeptTitleHi, setCustomDeptTitleHi] = useState<string>("");
  const [customDeptDesc, setCustomDeptDesc] = useState<string>("");
  const [isSavingCustomDept, setIsSavingCustomDept] = useState<boolean>(false);

  // Department Employees/Staff Management State
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedApoIdForStaff, setSelectedApoIdForStaff] = useState<string>("");
  const [selectedDeptForStaff, setSelectedDeptForStaff] = useState<string>("");

  // Staff Form State
  const [staffName, setStaffName] = useState("");
  const [staffDesignation, setStaffDesignation] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffParentId, setStaffParentId] = useState("");
  const [staffOrder, setStaffOrder] = useState(1);
  const [staffWork, setStaffWork] = useState("");
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // Fetch all allotted employees in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "apo_allotted_employees"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setEmployees(list);
    }, (err) => {
      console.error("Error loading allotted employees:", err);
    });
    return () => unsub();
  }, []);

  // Fetch all department customizations in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "settings"), (snap) => {
      const customizations: Record<string, any> = {};
      snap.forEach((doc) => {
        if (doc.id.startsWith("apo_dept_")) {
          const deptKey = doc.id.replace("apo_dept_", "");
          customizations[deptKey] = doc.data();
        }
      });
      setCustomDepts(customizations);
    }, (err) => {
      console.error("Error loading department customizations:", err);
    });
    return () => unsub();
  }, []);

  // When selected department changes, load its default or existing customized values
  useEffect(() => {
    if (selectedDeptToCustomize) {
      const defaultInfo = PREDEFINED_DEPTS.find(d => d.name === selectedDeptToCustomize);
      const key = selectedDeptToCustomize.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const saved = customDepts[key];
      if (defaultInfo) {
        setCustomDeptTitleEn(saved?.titleEn || defaultInfo.titleEn);
        setCustomDeptTitleHi(saved?.titleHi || defaultInfo.titleHi);
        setCustomDeptDesc(saved?.desc || defaultInfo.desc);
      }
    } else {
      setCustomDeptTitleEn("");
      setCustomDeptTitleHi("");
      setCustomDeptDesc("");
    }
  }, [selectedDeptToCustomize, customDepts]);

  const handleSaveCustomDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptToCustomize) {
      toast.error("Please select a department/section to customize");
      return;
    }
    if (!customDeptTitleEn.trim() || !customDeptDesc.trim()) {
      toast.error("English Title and Description are required.");
      return;
    }

    setIsSavingCustomDept(true);
    const key = selectedDeptToCustomize.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const docKey = "apo_dept_" + key;

    try {
      await setDoc(doc(db, "settings", docKey), {
        titleEn: customDeptTitleEn.trim(),
        titleHi: customDeptTitleHi.trim(),
        desc: customDeptDesc.trim(),
      });

      addDoc(collection(db, "audit_logs"), {
        type: "APO_ALLOTMENT",
        action: `Customized Department Box configuration: ${selectedDeptToCustomize}`,
        details: { titleEn: customDeptTitleEn.trim(), titleHi: customDeptTitleHi.trim(), desc: customDeptDesc.trim() },
        user: "Admin / Personnel Officer",
        timestamp: new Date().toISOString(),
        agent: "APO Registry Central Link"
      }).catch(console.error);

      toast.success("Department Box details customized successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save department customization details: " + err.message);
    } finally {
      setIsSavingCustomDept(false);
    }
  };

  // Sync first APO and department for staff management form
  useEffect(() => {
    if (apoWorkAllotments.length > 0 && !selectedApoIdForStaff) {
      setSelectedApoIdForStaff(apoWorkAllotments[0].id);
    }
  }, [apoWorkAllotments, selectedApoIdForStaff]);

  useEffect(() => {
    if (selectedApoIdForStaff) {
      const activeApo = apoWorkAllotments.find(a => a.id === selectedApoIdForStaff);
      if (activeApo && activeApo.departments.length > 0) {
        setSelectedDeptForStaff(activeApo.departments[0]);
      } else {
        setSelectedDeptForStaff("");
      }
    }
  }, [selectedApoIdForStaff, apoWorkAllotments]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApoIdForStaff) {
      toast.error("Please select an APO Officer");
      return;
    }
    if (!selectedDeptForStaff) {
      toast.error("Please select a Department/Section");
      return;
    }
    if (!staffName.trim() || !staffDesignation.trim()) {
      toast.error("Staff Name and Designation are required.");
      return;
    }

    setIsSavingStaff(true);
    const empId = `emp_${Date.now()}`;
    const payload = {
      id: empId,
      apoId: selectedApoIdForStaff,
      department: selectedDeptForStaff,
      employeeName: staffName.trim(),
      designation: staffDesignation.trim(),
      contactPhone: staffPhone.trim(),
      parentEmployeeId: staffParentId || "",
      order: Number(staffOrder) || 1,
      work: staffWork.trim(),
    };

    try {
      await setDoc(doc(db, "apo_allotted_employees", empId), payload);
      toast.success(`Registered ${staffName} successfully under ${selectedDeptForStaff}!`);
      setStaffName("");
      setStaffDesignation("");
      setStaffPhone("");
      setStaffParentId("");
      setStaffWork("");
      setStaffOrder(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to register staff record: " + err.message);
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (empId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this department?`)) return;
    try {
      await deleteDoc(doc(db, "apo_allotted_employees", empId));
      toast.success(`Removed staff member ${name}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete staff record.");
    }
  };

  const activeApoForStaffForm = apoWorkAllotments.find(a => a.id === selectedApoIdForStaff);
  const activeApoDepts = activeApoForStaffForm ? activeApoForStaffForm.departments : [];

  const filteredEmployeesForSelection = employees.filter(
    emp => emp.apoId === selectedApoIdForStaff && emp.department === selectedDeptForStaff
  ).sort((a, b) => a.order - b.order);

  // Sr. DPO fields
  const [srDpoNameEn, setSrDpoNameEn] = useState(config?.srDpoNameEn || "");
  const [srDpoNameHi, setSrDpoNameHi] = useState(config?.srDpoNameHi || "");
  const [srDpoDesignationEn, setSrDpoDesignationEn] = useState(config?.srDpoDesignationEn || "");
  const [srDpoDesignationHi, setSrDpoDesignationHi] = useState(config?.srDpoDesignationHi || "");
  const [srDpoWork1En, setSrDpoWork1En] = useState(config?.srDpoWork1En || "");
  const [srDpoWork1Hi, setSrDpoWork1Hi] = useState(config?.srDpoWork1Hi || "");
  const [srDpoWork2En, setSrDpoWork2En] = useState(config?.srDpoWork2En || "");
  const [srDpoWork2Hi, setSrDpoWork2Hi] = useState(config?.srDpoWork2Hi || "");
  const [srDpoNoteEn, setSrDpoNoteEn] = useState(config?.srDpoNoteEn || "");
  const [srDpoNoteHi, setSrDpoNoteHi] = useState(config?.srDpoNoteHi || "");
  const [apoWorkAllotmentPdfUrl, setApoWorkAllotmentPdfUrl] = useState(config?.apoWorkAllotmentPdfUrl || "");

  // Sync when config loads
  useEffect(() => {
    if (config) {
      setSrDpoNameEn(config.srDpoNameEn || "");
      setSrDpoNameHi(config.srDpoNameHi || "");
      setSrDpoDesignationEn(config.srDpoDesignationEn || "");
      setSrDpoDesignationHi(config.srDpoDesignationHi || "");
      setSrDpoWork1En(config.srDpoWork1En || "");
      setSrDpoWork1Hi(config.srDpoWork1Hi || "");
      setSrDpoWork2En(config.srDpoWork2En || "");
      setSrDpoWork2Hi(config.srDpoWork2Hi || "");
      setSrDpoNoteEn(config.srDpoNoteEn || "");
      setSrDpoNoteHi(config.srDpoNoteHi || "");
      setApoWorkAllotmentPdfUrl(config.apoWorkAllotmentPdfUrl || "");
    }
  }, [config]);

  const handleSaveSrDpo = () => {
    updateConfig("srDpoNameEn", srDpoNameEn);
    updateConfig("srDpoNameHi", srDpoNameHi);
    updateConfig("srDpoDesignationEn", srDpoDesignationEn);
    updateConfig("srDpoDesignationHi", srDpoDesignationHi);
    updateConfig("srDpoWork1En", srDpoWork1En);
    updateConfig("srDpoWork1Hi", srDpoWork1Hi);
    updateConfig("srDpoWork2En", srDpoWork2En);
    updateConfig("srDpoWork2Hi", srDpoWork2Hi);
    updateConfig("srDpoNoteEn", srDpoNoteEn);
    updateConfig("srDpoNoteHi", srDpoNoteHi);
    updateConfig("apoWorkAllotmentPdfUrl", apoWorkAllotmentPdfUrl);
    
    addDoc(collection(db, "audit_logs"), {
      type: "APO_ALLOTMENT",
      action: `Modified Sr. DPO core credentials profile & work allotments: ${srDpoNameEn}`,
      details: { 
        srDpoNameEn, 
        srDpoNameHi, 
        srDpoDesignationEn, 
        srDpoDesignationHi,
        srDpoWork1En,
        srDpoWork1Hi,
        srDpoWork2En,
        srDpoWork2Hi,
        srDpoNoteEn,
        srDpoNoteHi,
        apoWorkAllotmentPdfUrl
      },
      user: "Admin / Personnel Officer",
      timestamp: new Date().toISOString(),
      agent: "APO Registry Central Link"
    }).catch(console.error);

    toast.success("Senior Divisional Personnel Officer (Sr. DPO) credentials and work allotments updated!");
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

    const departments = deptInput.includes(";")
      ? deptInput.split(";").map((d) => d.trim()).filter((d) => d.length > 0)
      : deptInput.split(",").map((d) => d.trim()).filter((d) => d.length > 0);

    addApoAllotment({
      name: name.trim(),
      designation: designation.trim(),
      departments,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      order: Number(order) || 1,
    });

    addDoc(collection(db, "audit_logs"), {
      type: "APO_ALLOTMENT",
      action: `Allotted new APO Work profile: ${name.trim()} (${designation.trim()})`,
      details: { name: name.trim(), designation: designation.trim(), departments },
      user: "Admin / Personnel Officer",
      timestamp: new Date().toISOString(),
      agent: "APO Registry Central Link"
    }).catch(console.error);

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
    const hasComma = apo.departments.some(d => d.includes(","));
    setEditDeptInput(apo.departments.join(hasComma ? "; " : ", "));
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

    const departments = editDeptInput.includes(";")
      ? editDeptInput.split(";").map((d) => d.trim()).filter((d) => d.length > 0)
      : editDeptInput.split(",").map((d) => d.trim()).filter((d) => d.length > 0);

    updateApoAllotment(id, {
      name: editName.trim(),
      designation: editDesignation.trim(),
      departments,
      contactEmail: editContactEmail.trim() || undefined,
      contactPhone: editContactPhone.trim() || undefined,
      order: Number(editOrder) || 1,
    });

    addDoc(collection(db, "audit_logs"), {
      type: "APO_ALLOTMENT",
      action: `Updated APO Work details for: ${editName.trim()} (${editDesignation.trim()})`,
      details: { id, name: editName.trim(), designation: editDesignation.trim(), departments },
      user: "Admin / Personnel Officer",
      timestamp: new Date().toISOString(),
      agent: "APO Registry Central Link"
    }).catch(console.error);

    toast.success("APO details updated successfully");
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const target = apoWorkAllotments.find(a => a.id === id);
    if (window.confirm("Are you sure you want to delete this APO work allotment entry?")) {
      deleteApoAllotment(id);
      addDoc(collection(db, "audit_logs"), {
        type: "APO_ALLOTMENT",
        action: `Removed APO entry from registry: ${target ? target.name : id}`,
        details: { id, name: target?.name, designation: target?.designation },
        user: "Admin / Personnel Officer",
        timestamp: new Date().toISOString(),
        agent: "APO Registry Central Link"
      }).catch(console.error);
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

          <div className="md:col-span-2 border-t border-slate-100 pt-3">
            <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-2">
              💼 Allotted Work Details (कार्य आवंटन विवरण)
            </h4>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Work Allotment 1 (English)
            </label>
            <textarea
              rows={2}
              value={srDpoWork1En}
              onChange={(e) => setSrDpoWork1En(e.target.value)}
              placeholder="e.g. Overall Supervision, Personnel Administration & Establishment matters of Division"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 font-hindi">
              Work Allotment 1 (Hindi / कार्य आवंटन 1)
            </label>
            <textarea
              rows={2}
              value={srDpoWork1Hi}
              onChange={(e) => setSrDpoWork1Hi(e.target.value)}
              placeholder="e.g. मंडल के कार्मिक प्रशासन, स्थापना मामलों और नीतिगत निर्णयों का समग्र पर्यवेक्षण"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Work Allotment 2 (English)
            </label>
            <textarea
              rows={2}
              value={srDpoWork2En}
              onChange={(e) => setSrDpoWork2En(e.target.value)}
              placeholder="e.g. Final Appellate Authority, Budget Allocation & Inter-Departmental Coordination"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 font-hindi">
              Work Allotment 2 (Hindi / कार्य आवंटन 2)
            </label>
            <textarea
              rows={2}
              value={srDpoWork2Hi}
              onChange={(e) => setSrDpoWork2Hi(e.target.value)}
              placeholder="e.g. अंतिम अपीलीय प्राधिकारी, बजट आवंटन और अंतर-विभागीय समन्वय"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2 border-t border-slate-100 pt-3">
            <h4 className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2">
              📝 Notes / Special Instructions (विशेष निर्देश / टिप्पणी)
            </h4>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Special Note (English)
            </label>
            <textarea
              rows={2}
              value={srDpoNoteEn}
              onChange={(e) => setSrDpoNoteEn(e.target.value)}
              placeholder="e.g. All files and dynamic allotments are routed under Sr. DPO supervision."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 font-hindi">
              Special Note (Hindi / टिप्पणी)
            </label>
            <textarea
              rows={2}
              value={srDpoNoteHi}
              onChange={(e) => setSrDpoNoteHi(e.target.value)}
              placeholder="e.g. सभी फाइल संचलन वरिष्ठ मंडल कार्मिक अधिकारी के पर्यवेक्षण में संचालित होते हैं।"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2 border-t border-slate-100 pt-3">
            <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider mb-2">
              📂 Official Work Allotment Document (आधिकारिक कार्य आवंटन पीडीएफ)
            </h4>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Work Allotment PDF Link (ऑफ़लाइन कार्य आवंटन पीडीएफ लिंक)
            </label>
            <input
              type="text"
              value={apoWorkAllotmentPdfUrl}
              onChange={(e) => setApoWorkAllotmentPdfUrl(e.target.value)}
              placeholder="e.g. https://example.com/allotment.pdf"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Add the URL link to the official offline PDF here. A download button will appear on the public page for staff to access the official document.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Link Officer Arrangement Sequence Map */}
      <div className="bg-[#050f24] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-violet-400">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm tracking-wide uppercase">
                🔄 Routine Link Officer Sequence Map (लिंक व्यवस्था अनुक्रम)
              </h3>
              <p className="text-xs text-slate-400">
                Configure who looks after which APO's files and departments when they are absent/on leave. Select directly from the dropdown.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(() => {
            const apoList = apoWorkAllotments.length > 0 ? apoWorkAllotments : [
              { id: "fallback-apo1", name: "SHRI PRAVEEN KUMAR KARN", designation: "APO/I/KIR" },
              { id: "fallback-apo2", name: "Shri Lalit Kumar", designation: "APO 11" },
              { id: "fallback-apo3", name: "Shri Santosh Kumar Dutta", designation: "APO-II" }
            ];

            return apoList.map((apo) => {
              const current1st = config[`link_1st_${apo.id}`] || "";
              const current2nd = config[`link_2nd_${apo.id}`] || "";

              // Exclude current apo from alternate options
              const alternateOptions = apoList.filter(a => a.id !== apo.id);

              return (
                <div key={apo.id} className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl shadow-xs space-y-3">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black text-rose-400 bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                      IF ABSENT
                    </span>
                    <h4 className="font-extrabold text-slate-100 text-sm mt-1 truncate">
                      {apo.name}
                    </h4>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                      {apo.designation}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        1st Alternate Link Officer
                      </label>
                      <select
                        value={current1st}
                        onChange={(e) => updateConfig(`link_1st_${apo.id}`, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-700 rounded-lg text-xs bg-slate-950 text-slate-200 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      >
                        <option value="">-- Default / Cyclic --</option>
                        {alternateOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.designation} ({opt.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        2nd Alternate Link Officer
                      </label>
                      <select
                        value={current2nd}
                        onChange={(e) => updateConfig(`link_2nd_${apo.id}`, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-700 rounded-lg text-xs bg-slate-950 text-slate-200 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      >
                        <option value="">-- Default / Cyclic --</option>
                        {alternateOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.designation} ({opt.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
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
              Work Allotments / Supervised Departments * (Separate with commas or semicolons)
            </label>
            <textarea
              placeholder="e.g. Mechanical Department, Electrical Branch, S&T Section; Staff, Welfare & Grievance Cell; Bill Section"
              rows={3}
              value={deptInput}
              onChange={(e) => setDeptInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              required
            ></textarea>
            <span className="text-[11px] text-gray-400 mt-1 block leading-relaxed">
              Enter each branch or description separated by commas. <strong className="text-indigo-600 font-semibold">Note: If you want to use a comma inside a single department name (e.g. "Staff, Welfare & Grievance"), separate all departments with a semicolon (`;`) instead!</strong>
              <br />
              (यदि किसी एक विभाग के नाम में comma (,) का उपयोग करना हो, तो सभी विभागों को semicolon (;) से अलग करें!)
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
                          Handled Departments / Allotments (Comma or Semicolon separated)
                        </label>
                        <textarea
                          rows={3}
                          value={editDeptInput}
                          onChange={(e) => setEditDeptInput(e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          placeholder="If using commas inside a department name, separate different departments with semicolons (;)"
                          required
                        ></textarea>
                        <span className="text-[10px] text-gray-400 mt-1 block leading-tight">
                          Use semicolon (`;`) to separate departments if any department name contains a comma.
                          (यदि किसी विभाग के नाम में comma है, तो semicolon (;) का उपयोग करें।)
                        </span>
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

      {/* Brand New Department Staff Registry Management Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-violet-700">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">
              👥 Department Staff & Hierarchy Registry
            </h3>
            <p className="text-xs text-slate-500">
              Assign staff employees, configure their contact details, and map reporting levels for each allotted branch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Active Staff & Form */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleAddStaff} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Plus size={14} className="text-violet-600" />
                Add / Assign Staff Employee
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Select APO Officer *
                  </label>
                  <select
                    value={selectedApoIdForStaff}
                    onChange={(e) => setSelectedApoIdForStaff(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  >
                    <option value="" disabled>-- Select APO Officer --</option>
                    {apoWorkAllotments.map(apo => (
                      <option key={apo.id} value={apo.id}>{apo.designation} - {apo.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Select Allotted Section / Dept *
                  </label>
                  <select
                    value={selectedDeptForStaff}
                    onChange={(e) => setSelectedDeptForStaff(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                    disabled={!selectedApoIdForStaff}
                  >
                    <option value="" disabled>-- Select Department/Section --</option>
                    {activeApoDepts.map((d, idx) => (
                      <option key={idx} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Employee Name *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Sri Ramesh Prasad"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Designation *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Briefcase size={14} />
                    </span>
                    <input
                      type="text"
                      value={staffDesignation}
                      onChange={(e) => setStaffDesignation(e.target.value)}
                      placeholder="e.g. Chief OS, Sr. Clerk, OS"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Contact Phone / Mobile No.
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone size={14} />
                    </span>
                    <input
                      type="text"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="e.g. 9771441604 / Rly 94120"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Reports Under / Incharge Person
                  </label>
                  <select
                    value={staffParentId}
                    onChange={(e) => setStaffParentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">-- None (Top Level in Section) --</option>
                    {filteredEmployeesForSelection.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.employeeName} ({emp.designation})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Hierarchy Order (Priority Serial e.g. 1, 2)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={staffOrder}
                    onChange={(e) => setStaffOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Allocated Work Description / Duties (प्रदत्त कार्य विवरण, जैसे: Deals with Bills, Pass, Section Incharge etc.)
                  </label>
                  <textarea
                    rows={2}
                    value={staffWork}
                    onChange={(e) => setStaffWork(e.target.value)}
                    placeholder="e.g. Dealing with PF/GIS/D&A, Settlement, Bill processing, Pass/PTO section incharge, etc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200/55">
                <button
                  type="submit"
                  disabled={isSavingStaff}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-400 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all active:translate-y-[1px] shadow-sm cursor-pointer"
                >
                  <Save size={13} />
                  {isSavingStaff ? "Saving..." : "Add Staff to Section"}
                </button>
              </div>
            </form>
          </div>

          {/* Column 3: Existing Section Employees list representation */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <GitFork size={14} className="text-violet-600" />
              Current Staff Tree ({filteredEmployeesForSelection.length})
            </h4>

            {filteredEmployeesForSelection.length === 0 ? (
              <div className="text-center py-10 bg-white border border-dashed rounded-lg">
                <p className="text-slate-400 text-xs font-medium">No personnel defined yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Select APO & Dept then fill the registry form</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredEmployeesForSelection.map((emp) => {
                  const parentEmp = filteredEmployeesForSelection.find(pe => pe.id === emp.parentEmployeeId);
                  return (
                    <div key={emp.id} className="p-3 bg-white border border-slate-200/85 rounded-lg flex items-start justify-between gap-2 shadow-xs group/item hover:border-violet-300">
                      <div className="space-y-1">
                        <div className="font-extrabold text-[13px] text-slate-800 leading-tight">
                          {emp.employeeName}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500">
                          {emp.designation} <span className="text-[10px] text-slate-400 font-mono">Order: {emp.order}</span>
                        </div>
                        {emp.contactPhone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Phone size={10} />
                            {emp.contactPhone}
                          </div>
                        )}
                        {emp.work && (
                          <div className="text-[10px] text-slate-600 bg-slate-100 rounded px-1.5 py-0.5 mt-1 block max-w-full truncate font-medium">
                            🔧 {emp.work}
                          </div>
                        )}
                        {parentEmp && (
                          <div className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/40 inline-flex items-center gap-1">
                            <GitFork size={9} />
                            Under: {parentEmp.employeeName}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(emp.id, emp.employeeName)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        title="Delete Staff"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand New Department Box Customizer Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-550/20 flex items-center justify-center text-amber-700">
            <Edit size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">
              🎨 Predefined Department Box Customizer (11 Branches)
            </h3>
            <p className="text-xs text-slate-500">
              Customize English/Hindi titles and descriptions of the 11 predefined main department cards displayed on the public dashboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCustomDept} className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Select Department Box to Customize *
              </label>
              <select
                value={selectedDeptToCustomize}
                onChange={(e) => setSelectedDeptToCustomize(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                required
              >
                <option value="" disabled>-- Select a Department --</option>
                {PREDEFINED_DEPTS.map((dept, i) => (
                  <option key={i} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            {selectedDeptToCustomize && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Display Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customDeptTitleEn}
                    onChange={(e) => setCustomDeptTitleEn(e.target.value)}
                    placeholder="e.g. ELECTRICAL SECTION AND BILL DETAILS"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1 font-hindi">
                    विवरण शीर्षक (Hindi / हिंदी)
                  </label>
                  <input
                    type="text"
                    value={customDeptTitleHi}
                    onChange={(e) => setCustomDeptTitleHi(e.target.value)}
                    placeholder="जैसे: (विद्युत अनुभाग एवं बिल विवरण)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 HindiInput font-medium"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Box Description details *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={customDeptDesc}
                    onChange={(e) => setCustomDeptDesc(e.target.value)}
                    placeholder="Write a brief overview of what this section handles..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </>
            )}
          </div>

          {selectedDeptToCustomize && (
            <div className="flex justify-end pt-3 border-t border-slate-200/60">
              <button
                type="submit"
                disabled={isSavingCustomDept}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-505 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 disabled:bg-slate-400 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-all active:translate-y-[1px] shadow-sm cursor-pointer uppercase tracking-wider"
                style={{ backgroundColor: "#d97706" }}
              >
                <Save size={14} />
                {isSavingCustomDept ? "Saving Overrides..." : "Save Card Customization"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

