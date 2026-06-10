import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { Plus, Trash2, Edit, Save, X, Check, Globe, RefreshCw, Layers, Compass, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export interface OrgNode {
  id: string;
  nameEn: string;
  nameHi: string;
  type: "division" | "workshop";
  x: number;
  y: number;
  stateEn: string;
  stateHi: string;
  drmEn: string;
  drmHi: string;
  detailsEn: string[];
  detailsHi: string[];
  customHighlight?: boolean;
  googleMapQuery: string;
  coordinatesText: string;
}

const DEFAULT_ORG_NODES: OrgNode[] = [
  {
    id: "hq_maligaon",
    nameEn: "NFR Headquarters (Maligaon)",
    nameHi: "पूसीर मुख्यालय (मालीगांव)",
    type: "division",
    x: 64,
    y: 44,
    stateEn: "Assam",
    stateHi: "असम",
    drmEn: "General Manager (GM NFR)",
    drmHi: "महाप्रबंधक (GM NFR)",
    googleMapQuery: "Northeast Frontier Railway Headquarters Maligaon Guwahati",
    coordinatesText: "26.1554° N, 91.6882° E",
    detailsEn: [
      "Apex administrative Headquarters of Northeast Frontier Railway",
      "Coordinates all 5 divisions and core workshops",
      "Central ACT Apprentice selection and processing board"
    ],
    detailsHi: [
      "पूर्वोत्तर सीमांत रेलवे का शीर्ष प्रशासनिक मुख्यालय",
      "सभी 5 मंडलों और मुख्य कार्यशालाओं का समन्वय करता है",
      "केंद्रीय अधिनियम शिक्षु चयन और प्रसंस्करण बोर्ड"
    ]
  },
  {
    id: "kir",
    nameEn: "Katihar (KIR) Division",
    nameHi: "कटिहार (KIR) मंडल",
    type: "division",
    x: 15,
    y: 65,
    stateEn: "Bihar / West Bengal",
    stateHi: "बिहार / पश्चिम बंगाल",
    drmEn: "Divisional Railway Manager (DRM KIR)",
    drmHi: "मंडल रेल प्रबंधक (DRM KIR)",
    customHighlight: true,
    googleMapQuery: "DRM Office Katihar Personnel Branch Bihar",
    coordinatesText: "25.5392° N, 87.5684° E",
    detailsEn: [
      "Personnel Branch (APPRENTICE CELL) - HIGHLIGHTED",
      "Katihar Diesel Locomotive Shed",
      "New Jalpaiguri Carriage & Wagon Depot",
      "Siliguri Diesel Shed & Yard",
      "Engaged in intensive apprentice training programs"
    ],
    detailsHi: [
      "कार्मिक शाखा (शिक्षु सेल) - विशेष रूप से हाइलाइटेड",
      "कटिहार डीजल लोकोमोटिव शेड",
      "न्यू जलपाईगुड़ी कैरिज और वैगन डिपो",
      "सिलीगुड़ी डीजल शेड और यार्ड",
      "गहन शिक्षु प्रशिक्षण कार्यक्रमों में संलग्न"
    ]
  },
  {
    id: "apdj",
    nameEn: "Alipurduar (APDJ) Division",
    nameHi: "अलीपुरद्वार (APDJ) मंडल",
    type: "division",
    x: 35,
    y: 45,
    stateEn: "West Bengal",
    stateHi: "पश्चिम बंगाल",
    drmEn: "Divisional Railway Manager (DRM APDJ)",
    drmHi: "मंडल रेल प्रबंधक (DRM अलीपुरद्वार)",
    googleMapQuery: "DRM Office Alipurduar Junction West Bengal",
    coordinatesText: "26.4912° N, 89.5255° E",
    detailsEn: [
      "Crucial forest-fringe scenic routes",
      "C&W depots for North Bengal routing",
      "Major tourist connectivity lines"
    ],
    detailsHi: [
      "महत्वपूर्ण वन-किनारे दर्शनीय मार्ग",
      "उत्तर बंगाल रूटिंग के लिए सी एंड डब्ल्यू डिपो",
      "प्रमुख पर्यटक संपर्क लाइनें"
    ]
  },
  {
    id: "tindharia_ws",
    nameEn: "Tindharia Workshop (TDH)",
    nameHi: "तिंधारिया कार्यशाला (TDH)",
    type: "workshop",
    x: 23,
    y: 52,
    stateEn: "West Bengal",
    stateHi: "पश्चिम बंगाल",
    drmEn: "Chief Workshop Manager (DHR)",
    drmHi: "मुख्य कार्यशाला प्रबंधक (DHR)",
    googleMapQuery: "Tindharia Railway Workshop West Bengal",
    coordinatesText: "26.8519° N, 88.3377° E",
    detailsEn: [
      "Narrow Gauge steam locomotive repairs",
      "World Heritage Darjeeling Himalayan Railway (DHR) Workshop",
      "Maintains classic 19th-century steam engines",
      "Highly specialized heritage restoration center"
    ],
    detailsHi: [
      "नैरोगेज स्टीम लोकोमोटिव मरम्मत",
      "विश्व धरोहर दार्जिलिंग हिमालयन रेलवे (DHR) कार्यशाला",
      "क्लासिक 19वीं सदी के स्टीम इंजनों का रखरखाव",
      "अत्यधिक विशिष्ट विरासत बहाली केंद्र"
    ]
  },
  {
    id: "nbq_ws",
    nameEn: "New Bongaigaon Workshop (NBQ)",
    nameHi: "न्यू बोंगाईगांव कार्यशाला (NBQ)",
    type: "workshop",
    x: 50,
    y: 35,
    stateEn: "Assam",
    stateHi: "असम",
    drmEn: "Chief Workshop Manager (CWM NBQ)",
    drmHi: "मुख्य कार्यशाला प्रबंधक (CWM NBQ)",
    googleMapQuery: "New Bongaigaon Carriage and Wagon Workshop Assam",
    coordinatesText: "26.4027° N, 90.5489° E",
    detailsEn: [
      "Carriage & Wagon Periodic Overhauling (POH)",
      "One of the largest coach repair workshops in Eastern India",
      "High trade apprentice intake center",
      "Advanced welding and machining divisions"
    ],
    detailsHi: [
      "कैरिज और वैगन आवधिक ओवरहॉलिंग (POH)",
      "पूर्वी भारत में सबसे बड़ी कोच मरम्मत कार्यशालाओं में से एक",
      "उच्च ट्रेड शिक्षु प्रवेश केंद्र",
      "उन्नत वेल्डिंग और मशीनिंग डिवीजन"
    ]
  },
  {
    id: "rny",
    nameEn: "Rangiya (RNY) Division",
    nameHi: "रंगिया (RNY) मंडल",
    type: "division",
    x: 60,
    y: 40,
    stateEn: "Assam",
    stateHi: "असम",
    drmEn: "Divisional Railway Manager (DRM RNY)",
    drmHi: "मंडल रेल प्रबंधक (DRM रंगिया)",
    googleMapQuery: "DRM Office Rangiya Assam",
    coordinatesText: "26.4385° N, 91.6163° E",
    detailsEn: [
      "Guwahati Suburbs monitoring",
      "Kamakhya railway hub maintenance yards",
      "Strategic Indo-Bhutan border lines"
    ],
    detailsHi: [
      "गुवाहाटी उपनगरों की निगरानी",
      "कामाख्या रेलवे हब रखरखाव यार्ड",
      "रणनीतिक भारत-भूटान सीमा लाइनें"
    ]
  },
  {
    id: "lmg",
    nameEn: "Lumding (LMG) Division",
    nameHi: "लूमडिंग (LMG) मंडल",
    type: "division",
    x: 75,
    y: 55,
    stateEn: "Assam / Nagaland / Tripura",
    stateHi: "असम / नागालैंड / त्रिपुरा",
    drmEn: "Divisional Railway Manager (DRM LMG)",
    drmHi: "मंडल रेल प्रबंधक (DRM लूमडिंग)",
    googleMapQuery: "DRM Office Lumding Assam",
    coordinatesText: "25.7533° N, 93.1764° E",
    detailsEn: [
      "Hill section network and gauge conversions",
      "Tripura-Agartala strategic connectivity branch",
      "Guwahati Coaching Depot management"
    ],
    detailsHi: [
      "पहाड़ी क्षेत्र का नेटवर्क और गेज परिवर्तन",
      "त्रिपुरा-अगरतला रणनीतिक संपर्क शाखा",
      "गुवाहाटी कोचिंग डिपो प्रबंधन"
    ]
  },
  {
    id: "tsk",
    nameEn: "Tinsukia (TSK) Division",
    nameHi: "तिनसुकिया (TSK) मंडल",
    type: "division",
    x: 93,
    y: 20,
    stateEn: "Assam / Arunachal Pradesh",
    stateHi: "असम / अरुणाचल प्रदेश",
    drmEn: "Divisional Railway Manager (DRM TSK)",
    drmHi: "मंडल रेल प्रबंधक (DRM तिनसुकिया)",
    googleMapQuery: "DRM Office Tinsukia Assam",
    coordinatesText: "27.4891° N, 95.3524° E",
    detailsEn: [
      "Easternmost division of Indian Railways",
      "Ledo coal & oil field connectivity routes",
      "High priority strategic setups"
    ],
    detailsHi: [
      "भारतीय रेल का सबसे पूर्वी मंडल",
      "लेडो कोयला और तेल क्षेत्र कनेक्टिविटी मार्ग",
      "उच्च प्राथमिकता वाले रणनीतिक सेटअप"
    ]
  },
  {
    id: "dbrt_ws",
    nameEn: "Dibrugarh Workshop (DBRT)",
    nameHi: "डिब्रूगढ़ कार्यशाला (DBRT)",
    type: "workshop",
    x: 88,
    y: 25,
    stateEn: "Assam",
    stateHi: "असम",
    drmEn: "Chief Workshop Manager (CWM DBRT)",
    drmHi: "मुख्य कार्यशाला प्रबंधक (CWM DBRT)",
    googleMapQuery: "Dibrugarh Railway Workshop Carriage and Wagon Workshop Assam",
    coordinatesText: "27.4789° N, 94.9123° E",
    detailsEn: [
      "Oldest railway workshop of NFR (Established 1881)",
      "Broad gauge wagon components manufacturing & POH",
      "Active apprentice center for Fitter, Machinist, Electrician trades"
    ],
    detailsHi: [
      "NFR की सबसे पुरानी रेलवे कार्यशाला (स्थापना 1881)",
      "ब्रॉड गेज वैगन घटकों का निर्माण और POH",
      "फिटर, मशीनिस्ट, इलेक्ट्रीशियन ट्रेडों के लिए सक्रिय शिक्षु केंद्र"
    ]
  }
];

export function NfrOrgNodesManager() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Editor states
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form Field States
  const [formId, setFormId] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [type, setType] = useState<"division" | "workshop">("division");
  const [x, setX] = useState(50);
  const [y, setY] = useState(40);
  const [stateEn, setStateEn] = useState("");
  const [stateHi, setStateHi] = useState("");
  const [drmEn, setDrmEn] = useState("");
  const [drmHi, setDrmHi] = useState("");
  const [googleMapQuery, setGoogleMapQuery] = useState("");
  const [coordinatesText, setCoordinatesText] = useState("");
  const [customHighlight, setCustomHighlight] = useState(false);
  const [detailsEnInput, setDetailsEnInput] = useState(""); // newline separated
  const [detailsHiInput, setDetailsHiInput] = useState(""); // newline separated

  useEffect(() => {
    const colRef = collection(db, "nfrOrgNodes");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: OrgNode[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as OrgNode);
        });
        setNodes(list);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error reading NfrOrgNodes:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Seeding of initial defaults if Firestore is empty
  const handleSeedDefaults = async () => {
    setIsSubmitLoading(true);
    try {
      const batch = writeBatch(db);
      DEFAULT_ORG_NODES.forEach((node) => {
        const docRef = doc(db, "nfrOrgNodes", node.id);
        batch.set(docRef, node);
      });
      await batch.commit();
      toast.success("Default NFR Map Nodes populated successfully!");
    } catch (error) {
      console.error("Seeding error:", error);
      toast.error("Failed to seed default nodes: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const startEdit = (node: OrgNode) => {
    setEditingNode(node);
    setFormId(node.id);
    setNameEn(node.nameEn);
    setNameHi(node.nameHi);
    setType(node.type);
    setX(node.x);
    setY(node.y);
    setStateEn(node.stateEn);
    setStateHi(node.stateHi);
    setDrmEn(node.drmEn);
    setDrmHi(node.drmHi);
    setGoogleMapQuery(node.googleMapQuery);
    setCoordinatesText(node.coordinatesText);
    setCustomHighlight(node.customHighlight || false);
    setDetailsEnInput(node.detailsEn ? node.detailsEn.join("\n") : "");
    setDetailsHiInput(node.detailsHi ? node.detailsHi.join("\n") : "");
    setShowForm(true);
  };

  const startAdd = () => {
    setEditingNode(null);
    setFormId("");
    setNameEn("");
    setNameHi("");
    setType("division");
    setX(50);
    setY(40);
    setStateEn("");
    setStateHi("");
    setDrmEn("");
    setDrmHi("");
    setGoogleMapQuery("");
    setCoordinatesText("");
    setCustomHighlight(false);
    setDetailsEnInput("");
    setDetailsHiInput("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim()) {
      toast.error("Node ID is required (e.g. 'kir', 'apdj', 'lmg')");
      return;
    }
    const cleanId = formId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanId) {
      toast.error("Invalid Node ID format");
      return;
    }

    if (!nameEn.trim() || !nameHi.trim()) {
      toast.error("Please fill Name in English & Hindi both.");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const parsedDetailsEn = detailsEnInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const parsedDetailsHi = detailsHiInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const nodeData: OrgNode = {
        id: cleanId,
        nameEn: nameEn.trim(),
        nameHi: nameHi.trim(),
        type,
        x: Number(x) || 0,
        y: Number(y) || 0,
        stateEn: stateEn.trim(),
        stateHi: stateHi.trim(),
        drmEn: drmEn.trim(),
        drmHi: drmHi.trim(),
        googleMapQuery: googleMapQuery.trim(),
        coordinatesText: coordinatesText.trim(),
        customHighlight,
        detailsEn: parsedDetailsEn,
        detailsHi: parsedDetailsHi,
      };

      await setDoc(doc(db, "nfrOrgNodes", cleanId), nodeData);
      toast.success(editingNode ? "Node updated successfully" : "Node added successfully");
      setShowForm(false);
      setEditingNode(null);
    } catch (error) {
      console.error("Save node error:", error);
      toast.error("Failed to save organization node: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "nfrOrgNodes", id));
      toast.success("Node deleted successfully");
    } catch (error) {
      console.error("Delete node error:", error);
      toast.error("Failed to delete node: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">NFR Map Organization Editor</h3>
          <p className="text-sm text-gray-500">
            Add, Edit, and Delete NFR Divisions and Workshop Nodes displayed in the interactive map on the landing page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nodes.length === 0 && !isLoading && (
            <button
              onClick={handleSeedDefaults}
              disabled={isSubmitLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={16} className={isSubmitLoading ? "animate-spin" : ""} />
              Seed 9 Default Nodes
            </button>
          )}
          <button
            onClick={startAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#e31837] hover:bg-[#c2102a] text-white rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add New Node
          </button>
        </div>
      </div>

      {/* Form Editor Overlay/Modal or Collapsible */}
      {showForm && (
        <div className="border border-indigo-100 bg-indigo-50/40 p-6 rounded-lg space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200 pb-3">
            <h4 className="text-md font-bold text-indigo-900">
              {editingNode ? `Edit Node: ${editingNode.nameEn}` : "Add NFR Organization Map Node"}
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Node ID (Unique String key, e.g. kir, apdj, lmg, dbws)
              </label>
              <input
                type="text"
                disabled={!!editingNode}
                value={formId}
                onChange={(e) => setFormId(e.target.value.toLowerCase().trim())}
                placeholder="e.g. kir"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "division" | "workshop")}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              >
                <option value="division">Division / DRM Office</option>
                <option value="workshop">Workshop / POH Center</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Name (English)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Katihar (KIR) Division"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Name (Hindi)
              </label>
              <input
                type="text"
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                placeholder="e.g. कटिहार (KIR) मंडल"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                SVG Map X Coordinate (0 to 100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={x}
                onChange={(e) => setX(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                required
              />
              <p className="text-[10px] text-gray-500 mt-0.5">Determines the horizontal dot position on schematic map</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                SVG Map Y Coordinate (0 to 80)
              </label>
              <input
                type="number"
                min="0"
                max="80"
                value={y}
                onChange={(e) => setY(Math.min(80, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                required
              />
              <p className="text-[10px] text-gray-500 mt-0.5">Determines the vertical dot position on schematic map</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Jurisdiction States (English)
              </label>
              <input
                type="text"
                value={stateEn}
                onChange={(e) => setStateEn(e.target.value)}
                placeholder="e.g. Bihar / West Bengal"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Jurisdiction States (Hindi)
              </label>
              <input
                type="text"
                value={stateHi}
                onChange={(e) => setStateHi(e.target.value)}
                placeholder="e.g. बिहार / पश्चिम बंगाल"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Headed By / DRM Title (English)
              </label>
              <input
                type="text"
                value={drmEn}
                onChange={(e) => setDrmEn(e.target.value)}
                placeholder="e.g. Divisional Railway Manager (DRM KIR)"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Headed By / DRM Title (Hindi)
              </label>
              <input
                type="text"
                value={drmHi}
                onChange={(e) => setDrmHi(e.target.value)}
                placeholder="e.g. मंडल रेल प्रबंधक (DRM KIR)"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Google Maps Search Match Query
              </label>
              <input
                type="text"
                value={googleMapQuery}
                onChange={(e) => setGoogleMapQuery(e.target.value)}
                placeholder="e.g. DRM Office Katihar Personnel Branch Bihar"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Coordinates Text Display
              </label>
              <input
                type="text"
                value={coordinatesText}
                onChange={(e) => setCoordinatesText(e.target.value)}
                placeholder="e.g. 25.5392° N, 87.5684° E"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div className="md:col-span-2 flex items-center bg-white border p-3 rounded-md">
              <input
                id="customHighlight"
                type="checkbox"
                checked={customHighlight}
                onChange={(e) => setCustomHighlight(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
              />
              <label htmlFor="customHighlight" className="text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer">
                Special Pulsing Bloom Highlight (Blinking bhuk-bhuk light e.g. on Katihar)
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Major details / Apprentice Cells (English) - Max 1 line per row
              </label>
              <textarea
                rows={5}
                value={detailsEnInput}
                onChange={(e) => setDetailsEnInput(e.target.value)}
                placeholder="Enter details, one per line..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Major details / Apprentice Cells (Hindi) - Max 1 line per row
              </label>
              <textarea
                rows={5}
                value={detailsHiInput}
                onChange={(e) => setDetailsHiInput(e.target.value)}
                placeholder="निर्देश दर्ज करें, प्रति पंक्ति एक..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-mono"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 border-t border-indigo-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingNode(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitLoading}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                <Save size={16} />
                {isSubmitLoading ? "Saving..." : "Save Node"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of existing nodes */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <RefreshCw className="animate-spin text-gray-400 mb-2" size={28} />
          <p className="text-sm">Fetching NFR map nodes from database...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="border border-dashed p-10 text-center text-gray-500 rounded-lg space-y-4">
          <HelpCircle className="mx-auto text-indigo-400" size={48} />
          <p className="text-md">No organization nodes found in Firestore.</p>
          <p className="text-xs text-gray-400">Click &quot;Seed 9 Default Nodes&quot; above to auto-provision standard NFR divisions, headquarters, and workshops to begin customizing them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nodes
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((node) => (
              <div
                key={node.id}
                className="border rounded-lg p-5 bg-white shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full mb-2 ${
                        node.type === "workshop" 
                          ? "bg-amber-100 text-amber-850 border border-amber-200" 
                          : "bg-purple-100 text-purple-850 border border-purple-200"
                      }`}>
                        {node.type}
                      </span>
                      {node.customHighlight && (
                        <span className="ml-1.5 inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          Pulsing Glow
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-gray-400 uppercase">
                      ID: {node.id}
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-900">{node.nameEn}</h4>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{node.nameHi}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <div>
                      <span className="font-bold text-gray-700">Coordinates:</span> (X: {node.x}, Y: {node.y}) | {node.coordinatesText}
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">Headed by:</span> {node.drmEn || "N/A"}
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">States:</span> {node.stateEn || "N/A"}
                    </div>
                    <div className="pt-2">
                      <span className="font-bold text-gray-700 block mb-1">Details English ({node.detailsEn?.length || 0}):</span>
                      <ul className="list-disc pl-4 space-y-0.5 font-sans">
                        {node.detailsEn?.slice(0, 3).map((det, i) => (
                          <li key={i} className="text-[11px] text-gray-500 truncate">{det}</li>
                        ))}
                        {node.detailsEn?.length > 3 && (
                          <li className="text-[10px] text-indigo-600 font-medium">+{node.detailsEn.length - 3} more lines</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-4">
                  <button
                    onClick={() => startEdit(node)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-350 text-gray-700 rounded text-xs font-semibold transition-colors bg-gray-50 hover:bg-gray-100"
                  >
                    <Edit size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(node.id, node.nameEn)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded text-xs font-semibold transition-colors border border-red-200"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
