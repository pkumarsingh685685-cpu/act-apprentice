import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Info, Compass, ShieldCheck, Settings, Users, Sparkles, Star, Zap, Building2, Eye, PhoneCall } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface OrgNode {
  id: string;
  nameEn: string;
  nameHi: string;
  type: "division" | "workshop";
  x: number; // SVG coordinates
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

const STATIC_FALLBACK_NODES: OrgNode[] = [
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

export function NfrOrgMap() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const [selectedNodeId, setSelectedNodeId] = useState<string>("kir");
  const [mapMode, setMapMode] = useState<"schematic" | "google">("schematic");
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>(STATIC_FALLBACK_NODES);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "nfrOrgNodes"), (snapshot) => {
      const liveNodes: OrgNode[] = [];
      snapshot.forEach((doc) => {
        liveNodes.push(doc.data() as OrgNode);
      });
      if (liveNodes.length > 0) {
        setOrgNodes(liveNodes);
      } else {
        setOrgNodes(STATIC_FALLBACK_NODES);
      }
    }, (error) => {
      console.error("Error reading live NFR org nodes from Firestore:", error);
      handleFirestoreError(error, OperationType.LIST, "nfrOrgNodes");
    });
    return () => unsubscribe();
  }, []);

  const selectedNode = orgNodes.find((n) => n.id === selectedNodeId) || orgNodes[0] || STATIC_FALLBACK_NODES[0];

  // Helper translations
  const mapLabels = {
    en: {
      mapTitle: "Northeast Frontier Railway (NFR) Map System",
      mapSubtitle: "Click on any point of division or workshop below to inspect jurisdictions",
      legendTitle: "Map Legends",
      legDiv: "Railway Divisions (DRM)",
      legWork: "Mechanical Workshops (POH)",
      legHighlight: "Katihar Personnel Branch (Continuous Glow)",
      detailsHeader: "Inspected Division / Workshop Detail Card",
      headOfficer: "Headed By",
      state: "Jurisdiction State",
      pointsOfInterest: "Major Units / Apprentices Units",
      closeDetails: "Reset map selection",
      hintText: "🟢 Click 'Live Google Map' tab below to view satellite/streets map directly!",
      apprenticeAlert: "ACT Apprentice Cell under Personnel Branch coordinates apprentice engagements across these zones."
    },
    hi: {
      mapTitle: "पूर्वोत्तर सीमांत रेलवे (NFR) मानचित्र ढांचा",
      mapSubtitle: "अधिकार क्षेत्र का निरीक्षण करने के लिए नीचे किसी भी मंडल या कार्यशाला बिंदु पर क्लिक करें",
      legendTitle: "मानचित्र के प्रतीक",
      legDiv: "रेलवे मंडल (DRM)",
      legWork: "यांत्रिक कार्यशालाएं (POH)",
      legHighlight: "कटिहार कार्मिक शाखा (सघन भुक-भुक चमक)",
      detailsHeader: "निरीक्षण मंडल / कार्यशाला विवरण कार्ड",
      headOfficer: "प्रमुख अधिकारी",
      state: "अधिकार क्षेत्र का राज्य",
      pointsOfInterest: "प्रमुख इकाइयाँ / शिक्षु इकाइयाँ",
      closeDetails: "मानचित्र रीसेट करें",
      hintText: "🟢 उपग्रह/सड़क मानचित्र सीधे देखने के लिए नीचे 'लाइव गूगल मैप' टैब पर क्लिक करें!",
      apprenticeAlert: "कार्मिक शाखा के अधीन अधिनियम शिक्षु सेल इन सभी कार्यशाला क्षेत्रों में शिक्षुओं के नियोजन का समन्वय करता है।"
    }
  };

  const currentLabels = mapLabels[currentLang as "en" | "hi"] || mapLabels.en;

  return (
    <div className="space-y-8 bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-800 text-white relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-indigo-200 to-violet-400 WebkitBackgroundClip text-transparent inline-block">
            {currentLabels.mapTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            {currentLabels.mapSubtitle}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 text-violet-300 shadow">
          <Zap size={15} className="text-yellow-400 shrink-0 fill-yellow-400/25 animate-bounce" />
          <span className="font-semibold text-slate-300">{currentLabels.hintText}</span>
        </div>
      </div>

      {/* Map Mode Tabs Swapper */}
      <div className="flex bg-slate-900/60 p-1 rounded-xl max-w-md border border-slate-800/80">
        <button
          onClick={() => setMapMode("schematic")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            mapMode === "schematic"
              ? "bg-[#8b5cf6] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Compass size={14} />
          {currentLang === "hi" ? "इंटरएक्टिव चित्र (Schematic Layout)" : "Interactive Schematic Diagram"}
        </button>
        <button
          onClick={() => setMapMode("google")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            mapMode === "google"
              ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MapPin size={14} className="text-red-400 fill-red-400/30" />
          {currentLang === "hi" ? "लाइव गूगल मैप (Live Google Map)" : "Live Google Map View"}
        </button>
      </div>

      {/* Interactive Map Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* SVG/Google Map Viewport Segment - 7 Columns */}
        <div className="lg:col-span-7 bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-inner relative flex flex-col items-center justify-center min-h-[350px] md:min-h-[460px] overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-violet-850 scrollbar-track-slate-900/40">
          
          {mapMode === "schematic" ? (
            <>
              {/* Legend Overlay */}
              <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 text-[11px] space-y-2 z-20 backdrop-blur shadow-lg max-w-[200px]">
                <span className="font-black text-slate-400 block uppercase tracking-wider">{currentLabels.legendTitle}</span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-violet-500 rounded-full inline-block" />
                  <span className="text-slate-300">{currentLabels.legDiv}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                  <span className="text-slate-300">{currentLabels.legWork}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                  </span>
                  <span className="text-red-300 font-extrabold">{currentLabels.legHighlight}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-850">
                  <span className="w-3.5 h-3.5 bg-amber-500 rounded-full inline-flex items-center justify-center text-[8px] font-black text-white">★</span>
                  <span className="text-amber-300 font-bold">{currentLang === "hi" ? "पूसीर मुख्यालय" : "Zone HQ (Gold)"}</span>
                </div>
              </div>

              {/* SVG Map Container - Set standard min-width to prevent clipping on small viewports and enable horizontal scroll of map */}
              <div className="w-full h-full relative aspect-[16/9] min-w-[700px] py-4">
                <svg 
                  viewBox="0 0 100 80" 
                  className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Grid Lines for technical aesthetics */}
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100" height="80" fill="url(#grid)" rx="8" />

                  {/* NFR Train Line Network System Paths */}
                  <line x1="5" y1="75" x2="15" y2="65" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="0.8" strokeDasharray="2, 2" />
                  <path d="M 15 65 Q 23 50 35 45" fill="none" stroke="rgba(139, 92, 246, 0.6)" strokeWidth="1.2" strokeDasharray="1, 1" />
                  <path d="M 35 45 L 50 35" fill="none" stroke="rgba(139, 92, 246, 0.6)" strokeWidth="1.2" />
                  <path d="M 50 35 L 60 40" fill="none" stroke="rgba(139, 92, 246, 0.6)" strokeWidth="1.2" />
                  <path d="M 60 40 Q 68 50 75 55" fill="none" stroke="rgba(139, 92, 246, 0.6)" strokeWidth="1.2" />
                  <path d="M 75 55 Q 82 40 88 25" fill="none" stroke="rgba(139, 92, 246, 0.6)" strokeWidth="1" strokeDasharray="3, 1" />
                  <line x1="88" y1="25" x2="93" y2="20" stroke="rgba(139, 92, 246, 0.6)" strokeWidth="1.2" />
                  <path d="M 75 75 L 75 55" fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="0.8" strokeDasharray="2, 2" />

                  {/* Pulsing ring for selected node */}
                  {orgNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <g key={`link-${node.id}`}>
                        {isSelected && (
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="3.5" 
                            fill="none" 
                            stroke={node.id === "hq_maligaon" ? "#fbbf24" : node.type === "workshop" ? "#eab308" : "#8b5cf6"} 
                            strokeWidth="0.5"
                            className="animate-pulse"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Draw Map Nodes */}
                  {orgNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    
                    // Special layout for Maligaon Headquarters (hq_maligaon)
                    if (node.id === "hq_maligaon") {
                      return (
                        <g 
                          key={node.id} 
                          onClick={() => setSelectedNodeId(node.id)} 
                          className="cursor-pointer group animate-fade-in"
                        >
                          {/* golden multi-layer HQ glowing rings */}
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="6" 
                            fill="rgba(245, 158, 11, 0.15)"
                            className="animate-ping"
                            style={{ animationDuration: "1.5s" }}
                          />
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="4" 
                            fill="rgba(245, 158, 11, 0.25)"
                            className="animate-pulse"
                            style={{ animationDuration: "1.8s" }}
                          />
                          <polygon 
                            points={`${node.x},${node.y - 2.8} ${node.x + 0.8},${node.y - 0.8} ${node.x + 2.8},${node.y - 0.8} ${node.x + 1.2},${node.y + 0.5} ${node.x + 1.8},${node.y + 2.5} ${node.x},${node.y + 1.2} ${node.x - 1.8},${node.y + 2.5} ${node.x - 1.2},${node.y + 0.5} ${node.x - 2.8},${node.y - 0.8} ${node.x - 0.8},${node.y - 0.8}`} 
                            fill={isSelected ? "#fbbf24" : "#f59e0b"} 
                            className="group-hover:fill-yellow-400 transition-colors shadow-lg"
                          />
                          <circle cx={node.x} cy={node.y} r="1" fill="#fff" />
                          
                          <text 
                            x={node.x > 80 ? node.x - 3.5 : node.x + 3.5} 
                            y={node.y + 1} 
                            textAnchor={node.x > 80 ? "end" : "start"}
                            fill="#fef08a" 
                            fontSize="2" 
                            fontWeight="black" 
                            className="font-sans select-none tracking-wide font-extrabold pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                          >
                            ⭐ {currentLang === "hi" ? "पूसीर मुख्यालय" : "NFR HQ"}
                          </text>
                        </g>
                      );
                    }

                    // Splendid customized blinking "Bhuk bhuk" light on Katihar (kir)
                    if (node.id === "kir") {
                      return (
                        <g 
                          key={node.id} 
                          onClick={() => setSelectedNodeId(node.id)} 
                          className="cursor-pointer group animate-fade-in"
                        >
                          {/* outer multi-layer "BHUK-BHUK" blinking/flashing light */}
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="5.5" 
                            fill="rgba(239, 68, 68, 0.15)"
                            className="animate-ping"
                            style={{ animationDuration: "0.8s" }}
                          />
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="4" 
                            fill="rgba(239, 68, 68, 0.25)"
                            className="animate-pulse"
                            style={{ animationDuration: "1.2s" }}
                          />
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="2.5" 
                            fill="#ef4444" 
                            className="group-hover:fill-red-400 transition-colors shadow-lg"
                          />
                          
                          <line x1={node.x} y1={node.y} x2={node.x + 8} y2={node.y - 4} stroke="#ef4444" strokeWidth="0.4" />
                          
                          {/* Secondary Personnel Branch Node that pulses rapidly RED */}
                          <g transform={`translate(${node.x + 8}, ${node.y - 4})`}>
                            <circle cx="0" cy="0" r="1.8" fill="#ec4899" className="animate-ping" style={{ animationDuration: "0.5s" }} />
                            <circle cx="0" cy="0" r="1.3" fill="#ec4899" />
                            <text 
                              x="3" 
                              y="1" 
                              fill="#fca5a5" 
                              fontSize="2" 
                              fontWeight="black" 
                              className="font-sans antialiased uppercase select-none tracking-wider pointer-events-none"
                            >
                              {currentLang === "hi" ? "कार्मिक शाखा (Bhuk-Bhuk!)" : "PERSONNEL BRANCH KIR"}
                            </text>
                          </g>

                          <text 
                            x={node.x - 2} 
                            y={node.y + 5} 
                            fill="#ef4444" 
                            fontSize="2.2" 
                            fontWeight="black" 
                            className="font-sans select-none"
                          >
                            {currentLang === "hi" ? "कटिहार मंडल (KIR)" : "KATIHAR DIV (KIR)"}
                          </text>
                        </g>
                      );
                    }

                    // Normal Station point
                    return (
                      <g 
                        key={node.id} 
                        onClick={() => setSelectedNodeId(node.id)} 
                        className="cursor-pointer group"
                      >
                        {node.type === "workshop" ? (
                          // Workshop Star Icon Node
                          <g transform={`translate(${node.x}, ${node.y})`}>
                            <polygon 
                              points="0,-2 0.6,-0.6 2,-0.6 0.9,0.3 1.3,1.7 0,0.8 -1.3,1.7 -0.9,0.3 -2,-0.6 -0.6,-0.6" 
                              fill={isSelected ? "#f59e0b" : "#eab308"} 
                              className="group-hover:fill-amber-300 transition-colors"
                            />
                            <text 
                              x={node.x > 80 ? "-2.5" : "2.5"} 
                              y="1" 
                              textAnchor={node.x > 80 ? "end" : "start"}
                              fill="#fcd34d" 
                              fontSize="1.9" 
                              fontWeight="bold" 
                              className="font-sans select-none pointer-events-none"
                            >
                              {currentLang === "hi"
                                ? node.nameHi.replace(" कार्यशाला", " कार्य.")
                                : node.nameEn.replace(" Workshop", " WS")}
                            </text>
                          </g>
                        ) : (
                          // Division Standard Node Circle
                          <g>
                            <circle 
                              cx={node.x} 
                              cy={node.y} 
                              r={isSelected ? "2.2" : "1.6"} 
                              fill={isSelected ? "#a78bfa" : "#8b5cf6"} 
                              className="group-hover:fill-violet-300 transition-all duration-200"
                            />
                            <text 
                              x={node.x > 80 ? node.x - 2.5 : node.x + 2.5} 
                              y={node.y + 0.6} 
                              textAnchor={node.x > 80 ? "end" : "start"}
                              fill="#c4b5fd" 
                              fontSize="1.8" 
                              fontWeight="600" 
                              className="font-sans select-none pointer-events-none"
                            >
                              {currentLang === "hi"
                                ? node.nameHi.replace(" मंडल", "").replace(" मुख्यालय", "")
                                : node.nameEn.replace(" Division", "").replace(" Headquarters", "")}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </>
          ) : (
            /* Live Interactive Google Map Iframe Segment */
            <div className="w-full h-full min-h-[350px] md:min-h-[430px] rounded-xl overflow-hidden shadow-2xl relative flex flex-col bg-slate-900 border-2 border-dashed border-slate-700/60 p-1 animate-fade-in">
              <div className="absolute top-2 left-2 z-15 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] flex items-center gap-1.5 text-cyan-300 shadow">
                <MapPin size={10} className="text-red-400 fill-red-400/20" />
                <span>{selectedNode.coordinatesText}</span>
              </div>
              <iframe
                title="Google Maps Location View"
                width="100%"
                height="100%"
                className="rounded-lg bg-slate-950 flex-1 min-h-[340px] md:min-h-[420px]"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedNode.googleMapQuery)}&t=m&z=15&output=embed`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
                style={{ border: 0 }}
              />
            </div>
          )}
        </div>

        {/* Selected Node Inspector Panel - 5 Columns */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden"
            >
              {/* Highlight background banner */}
              {selectedNode.id === "hq_maligaon" ? (
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 animate-pulse" />
              ) : selectedNode.customHighlight ? (
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-500 via-pink-500 to-indigo-500" />
              ) : null}

              <div className="space-y-5">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest rounded uppercase ${
                        selectedNode.id === "hq_maligaon"
                          ? "bg-amber-950 text-amber-200 border border-amber-600/40"
                          : selectedNode.type === "workshop" 
                            ? "bg-amber-950 text-amber-200 border border-amber-800/40" 
                            : "bg-indigo-950 text-indigo-200 border border-indigo-800/40"
                      }`}>
                        {selectedNode.id === "hq_maligaon" ? "NFR HQ" : selectedNode.type === "workshop" ? "NFR WORKSHOP" : "NFR DIVISION"}
                      </span>
                      {selectedNode.id === "hq_maligaon" && (
                        <span className="bg-amber-950 text-yellow-300 border border-yellow-500/60 px-2 py-0.5 text-[9px] font-black uppercase rounded animate-pulse flex items-center gap-1">
                          👑 ZONE HEADQUARTERS
                        </span>
                      )}
                      {selectedNode.customHighlight && (
                        <span className="bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 text-[9px] font-black uppercase rounded animate-pulse">
                          PERSONNEL HEADQUARTERS
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-white mt-2 leading-tight">
                      {currentLang === "hi" ? selectedNode.nameHi : selectedNode.nameEn}
                    </h3>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-950 rounded-xl border border-white/5 shrink-0">
                    {selectedNode.id === "hq_maligaon" ? (
                      <Star size={20} className="text-amber-400 fill-amber-400/20 animate-spin" style={{ animationDuration: "8s" }} />
                    ) : selectedNode.type === "workshop" ? (
                      <Star size={20} className="text-yellow-400 fill-yellow-400/20" />
                    ) : (
                      <Building2 size={20} className="text-violet-400" />
                    )}
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <Compass className="text-violet-400 shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block font-sans">
                        {currentLabels.state}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        {currentLang === "hi" ? selectedNode.stateHi : selectedNode.stateEn}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400/90 block mt-0.5">
                        📍 {selectedNode.coordinatesText}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                    <ShieldCheck className="text-violet-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                        {currentLabels.headOfficer}
                      </span>
                      <span className="text-sm font-black text-amber-200 tracking-wide">
                        {currentLang === "hi" ? selectedNode.drmHi : selectedNode.drmEn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specific features listings - Highlighting Personnel on Katihar */}
                <div className="space-y-2 border-t border-white/5 pt-3.5">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest block mb-2.5 font-sans">
                    {currentLabels.pointsOfInterest}
                  </span>
                  
                  <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                    {selectedNode.detailsEn.map((item, index) => {
                      const textShow = currentLang === "hi" ? selectedNode.detailsHi[index] : selectedNode.detailsEn[index];
                      const isHighlighted = textShow.toLowerCase().includes("personnel") || textShow.toLowerCase().includes("कार्मिक");
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-2.5 rounded-xl text-xs flex items-start gap-2.5 border transition-all ${
                            isHighlighted 
                              ? "bg-gradient-to-r from-red-950/40 to-pink-950/20 border-red-500/40 text-red-150 font-extrabold shadow-sm" 
                              : "bg-slate-950/55 border-white/5 text-slate-300"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${isHighlighted ? "bg-red-400 animate-ping" : "bg-violet-400"}`} />
                          <span className="leading-relaxed">{textShow}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Quick-actions link to Google Maps */}
              <div className="space-y-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedNode.googleMapQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-all shadow"
                >
                  <MapPin size={14} className="text-red-400" />
                  {currentLang === "hi" ? "गूगल मैप्स पर बड़ा नक्शा खोलें (Open Standard Google Maps)" : "Open in External Google Maps"}
                </a>

                {/* Bottom Card note callout */}
                <div className="bg-slate-950/80 border border-white/5 p-3.5 rounded-xl flex items-start gap-2.5">
                  <Info size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-normal font-medium">
                    {currentLabels.apprenticeAlert}
                  </p>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
