import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { PDFDocument, degrees } from "pdf-lib";
import { 
  FileText, 
  Upload, 
  Settings, 
  Download, 
  CheckCircle, 
  Sparkles, 
  Trash2, 
  Layers, 
  RefreshCw,
  Sliders,
  Move,
  Lock,
  Stamp,
  Calendar,
  Layers3,
  PenTool
} from "lucide-react";
import { toast } from "sonner";

interface CustomStamp {
  id: string;
  title: string;
  imageData: string; // Base64 strings representing transparent PNG files
  createdAt: string;
  createdBy: string;
  isLocal?: boolean;
}

export function OfficePdfStamper() {
  // Page core states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfPagesCount, setPdfPagesCount] = useState<number>(0);
  
  // Custom stamps persisted database
  const [customStamps, setCustomStamps] = useState<CustomStamp[]>([]);
  const [loadingStamps, setLoadingStamps] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [stampIdToDelete, setStampIdToDelete] = useState<string | null>(null);
  
  // Create / upload new custom stamp fields
  const [stampFormTab, setStampFormTab] = useState<"builder" | "upload" | "signature">("builder");
  const [makerHindiDesig, setMakerHindiDesig] = useState("वरिष्ठ मंडल कार्मिक अधिकारी");
  const [makerEngDesig, setMakerEngDesig] = useState("Senior Divisional Personnel Officer");
  const [makerHindiOrg, setMakerHindiOrg] = useState("पू० सी० रेल, कटिहार");
  const [makerEngOrg, setMakerEngOrg] = useState("N. F. Railway, Katihar");
  const [makerColor, setMakerColor] = useState("#2563eb"); // Classic Blue/Violet ink
  const [makerHasBorder, setMakerHasBorder] = useState(false);
  const [makerBorderThickness, setMakerBorderThickness] = useState(2);
  const [makerTilt, setMakerTilt] = useState(-1);
  const [makerGrunge, setMakerGrunge] = useState(true);
  
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [newStampTitle, setNewStampTitle] = useState("");
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

  // Signature Upload & Preprocessing States
  const [sigTitle, setSigTitle] = useState("");
  const [rawSigBase64, setRawSigBase64] = useState<string | null>(null);
  const [processedSigBase64, setProcessedSigBase64] = useState<string | null>(null);
  const [sigThreshold, setSigThreshold] = useState<number>(205);
  const [sigEnhanceInk, setSigEnhanceLink] = useState<boolean>(true);

  // Stamping alignment and options
  const [selectedStampId, setSelectedStampId] = useState<string>("");
  const [targetPagesOption, setTargetPagesOption] = useState<"first" | "last" | "all" | "custom">("all");
  const [customPagesString, setCustomPagesString] = useState<string>("1");
  const [stampScale, setStampScale] = useState<number>(100); // 100%
  const [stampOpacity, setStampOpacity] = useState<number>(100); // %
  const [stampRotation, setStampRotation] = useState<number>(0); // degrees
  
  // Coordinates Mode (preset vs manual)
  const [alignMode, setAlignMode] = useState<"preset" | "manual">("preset");
  const [positionPreset, setPositionPreset] = useState<string>("bottom-right");
  const [manualX, setManualX] = useState<number>(80); // %
  const [manualY, setManualY] = useState<number>(10); // %

  // PDF.js live visualization states
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfDocInstance, setPdfDocInstance] = useState<any>(null);
  const [previewPageNum, setPreviewPageNum] = useState<number>(1);
  const [renderingPage, setRenderingPage] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState({ width: 595, height: 842 }); // Default A4 ratio

  const pdfPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const interactiveContainerRef = useRef<HTMLDivElement | null>(null);

  // Form generated date string
  const [stampDateString] = useState<string>(() => {
    const d = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  // Dynamic built-in standard railway office stamps
  const [builtInStamps, setBuiltInStamps] = useState<{ id: string; title: string; label: string; dataUrl: string; color: string }[]>([]);

  // Generate standard templates in base64 on mount
  const generateBuiltInSeals = () => {
    const stampsList = [
      {
        id: "built-in-approved",
        title: "APPROVED / स्वीकृत",
        label: "Approved Green Solid Border",
        color: "#16a34a",
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = "#16a34a";
          ctx.lineWidth = 14;
          ctx.strokeRect(10, 10, 380, 180);
          ctx.lineWidth = 3;
          ctx.strokeRect(25, 25, 350, 150);

          ctx.font = "bold 34px sans-serif";
          ctx.fillStyle = "#16a34a";
          ctx.textAlign = "center";
          ctx.fillText("APPROVED / स्वीकृत", 200, 85);

          ctx.font = "600 22px sans-serif";
          ctx.fillText("मंडल रेल प्रबंधक (का०) / कटिहार", 200, 125);
          ctx.font = "bold 16px monospace";
          ctx.fillText(`KATIHAR NFR - ${stampDateString}`, 200, 155);
        }
      },
      {
        id: "built-in-round-seal",
        title: "DRM RAILWAY ROYAL SEAL",
        label: "Royal Round Crest",
        color: "#2563eb",
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(200, 100, 85, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(200, 100, 75, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.font = "bold 13px sans-serif";
          ctx.fillStyle = "#2563eb";
          ctx.textAlign = "center";
          ctx.fillText("पूर्वोत्तर सीमा रेलवे", 200, 52);
          
          ctx.font = "900 24px sans-serif";
          ctx.fillText("P-BRANCH", 200, 95);
          
          ctx.font = "bold 13px sans-serif";
          ctx.fillText("KATIHAR DIVISION", 200, 125);
          ctx.font = "bold 12px monospace";
          ctx.fillText(`DATE: ${stampDateString}`, 200, 155);
        }
      },
      {
        id: "built-in-confidential",
        title: "CONFIDENTIAL / गोपनीय",
        label: "Confidential Red Tilt",
        color: "#dc2626",
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 11;
          
          ctx.beginPath();
          ctx.moveTo(10, 35);
          ctx.lineTo(390, 35);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(10, 165);
          ctx.lineTo(390, 165);
          ctx.stroke();

          ctx.font = "bold 44px sans-serif";
          ctx.fillStyle = "#dc2626";
          ctx.textAlign = "center";
          ctx.fillText("CONFIDENTIAL", 200, 90);

          ctx.font = "bold 32px sans-serif";
          ctx.fillText("अति गोपनीय / D&AR", 200, 140);
        }
      },
      {
        id: "built-in-certified-copy",
        title: "CERTIFIED TRUE COPY",
        label: "Certified Copy Blue Template",
        color: "#0891b2",
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = "#0891b2";
          ctx.lineWidth = 8;
          ctx.strokeRect(10, 10, 380, 180);
          
          ctx.font = "bold 34px sans-serif";
          ctx.fillStyle = "#0891b2";
          ctx.textAlign = "center";
          ctx.fillText("CERTIFIED COPY", 200, 65);

          ctx.font = "bold 20px sans-serif";
          ctx.fillText("प्रमाणित सत्य प्रतिलिपि", 200, 105);

          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(60, 150);
          ctx.lineTo(340, 150);
          ctx.stroke();

          ctx.font = "11px sans-serif";
          ctx.fillText("Katihar Division Personnel Branch", 200, 168);
        }
      }
    ];

    const results = stampsList.map(s => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 400, 200);
        s.draw(ctx);
      }
      return {
        id: s.id,
        title: s.title,
        label: s.label,
        color: s.color,
        dataUrl: canvas.toDataURL("image/png")
      };
    });

    setBuiltInStamps(results);
  };

  // Fetch customizable stamps uploaded inside the Firestore database with local fallback
  const fetchCustomStamps = async () => {
    setLoadingStamps(true);
    let firestoreList: CustomStamp[] = [];
    try {
      const querySnapshot = await getDocs(collection(db, "sec_office_stamps"));
      querySnapshot.forEach((doc) => {
        firestoreList.push({ id: doc.id, ...doc.data() } as CustomStamp);
      });
    } catch (err) {
      console.warn("Could not fetch stamps from Firebase (showing local fallback):", err);
    }

    // Always fetch from local storage as well
    let localList: CustomStamp[] = [];
    try {
      const saved = localStorage.getItem("local_sec_office_stamps");
      if (saved) {
        localList = JSON.parse(saved).map((stamp: any) => ({ ...stamp, isLocal: true }));
      }
    } catch (localErr) {
      console.error("Error reading localStorage stamps:", localErr);
    }

    const merged = [...firestoreList, ...localList];
    setCustomStamps(merged);
    
    // Choose active stamp
    if (merged.length > 0) {
      setSelectedStampId(prev => prev && merged.some(s => s.id === prev) ? prev : merged[0].id);
    }
    setLoadingStamps(false);
  };

  useEffect(() => {
    setBuiltInStamps([]);
    fetchCustomStamps();
  }, []);

  // 1. Dynamic CDN Loading of PDF.js
  useEffect(() => {
    const scriptId = "pdfjs-cdn-script";
    if (document.getElementById(scriptId)) {
      if ((window as any).pdfjsLib) {
        setPdfJsLoaded(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        setPdfJsLoaded(true);
      }
    };
    script.onerror = () => {
      toast.error("Failed to load PDF preview engine from CDN.");
    };
    document.body.appendChild(script);
  }, []);

  // 2. Load PDF document instance on file change
  useEffect(() => {
    if (!selectedFile || !(window as any).pdfjsLib) {
      setPdfDocInstance(null);
      return;
    }

    const loadPdfWithJs = async () => {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfjsLib = (window as any).pdfjsLib;
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDocInstance(pdf);
        setPreviewPageNum(1);
      } catch (err) {
        console.error("PDF.js loading error:", err);
      }
    };

    loadPdfWithJs();
  }, [selectedFile, pdfJsLoaded]);

  // 3. Render individual PDF page to interactive Canvas preview
  useEffect(() => {
    if (!pdfDocInstance || !pdfPreviewCanvasRef.current) return;

    let active = true;
    const renderPage = async () => {
      try {
        setRenderingPage(true);
        const page = await pdfDocInstance.getPage(previewPageNum);
        if (!active) return;

        const canvas = pdfPreviewCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale: 1.0 });
        setPdfPageSize({ width: viewport.width, height: viewport.height });

        // Calculate a responsive width for the preview canvas (container-fit up to ~450px)
        let scale = 450 / viewport.width;
        if (scale > 2) scale = 2;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport,
        };
        await page.render(renderContext).promise;
        setRenderingPage(false);
      } catch (err) {
        console.error("Error rendering PDF preview page:", err);
        setRenderingPage(false);
      }
    };

    renderPage();

    return () => {
      active = false;
    };
  }, [pdfDocInstance, previewPageNum]);

  // 4. Calculate stamp overlay positioning & dimensions in percentage relative to preview canvas
  const getActiveStampDataUrl = () => {
    const builtIn = builtInStamps.find(s => s.id === selectedStampId);
    if (builtIn) return builtIn.dataUrl;

    const custom = customStamps.find(s => s.id === selectedStampId);
    if (custom) return custom.imageData;

    return "";
  };

  const getOverlayPosition = () => {
    // Standard seal dimensions modeled in pdf-lib (145 wide x 72 tall)
    const stampPdfWidth = 145 * (stampScale / 100);
    const stampPdfHeight = 72 * (stampScale / 100);

    const widthPercent = (stampPdfWidth / pdfPageSize.width) * 100;
    const heightPercent = (stampPdfHeight / pdfPageSize.height) * 100;

    let leftPercent = 0;
    let topPercent = 0;

    if (alignMode === "preset") {
      const paddingPercentX = (25 / pdfPageSize.width) * 100;
      const paddingPercentY = (25 / pdfPageSize.height) * 100;

      switch (positionPreset) {
        case "top-left":
          leftPercent = paddingPercentX;
          topPercent = paddingPercentY;
          break;
        case "top-center":
          leftPercent = 50 - widthPercent / 2;
          topPercent = paddingPercentY;
          break;
        case "top-right":
          leftPercent = 100 - widthPercent - paddingPercentX;
          topPercent = paddingPercentY;
          break;
        case "center":
          leftPercent = 50 - widthPercent / 2;
          topPercent = 50 - heightPercent / 2;
          break;
        case "bottom-left":
          leftPercent = paddingPercentX;
          topPercent = 100 - heightPercent - paddingPercentY;
          break;
        case "bottom-center":
          leftPercent = 50 - widthPercent / 2;
          topPercent = 100 - heightPercent - paddingPercentY;
          break;
        case "bottom-right":
          leftPercent = 100 - widthPercent - paddingPercentX;
          topPercent = 100 - heightPercent - paddingPercentY;
          break;
        default:
          leftPercent = 100 - widthPercent - paddingPercentX;
          topPercent = 100 - heightPercent - paddingPercentY;
      }
    } else {
      leftPercent = (manualX / 100) * (100 - widthPercent);
      topPercent = (1 - (manualY / 100)) * (100 - heightPercent);
    }

    return {
      left: Math.max(0, Math.min(100 - widthPercent, leftPercent)),
      top: Math.max(0, Math.min(100 - heightPercent, topPercent)),
      width: widthPercent,
      height: heightPercent
    };
  };

  // 5. Drag/Snap pointer actions directly onto the live document canvas
  const handlePreviewContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveContainerRef.current) return;
    setAlignMode("manual");

    const stampPdfWidth = 145 * (stampScale / 100);
    const stampPdfHeight = 72 * (stampScale / 100);
    const widthPercent = (stampPdfWidth / pdfPageSize.width) * 100;
    const heightPercent = (stampPdfHeight / pdfPageSize.height) * 100;

    const dragRect = interactiveContainerRef.current.getBoundingClientRect();

    const updatePosition = (clientX: number, clientY: number) => {
      const mouseX = clientX - dragRect.left;
      const mouseY = clientY - dragRect.top;

      const pressXPercent = (mouseX / dragRect.width) * 100;
      const pressYPercent = (mouseY / dragRect.height) * 100;

      const dragLeftPercent = pressXPercent - widthPercent / 2;
      const dragTopPercent = pressYPercent - heightPercent / 2;

      const denominatorX = 100 - widthPercent;
      const denominatorY = 100 - heightPercent;

      let mX = denominatorX > 0 ? (dragLeftPercent / denominatorX) * 100 : 0;
      let mY = denominatorY > 0 ? (1 - dragTopPercent / denominatorY) * 100 : 0;

      mX = Math.max(0, Math.min(100, mX));
      mY = Math.max(0, Math.min(100, mY));

      setManualX(Math.round(mX));
      setManualY(Math.round(mY));
    };

    updatePosition(e.clientX, e.clientY);

    const handlePointerMove = (moveEv: PointerEvent) => {
      updatePosition(moveEv.clientX, moveEv.clientY);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Handle Target PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a valid PDF paper file.");
      return;
    }

    try {
      setSelectedFile(file);
      setPdfName(file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPdfPagesCount(pdfDoc.getPageCount());
      toast.success(`PDF "${file.name}" loaded: ${pdfDoc.getPageCount()} pages identified.`);
    } catch (err) {
      console.error(err);
      toast.error("Security parsing error. Failed to unpack PDF metadata.");
    }
  };

  // --- DYNAMIC STAMP DRAWING ALGORITHM ---
  const drawStampOnCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Set drawing styles
    ctx.fillStyle = makerColor;
    ctx.strokeStyle = makerColor;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.save();
    
    // Apply slant tilt rotation if any
    if (makerTilt !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate((makerTilt * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Optional border
    if (makerHasBorder) {
      ctx.lineWidth = makerBorderThickness;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      if (makerBorderThickness > 1.5) {
        ctx.lineWidth = 1;
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
      }
    }

    // Text details (Horizontal Centering)
    ctx.textAlign = "center";

    // Line 1: Devenagari Designation (e.g. वरिष्ठ मंडल कार्मिक अधिकारी)
    ctx.font = "bold 23px 'Mukta', 'Inter', system-ui, sans-serif";
    ctx.fillText(makerHindiDesig || "", centerX, 46);

    // Line 2: English Designation (e.g. Senior Divisional Personnel Officer)
    ctx.font = "600 17px 'Inter', system-ui, sans-serif";
    ctx.fillText(makerEngDesig || "", centerX, 80);

    // Line 3: Devenagari Office (e.g. पू० सी० रेल, कटिहार)
    ctx.font = "500 17px 'Mukta', 'Inter', system-ui, sans-serif";
    ctx.fillText(makerHindiOrg || "", centerX, 114);

    // Line 4: English Office (e.g. N. F. Railway, Katihar)
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.fillText(makerEngOrg || "", centerX, 146);

    ctx.restore();

    // Realistic rubber stamp ink decay grunge texture
    if (makerGrunge) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";

      // 1. Draw tiny erratic dots cutting through the ink
      for (let i = 0; i < 240; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 0.4 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 2. Draw fine scratch lines cutting through letters
      for (let i = 0; i < 5; i++) {
        ctx.lineWidth = 0.5 + Math.random();
        ctx.beginPath();
        const yLine = Math.random() * canvas.height;
        ctx.moveTo(8, yLine);
        ctx.lineTo(canvas.width - 8, yLine + (Math.random() * 10 - 5));
        ctx.stroke();
      }

      // 3. Draw a few larger ink smudges / skips
      for (let i = 0; i < 4; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = 3 + Math.random() * 8;
        const h = 1 + Math.random() * 4;
        ctx.fillRect(x, y, w, h);
      }

      ctx.restore();
    }
  };

  // Keep live preview updated on canvas
  useEffect(() => {
    if (stampFormTab === "builder" && previewCanvasRef.current) {
      drawStampOnCanvas(previewCanvasRef.current);
    }
  }, [
    stampFormTab,
    makerHindiDesig,
    makerEngDesig,
    makerHindiOrg,
    makerEngOrg,
    makerColor,
    makerHasBorder,
    makerBorderThickness,
    makerTilt,
    makerGrunge
  ]);

  // Handle saving the dynamic builder stamp with offline local storage fallback
  const handleSaveBuiltStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewCanvasRef.current) return;

    if (!makerHindiDesig.trim() && !makerEngDesig.trim()) {
      toast.error("Designation text is empty. Provide at least English or Hindi designation.");
      return;
    }

    setLoadingStamps(true);
    const base64Png = previewCanvasRef.current.toDataURL("image/png");
    const titleClean = (makerEngDesig.trim() || makerHindiDesig.trim() || "DYNAMIC_STAMP")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .slice(0, 28);
    
    const payload = {
      title: `STAMP_${titleClean}`,
      imageData: base64Png,
      createdAt: new Date().toISOString(),
      createdBy: "DRM Personnel Branch Builder"
    };

    try {
      // 1. Attempt Firestore write
      const docRef = await addDoc(collection(db, "sec_office_stamps"), payload);
      setCustomStamps(prev => [{ id: docRef.id, ...payload }, ...prev]);
      setSelectedStampId(docRef.id);
      toast.success(`Dynamic Stamp "${payload.title}" generated & saved to Cloud database!`);

      // Write Audit log (Optional)
      try {
        await addDoc(collection(db, "audit_logs"), {
          type: "SECURITY_STAMP_ADDED",
          action: `Assembled dynamic designation stamp and saved to database: "${payload.title}"`,
          details: { title: payload.title, id: docRef.id },
          user: "Admin / Personnel Officer",
          timestamp: new Date().toISOString(),
          agent: "Secured PDF Stamp Studio"
        });
      } catch (logErr) {
        console.warn("Audit logger skipped:", logErr);
      }
    } catch (err: any) {
      console.warn("Firestore save failed, fallback to local storage:", err);
      // Generate a client-only ID
      const localId = `local_${Date.now()}`;
      const newLocalStamp = { id: localId, ...payload, isLocal: true };

      try {
        const saved = localStorage.getItem("local_sec_office_stamps");
        const currentLocal = saved ? JSON.parse(saved) : [];
        currentLocal.unshift(newLocalStamp);
        localStorage.setItem("local_sec_office_stamps", JSON.stringify(currentLocal));

        setCustomStamps(prev => [newLocalStamp, ...prev]);
        setSelectedStampId(localId);
        toast.success(`Generated & Saved Locally (डेटाबेस कनेक्ट नहीं हुआ; ब्राउज़र लोकल स्टोरेज में सुरक्षित किया गया)`);
      } catch (lsErr) {
        console.error("Local storage error:", lsErr);
        toast.error(`Could not save stamp: ${err?.message || err}`);
      }
    } finally {
      setLoadingStamps(false);
    }
  };

  // Automatically preprocess raw signature uploaded image to create a transparent PNG
  useEffect(() => {
    if (!rawSigBase64) {
      setProcessedSigBase64(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessedSigBase64(rawSigBase64);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      // We will loop through pixels in raw image
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        // Calculate average brightness
        const brightness = (r + g + b) / 3;
        
        if (brightness > sigThreshold) {
          // If average brightness is above our cut-off slider, make it completely transparent
          data[i+3] = 0;
        } else if (sigEnhanceInk) {
          // Enrich ink: darken the lines slightly to make standard pen ink pop (contrast increase)
          data[i] = Math.max(0, r - 30);
          data[i+1] = Math.max(0, g - 30);
          data[i+2] = Math.max(0, b - 30);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setProcessedSigBase64(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      toast.error("Failed to load uploaded signature image.");
    };
    img.src = rawSigBase64;
  }, [rawSigBase64, sigThreshold, sigEnhanceInk]);

  // Convert uploaded signature file to base64 for processing
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (.png, .jpg, .jpeg).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawSigBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save preprocessed signature to database / localStorage
  const handleSaveSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processedSigBase64) {
      toast.error("Please upload a signature photo/scanned image first.");
      return;
    }

    setLoadingStamps(true);
    const rawTitle = sigTitle.trim() || `SIGN_STAMP_${Date.now().toString().slice(-6)}`;
    const titleClean = `SIG_${rawTitle.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
    const payload = {
      title: titleClean,
      imageData: processedSigBase64,
      createdAt: new Date().toISOString(),
      createdBy: "Signature Stamp Studio"
    };

    try {
      // 1. Attempt Firestore write
      const docRef = await addDoc(collection(db, "sec_office_stamps"), payload);
      setCustomStamps(prev => [{ id: docRef.id, ...payload }, ...prev]);
      
      setRawSigBase64(null);
      setProcessedSigBase64(null);
      setSigTitle("");
      setSelectedStampId(docRef.id);
      toast.success(`Signature "${titleClean}" added successfully to Cloud repository!`);

      // Optional Audit logger
      try {
        await addDoc(collection(db, "audit_logs"), {
          type: "SECURITY_STAMP_ADDED",
          action: `Permanently uploaded new signature to divisional repository: "${payload.title}"`,
          details: { title: payload.title, id: docRef.id },
          user: "Admin / Personnel Officer",
          timestamp: new Date().toISOString(),
          agent: "Secured PDF Stamp Studio"
        });
      } catch (logErr) {
        console.warn("Audit log write skipped:", logErr);
      }
    } catch (err: any) {
      console.warn("Firestore upload failed, fallback to local storage:", err);
      const localId = `local_${Date.now()}`;
      const newLocalStamp = { id: localId, ...payload, isLocal: true };

      try {
        const saved = localStorage.getItem("local_sec_office_stamps");
        const currentLocal = saved ? JSON.parse(saved) : [];
        currentLocal.unshift(newLocalStamp);
        localStorage.setItem("local_sec_office_stamps", JSON.stringify(currentLocal));

        setCustomStamps(prev => [newLocalStamp, ...prev]);
        setRawSigBase64(null);
        setProcessedSigBase64(null);
        setSigTitle("");
        setSelectedStampId(localId);
        toast.success(`Signature "${titleClean}" saved successfully to Local browser storage!`);
      } catch (lsErr) {
        console.error("Local storage error:", lsErr);
        toast.error(`Could not save signature: ${err?.message || err}`);
      }
    } finally {
      setLoadingStamps(false);
    }
  };

  // Convert uploaded handwritten sign or seal file to Base64
  const handleStampImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image stamp (.png, .jpg).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Persistently save a custom uploaded sign to Firestore or local storage fallback
  const handleSaveCustomStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedBase64) {
      toast.error("Choose a valid transparent signature file first.");
      return;
    }
    if (!newStampTitle.trim()) {
      toast.error("Specify a label title for this signature.");
      return;
    }

    setLoadingStamps(true);
    const payload = {
      title: newStampTitle.trim(),
      imageData: uploadedBase64,
      createdAt: new Date().toISOString(),
      createdBy: "DRM Personnel Branch Admin"
    };

    try {
      // 1. Attempt Firestore write
      const docRef = await addDoc(collection(db, "sec_office_stamps"), payload);
      setCustomStamps(prev => [{ id: docRef.id, ...payload }, ...prev]);
      
      setUploadedBase64(null);
      setNewStampTitle("");
      setSelectedStampId(docRef.id);
      toast.success("New seal added successfully to Cloud repository!");

      // Optional Audit logger
      try {
        await addDoc(collection(db, "audit_logs"), {
          type: "SECURITY_STAMP_ADDED",
          action: `Permanently uploaded new stamp to divisional repository: "${payload.title}"`,
          details: { title: payload.title, id: docRef.id },
          user: "Admin / Personnel Officer",
          timestamp: new Date().toISOString(),
          agent: "Secured PDF Stamp Studio"
        });
      } catch (logErr) {
        console.warn("Audit log write skipped:", logErr);
      }
    } catch (err: any) {
      console.warn("Firestore upload failed, fallback to local storage:", err);
      const localId = `local_${Date.now()}`;
      const newLocalStamp = { id: localId, ...payload, isLocal: true };

      try {
        const saved = localStorage.getItem("local_sec_office_stamps");
        const currentLocal = saved ? JSON.parse(saved) : [];
        currentLocal.unshift(newLocalStamp);
        localStorage.setItem("local_sec_office_stamps", JSON.stringify(currentLocal));

        setCustomStamps(prev => [newLocalStamp, ...prev]);
        setUploadedBase64(null);
        setNewStampTitle("");
        setSelectedStampId(localId);
        toast.success("Seal added successfully to Local browser storage! (ब्राउज़र लोकल स्टोरेज में सुरक्षित किया गया)");
      } catch (lsErr) {
        console.error("Local storage error:", lsErr);
        toast.error(`Could not save uploaded seal: ${err?.message || err}`);
      }
    } finally {
      setLoadingStamps(false);
    }
  };

  // Delete customized stamp templates persistently from Firestore or LocalStorage
  const handleDeleteStamp = async (stampId: string, title: string) => {
    setLoadingStamps(true);
    try {
      if (stampId.startsWith("local_")) {
        // Delete from local storage
        const saved = localStorage.getItem("local_sec_office_stamps");
        if (saved) {
          const currentLocal = JSON.parse(saved);
          const filtered = currentLocal.filter((s: any) => s.id !== stampId);
          localStorage.setItem("local_sec_office_stamps", JSON.stringify(filtered));
        }
        setCustomStamps(prev => prev.filter(s => s.id !== stampId));
        if (selectedStampId === stampId) {
          setSelectedStampId(prevId => {
            const remaining = customStamps.filter(s => s.id !== stampId);
            return remaining.length > 0 ? remaining[0].id : "";
          });
        }
        toast.success("Official stamp deleted from browser storage.");
      } else {
        // Delete from Cloud Firestore
        await deleteDoc(doc(db, "sec_office_stamps", stampId));
        setCustomStamps(prev => prev.filter(s => s.id !== stampId));
        if (selectedStampId === stampId) {
          setSelectedStampId(prevId => {
            const remaining = customStamps.filter(s => s.id !== stampId);
            return remaining.length > 0 ? remaining[0].id : "";
          });
        }

        try {
          await addDoc(collection(db, "audit_logs"), {
            type: "SECURITY_STAMP_DELETED",
            action: `Removed custom stamp signature: "${title}"`,
            details: { title, id: stampId },
            user: "Admin / Personnel Officer",
            timestamp: new Date().toISOString(),
            agent: "Secured PDF Stamp Studio"
          });
        } catch (logErr) {
          console.warn("Audit logger delete skipped:", logErr);
        }

        toast.success("Official stamp deleted from Cloud repository.");
      }
    } catch (err) {
      console.error("Deletion error:", err);
      // Fallback clean local copy to be safe
      const saved = localStorage.getItem("local_sec_office_stamps");
      if (saved) {
        const currentLocal = JSON.parse(saved);
        const filtered = currentLocal.filter((s: any) => s.id !== stampId);
        localStorage.setItem("local_sec_office_stamps", JSON.stringify(filtered));
      }
      setCustomStamps(prev => prev.filter(s => s.id !== stampId));
      toast.success("Removed template from current register.");
    } finally {
      setLoadingStamps(false);
    }
  };

  // Browser-computed PDF dynamic overlay drawing
  const handleProcessPdfStamping = async () => {
    if (!selectedFile) {
      toast.error("Please upload the target PDF template file first.");
      return;
    }

    let activeDataUrl = "";
    const builtIn = builtInStamps.find(s => s.id === selectedStampId);
    if (builtIn) {
      activeDataUrl = builtIn.dataUrl;
    } else {
      const custom = customStamps.find(s => s.id === selectedStampId);
      if (custom) {
        activeDataUrl = custom.imageData;
      }
    }

    if (!activeDataUrl) {
      toast.error("No active authority seal coordinates selected.");
      return;
    }

    setProcessingPdf(true);
    try {
      const fileBytes = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const totalPagesInDoc = pages.length;

      // Extract image raw bytes from metadata header
      const pngBase64Raw = activeDataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
      const pngUint8Array = Uint8Array.from(atob(pngBase64Raw), c => c.charCodeAt(0));
      const isJpg = activeDataUrl.startsWith("data:image/jpeg") || activeDataUrl.startsWith("data:image/jpg");
      const embeddedImage = isJpg ? await pdfDoc.embedJpg(pngUint8Array) : await pdfDoc.embedPng(pngUint8Array);

      // Map target pages configuration
      const targetIndices: number[] = [];
      if (targetPagesOption === "first") {
        targetIndices.push(0);
      } else if (targetPagesOption === "last") {
        targetIndices.push(totalPagesInDoc - 1);
      } else if (targetPagesOption === "all") {
        for (let i = 0; i < totalPagesInDoc; i++) targetIndices.push(i);
      } else {
        const parsed = customPagesString.split(",")
          .map(p => parseInt(p.trim(), 10))
          .filter(p => !isNaN(p) && p >= 1 && p <= totalPagesInDoc)
          .map(p => p - 1);
        targetIndices.push(...parsed);
      }

      if (targetIndices.length === 0) {
        throw new Error("Target pages selection produced empty list. Check custom page box.");
      }

      // Loop page-wise stamping
      for (const idx of targetIndices) {
        const page = pages[idx];
        const { width: pWidth, height: pHeight } = page.getSize();

        // Standard scaling calculations
        const baseWidth = 145;
        const baseHeight = 72;
        const width = baseWidth * (stampScale / 100);
        const height = baseHeight * (stampScale / 100);

        let posX = 0;
        let posY = 0;

        if (alignMode === "preset") {
          const padding = 25;
          switch (positionPreset) {
            case "top-left":
              posX = padding;
              posY = pHeight - height - padding;
              break;
            case "top-right":
              posX = pWidth - width - padding;
              posY = pHeight - height - padding;
              break;
            case "top-center":
              posX = (pWidth - width) / 2;
              posY = pHeight - height - padding;
              break;
            case "center":
              posX = (pWidth - width) / 2;
              posY = (pHeight - height) / 2;
              break;
            case "bottom-left":
              posX = padding;
              posY = padding;
              break;
            case "bottom-right":
              posX = pWidth - width - padding;
              posY = padding;
              break;
            case "bottom-center":
              posX = (pWidth - width) / 2;
              posY = padding;
              break;
            default:
              posX = pWidth - width - padding;
              posY = padding;
          }
        } else {
          // Manual slider offsets
          posX = (manualX / 100) * (pWidth - width);
          posY = (manualY / 100) * (pHeight - height);
        }

        page.drawImage(embeddedImage, {
          x: posX,
          y: posY,
          width: width,
          height: height,
          rotate: degrees(stampRotation),
          opacity: stampOpacity / 100
        });
      }

      const stampedPdfBytes = await pdfDoc.save();

      // Download file action
      const blob = new Blob([stampedPdfBytes], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      const cleanOriginalName = selectedFile.name.replace(/\.pdf$/i, "");
      const selectedLabelClean = (builtIn?.title || customStamps.find(s => s.id === selectedStampId)?.title || "stamped")
        .replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

      anchor.download = `${cleanOriginalName}_[MARKED_${selectedLabelClean}].pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);

      // Create Audit Log
      await addDoc(collection(db, "audit_logs"), {
        type: "PDF_STAMPED",
        action: `Digitally branded PDF document with secure signature: "${selectedFile.name}"`,
        details: {
          fileName: selectedFile.name,
          pagesStamped: targetIndices.map(v => v + 1),
          stampUsed: selectedStampId,
          stampScale,
          totalPdfPages: totalPagesInDoc
        },
        user: "Personnel Officer / Security Admin",
        timestamp: new Date().toISOString(),
        agent: "Secured PDF Stamp Studio"
      });

      toast.success("PDF document successfully stamped and downloaded!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Stamping failure: ${err.message || "Unknown error inside PDF Engine"}`);
    } finally {
      setProcessingPdf(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stamp className="w-5.5 h-5.5 text-indigo-600" />
            Personnel Branch PDF Stamp Studio (कार्यालयीन डिजिटल सील और संकेत)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            "Office Use Only" panel where you can persistently upload 3-4 signatures or stamps, import a target PDF order, and accurately brand them with coordinates.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 self-start md:self-auto shrink-0">
          <Lock className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800">Classified/Admin Console</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Repository & Stamp Upload manager (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
              1. Select Digital Authority Seal
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Select standard predefined office shapes or use custom signatures loaded in your cloud database cache.
            </p>

            {/* List Selection Grid */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Persisted Administrative Signatures & Stamps</div>
              {loadingStamps ? (
                <div className="flex items-center justify-center py-4 text-xs text-slate-400 font-mono gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" /> Connecting to repository...
                </div>
              ) : customStamps.length === 0 ? (
                <div className="text-center py-5 bg-white rounded border border-dashed text-slate-400 text-xs font-semibold">
                  No customized marks in database registry yet. Upload below! (3-4 stamps limits)
                </div>
              ) : (
                customStamps.map((stamp) => (
                  <div 
                    key={stamp.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all min-h-[52px] ${
                      selectedStampId === stamp.id 
                      ? "bg-indigo-50/40 border-indigo-600 shadow-sm" 
                      : "bg-white border-transparent hover:border-gray-200"
                    }`}
                  >
                    {stampIdToDelete === stamp.id ? (
                      <div className="flex-1 flex items-center justify-between bg-rose-50 border border-rose-100 p-1.5 rounded-md animate-fadeIn">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="text-[10px] font-bold text-rose-800 truncate">
                            Delete "{stamp.title.length > 20 ? stamp.title.slice(0, 17) + "..." : stamp.title}"?
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteStamp(stamp.id, stamp.title);
                              setStampIdToDelete(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-extrabold px-1.5 py-1 rounded transition-colors uppercase cursor-pointer"
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setStampIdToDelete(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-extrabold px-1.5 py-1 rounded transition-colors uppercase cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                          <input 
                            type="radio" 
                            name="active-stamp-radio" 
                            value={stamp.id}
                            checked={selectedStampId === stamp.id}
                            onChange={() => setSelectedStampId(stamp.id)}
                            className="accent-indigo-600 w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-slate-700 truncate">{stamp.title}</span>
                              {stamp.isLocal ? (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap uppercase tracking-wider scale-90">
                                  Local
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap uppercase tracking-wider scale-90">
                                  Cloud
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5 text-gray-400" />
                              {new Date(stamp.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </label>
                        <img 
                          src={stamp.imageData} 
                          alt={stamp.title} 
                          className="w-16 h-8 object-contain border border-gray-100 bg-white rounded shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          type="button"
                          onClick={() => setStampIdToDelete(stamp.id)}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-rose-50 rounded transition-colors shrink-0 cursor-pointer"
                          title="Purge official stamp permanent cache template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}

            </div>
          </div>

          {/* Dynamic Stamp Form Tabs Container */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl overflow-hidden p-4 space-y-4 shadow-sm">
            
            {/* Tabs Trigger Header */}
            <div className="flex bg-slate-200/60 p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setStampFormTab("builder")}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  stampFormTab === "builder"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Build Seal (सील मेकर)
              </button>
              <button
                type="button"
                onClick={() => setStampFormTab("upload")}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  stampFormTab === "upload"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File (फाइल अपलोड)
              </button>
              <button
                type="button"
                onClick={() => setStampFormTab("signature")}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  stampFormTab === "signature"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Signature (हस्ताक्षर)
              </button>
            </div>

            {/* TAB CONTENT: BUILDER */}
            {stampFormTab === "builder" && (
              <form onSubmit={handleSaveBuiltStamp} className="space-y-4 animate-fadeIn">
                <div className="border-b pb-2">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                    <Stamp className="w-4 h-4 text-indigo-600" />
                    Dynamic Designation Stamp Builder
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Type your designation and location details. The engine crafts a high-resolution, transparent, realistic authority seal with optional ink decay.
                  </p>
                </div>

                {/* Live Preview Stage */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-inner flex flex-col items-center justify-center gap-2">
                  <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
                    Live Stamp Canvas Preview (पारदर्शी पूर्वावलोकन)
                  </div>
                  
                  {/* Real Canvas element */}
                  <div className="border border-slate-100 rounded-lg p-1 bg-slate-50/50 shadow-xs">
                    <canvas
                      ref={previewCanvasRef}
                      width={440}
                      height={180}
                      className="w-full max-w-[280px] bg-white border border-gray-100 rounded shadow-sm object-contain"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 italic">
                    Resolution: 440×180px PNG (Alpha Embedded)
                  </span>
                </div>

                {/* Custom input fields */}
                <div className="space-y-3">
                  {/* Quick Select Preset Designations */}
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 shadow-xs space-y-2">
                    <span className="block text-[10px] uppercase font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      Rapid Designation Stamp Presets (त्वरित पदनाम चयन):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        {
                          label: "Assistant Personnel Officer (APO)",
                          sub: "सहायक कार्मिक अधिकारी",
                          hindi: "सहायक कार्मिक अधिकारी",
                          english: "Assistant Personnel Officer"
                        },
                        {
                          label: "Sr. Divisional Personnel Officer (Sr. DPO)",
                          sub: "वरिष्ठ मंडल कार्मिक अधिकारी",
                          hindi: "वरिष्ठ मंडल कार्मिक अधिकारी",
                          english: "Senior Divisional Personnel Officer"
                        },
                        {
                          label: "Divisional Personnel Officer (DPO)",
                          sub: "मंडल कार्मिक अधिकारी",
                          hindi: "मंडल कार्मिक अधिकारी",
                          english: "Divisional Personnel Officer"
                        },
                        {
                          label: "Personnel Officer (PO)",
                          sub: "कार्मिक अधिकारी",
                          hindi: "कार्मिक अधिकारी",
                          english: "Personnel Officer"
                        },
                        {
                          label: "Divisional Railway Manager (DRM / P)",
                          sub: "मंडल रेल प्रबंधक (का०)",
                          hindi: "मंडल रेल प्रबंधक (का०)",
                          english: "Divisional Railway Manager (P)"
                        },
                        {
                          label: "APO Welfare",
                          sub: "सहायक कार्मिक अधिकारी (कल्याण)",
                          hindi: "सहायक कार्मिक अधिकारी (कल्याण)",
                          english: "Assistant Personnel Officer (Welfare)"
                        }
                      ].map((preset) => {
                        const isSelected = makerEngDesig === preset.english && makerHindiDesig === preset.hindi;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setMakerHindiDesig(preset.hindi);
                              setMakerEngDesig(preset.english);
                              toast.success(`Designation changed to: ${preset.english}`);
                            }}
                            className={`p-2 text-left rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-center ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-700 text-white shadow-sm ring-2 ring-indigo-600/20"
                                : "bg-white border-slate-200 text-slate-800 hover:bg-indigo-50/50 hover:border-indigo-200"
                            }`}
                          >
                            <span className="text-[10px] font-bold leading-tight">{preset.label}</span>
                            <span className={`text-[9px] mt-0.5 leading-none ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>{preset.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Line 1: Hindi Designation */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                      Designation in Hindi (पदनाम हिंदी में) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={makerHindiDesig}
                      onChange={(e) => setMakerHindiDesig(e.target.value)}
                      placeholder="e.g. वरिष्ठ मंडल कार्मिक अधिकारी"
                      className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 bg-white"
                      required
                    />
                  </div>

                  {/* Line 2: English Designation */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                      Designation in English (अंग्रेजी में) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={makerEngDesig}
                      onChange={(e) => setMakerEngDesig(e.target.value)}
                      placeholder="e.g. Senior Divisional Personnel Officer"
                      className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 bg-white"
                      required
                    />
                  </div>

                  {/* Row: Hindi & English Division info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                        Office (Hindi)
                      </label>
                      <input
                        type="text"
                        value={makerHindiOrg}
                        onChange={(e) => setMakerHindiOrg(e.target.value)}
                        placeholder="e.g. पू० सी० रेल, कटिहार"
                        className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">
                        Office (English)
                      </label>
                      <input
                        type="text"
                        value={makerEngOrg}
                        onChange={(e) => setMakerEngOrg(e.target.value)}
                        placeholder="e.g. N. F. Railway, Katihar"
                        className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
                      />
                    </div>
                  </div>

                  {/* Styling Matrix */}
                  <div className="bg-white/80 p-3 rounded-lg border border-slate-200/60 space-y-3">
                    
                    {/* Ink color presets */}
                    <div>
                      <span className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1.5">
                        Seal Ink Color (स्याही का रंग)
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { name: "Royal Indigo", value: "#2563eb" },
                          { name: "Military Blue", value: "#1e40af" },
                          { name: "Official Blue", value: "#1d4ed8" },
                          { name: "Urgent Red", value: "#dc2626" },
                          { name: "Approved Green", value: "#16a34a" },
                          { name: "Classic Purple", value: "#7c3aed" },
                          { name: "Black Carbon", value: "#1f2937" }
                        ].map((ink) => (
                          <button
                            key={ink.value}
                            type="button"
                            onClick={() => setMakerColor(ink.value)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                              makerColor === ink.value
                                ? "scale-110 border-slate-800 shadow-md"
                                : "border-transparent hover:scale-105 animate-none"
                            }`}
                            style={{ backgroundColor: ink.value }}
                            title={ink.name}
                          >
                            {makerColor === ink.value && (
                              <span className="text-[9px] font-bold text-white">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Has Border, grunge, and slight tilt sliders */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <label className="flex items-center gap-1.5 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={makerGrunge}
                          onChange={(e) => setMakerGrunge(e.target.checked)}
                          className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="text-[10px] uppercase font-black text-slate-700">
                          Realistic Ink Decay
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-1.5 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={makerHasBorder}
                          onChange={(e) => setMakerHasBorder(e.target.checked)}
                          className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="text-[10px] uppercase font-black text-slate-700">
                          Add Outer Border
                        </div>
                      </label>
                    </div>

                    {/* Border parameters if checked */}
                    {makerHasBorder && (
                      <div className="pt-1 flex items-center gap-4 border-t border-slate-100">
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 mb-1">
                            <span>Border Weight:</span>
                            <span className="font-mono text-indigo-600">{makerBorderThickness}px</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={makerBorderThickness}
                            onChange={(e) => setMakerBorderThickness(Number(e.target.value))}
                            className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Slanted tilt slider */}
                    <div className="pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 mb-1">
                        <span>Natural Manual Stamp Rotation (झुकाव):</span>
                        <span className="font-mono text-indigo-600">{makerTilt}°</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="15"
                        value={makerTilt}
                        step="0.5"
                        onChange={(e) => setMakerTilt(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingStamps}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Stamp className="w-3.5 h-3.5" />
                  Generate, Save & Select Dynamic Stamp
                </button>
              </form>
            )}

            {/* TAB CONTENT: UPLOAD */}
            {stampFormTab === "upload" && (
              <form onSubmit={handleSaveCustomStamp} className="space-y-3 animate-fadeIn">
                <div className="border-b pb-2">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Pre-Scanned File (PNG / JPEG)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Upload manual designs, signatures or custom circular dry ink seals on clean transparent backgrounds.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Custom Seal Title/Label</label>
                  <input
                    type="text"
                    value={newStampTitle}
                    onChange={(e) => setNewStampTitle(e.target.value)}
                    placeholder="e.g. CELL_OFFICER_STAMP"
                    className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Select File Asset</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStampImageUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                </div>

                {uploadedBase64 && (
                  <div className="p-2 border border-dashed rounded bg-white flex flex-col items-center justify-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-amber-600">Selected Image Preview:</span>
                    <img
                      src={uploadedBase64}
                      alt="Current preview upload file"
                      className="max-h-16 object-contain rounded border"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingStamps || !uploadedBase64 || !newStampTitle.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Save Custom Seal Template Permanently
                </button>
              </form>
            )}

            {/* TAB CONTENT: SIGNATURE */}
            {stampFormTab === "signature" && (
              <form onSubmit={handleSaveSignature} className="space-y-3 animate-fadeIn">
                <div className="border-b pb-2">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5" />
                    Upload Handwritten Signature (हस्ताक्षर अपलोड)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Upload scanned signature or pen signature photo (JPG/JPEG/PNG). The engine automatically converts white background paper to transparent transparent ink!
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Select signature photo (JPG/JPEG/PNG)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                </div>

                {rawSigBase64 && (
                  <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Original (मूल फ़ोटो):</span>
                        <div className="p-1 border bg-slate-100 rounded w-full flex items-center justify-center min-h-[96px]">
                          <img
                            src={rawSigBase64}
                            alt="Original signature"
                            className="max-h-20 object-contain rounded"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold uppercase text-emerald-600 font-sans">Transparent (पारदर्शी):</span>
                        <div className="p-1 border bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZHRoPSI0IiBmaWxsPSIjZThlOGU4Ii8+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNlOGU4ZTgiLz4KPC9zdmc+')] rounded w-full flex items-center justify-center min-h-[96px]">
                          {processedSigBase64 ? (
                            <img
                              src={processedSigBase64}
                              alt="Transparent result"
                              className="max-h-20 object-contain rounded"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-[8px] text-slate-400">Processing...</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* background threshold slider controls */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                        <span>Background Cleaning Cut-off (पृष्ठभूमि शोधन सीमा):</span>
                        <span className="font-mono text-indigo-600">{sigThreshold} / 255</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="250"
                        value={sigThreshold}
                        onChange={(e) => setSigThreshold(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                      <p className="text-[8px] text-slate-400 italic leading-tight">
                        * Increase if white paper borders still appear. Decrease if signature strokes are fading out.
                      </p>
                    </div>

                    {/* ink boost checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={sigEnhanceInk}
                        onChange={(e) => setSigEnhanceLink(e.target.checked)}
                        className="accent-indigo-600 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] text-slate-700 font-semibold select-none">
                        Rich Dark Ink Polish (हस्ताक्षर की स्याही गाढ़ा करें)
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingStamps || !processedSigBase64}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save & Place Signature (हस्ताक्षर सहेजें और चुनें)
                </button>
              </form>
            )}

          </div>

        </div>

        {/* Right Column: PDF upload, page settings and visual overlay config (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-slate-50/60 p-5 rounded-lg border border-slate-200/80 space-y-5">
            
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              2. Import Target Document & Setup Position
            </h2>

            {/* Target PDF Upload block */}
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Upload Target Office Document (.pdf) (दस्तावेज़ का चयन करें)
              </label>
              <div className="relative border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-md p-4 transition-colors text-center cursor-pointer bg-slate-50/50">
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                <span className="text-xs font-bold block text-gray-600">
                  {selectedFile ? selectedFile.name : "Click here to choose PDF file"}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">
                  Once imported, we discover total pages automatically
                </span>
              </div>

              {selectedFile && pdfPagesCount > 0 && (
                <div className="mt-3 flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded">
                  <span className="font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    File analyzed securely in browser.
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Total Pages: {pdfPagesCount}
                  </span>
                </div>
              )}
            </div>

            {/* Display / Position settings */}
            <div className="space-y-4 pt-1">
              
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-3.5 h-3.5" />
                Placement Settings & Config Matrix
              </div>

              {/* Target Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Apply Seal On Pages:</label>
                  <select 
                    value={targetPagesOption}
                    onChange={(e: any) => setTargetPagesOption(e.target.value)}
                    className="w-full text-xs font-semibold border rounded px-2.5 py-1.5 bg-white text-gray-700"
                  >
                    <option value="all">Every Page (सभी पृष्ठों पर)</option>
                    <option value="first">First Page Only (Page 1) (प्रथम पृष्ठ)</option>
                    <option value="last">Last Page / Enclosure (अंतिम पृष्ठ)</option>
                    <option value="custom">Custom Page Numbers... (कस्टम संख्या)</option>
                  </select>
                </div>

                {targetPagesOption === "custom" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Comma-separated page list:</label>
                    <input 
                      type="text" 
                      value={customPagesString}
                      onChange={(e) => setCustomPagesString(e.target.value)}
                      placeholder="e.g. 1,3,4"
                      className="w-full text-xs border rounded-md px-2.5 py-1.5 bg-white font-mono focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-gray-400 mt-0.5 block">Valid bounds: 1 to {pdfPagesCount || "N/A"}.</span>
                  </div>
                )}
              </div>

              {/* Slider customization dials */}
              <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-xs space-y-4">
                
                {/* Size Scaler */}
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-700 font-semibold mb-1">
                    <span>Seal Physical Scale (आकार):</span>
                    <span className="font-mono text-indigo-600 font-bold">{stampScale}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="220" 
                    value={stampScale}
                    onChange={(e) => setStampScale(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Opacity/Transparency */}
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-700 font-semibold mb-1">
                    <span>Ink Transparency (पारदर्शिता):</span>
                    <span className="font-mono text-indigo-600 font-bold">{stampOpacity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="100" 
                    value={stampOpacity}
                    onChange={(e) => setStampOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Angled rotations */}
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-700 font-semibold mb-1">
                    <span>Angled Rotational Tilt (झुकाव):</span>
                    <span className="font-mono text-indigo-600 font-bold">{stampRotation}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="-180" 
                    max="180" 
                    value={stampRotation}
                    onChange={(e) => setStampRotation(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

              </div>

              {/* Coordinate alignment configurations */}
              <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-xs space-y-3">
                
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-gray-700">Display Alignment Zones:</span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setAlignMode("preset")}
                      className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                        alignMode === "preset" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Presets Grid
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAlignMode("manual")}
                      className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                        alignMode === "manual" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Manual Sliders
                    </button>
                  </div>
                </div>

                {alignMode === "preset" ? (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Alignment Sheet Zone:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "top-left", label: "Top-Left" },
                        { id: "top-center", label: "Top-Center" },
                        { id: "top-right", label: "Top-Right" },
                        { id: "center", label: "Page Center" },
                        { id: "bottom-left", label: "Bottom-Left" },
                        { id: "bottom-center", label: "Bottom-Center" },
                        { id: "bottom-right", label: "Bottom-Right" }
                      ].map(preset => (
                        <button 
                          key={preset.id}
                          type="button"
                          onClick={() => setPositionPreset(preset.id)}
                          className={`py-1.5 text-[10px] font-medium rounded border transition-all ${
                            positionPreset === preset.id 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-bold" 
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    
                    {/* Manual X */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                        <span>Horizontal X Offset (शैतिज दूरी):</span>
                        <span className="font-mono text-indigo-600 font-bold">{manualX}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={manualX}
                        onChange={(e) => setManualX(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Manual Y */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                        <span>Vertical Y Offset (ऊर्ध्वाधर दूरी):</span>
                        <span className="font-mono text-indigo-600 font-bold">{manualY}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={manualY}
                        onChange={(e) => setManualY(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* 3. Live Document Interactive Layout Preview Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Stamp className="w-4 h-4 text-emerald-600 animate-pulse" />
                  3. Live Interactive Placement (इंटरेक्टिव प्लेसमेंट)
                </span>
                {selectedFile && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                    Page {previewPageNum} of {pdfPagesCount}
                  </span>
                )}
              </div>

              {!selectedFile ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-gray-200 rounded-lg text-slate-400 text-center bg-slate-50/30">
                  <FileText className="w-8 h-8 text-slate-350 mb-2 opacity-50" />
                  <span className="text-xs font-semibold text-slate-500">No PDF uploaded yet</span>
                  <span className="text-[10px] text-slate-400 mt-1 max-w-[280px]">
                    Upload an office order PDF above to preview pages and interactively click or drag seals.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                    💡 <strong>How to place:</strong> Click anywhere on the document sheet to position the stamp, or hold and drag. Custom tilts, sizes, and opacities reflect automatically.
                  </p>

                  {/* PDF Render Container and Stamp Overlay */}
                  <div className="relative border border-slate-300 rounded shadow-md bg-slate-100 overflow-hidden select-none mx-auto" style={{ maxWidth: '450px' }}>
                    {renderingPage && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-700">Rendering page...</span>
                      </div>
                    )}

                    {/* Interactive drag-and-snap zone */}
                    <div 
                      ref={interactiveContainerRef}
                      onPointerDown={handlePreviewContainerPointerDown}
                      className="relative cursor-crosshair touch-none select-none"
                    >
                      <canvas
                        ref={pdfPreviewCanvasRef}
                        className="block w-full h-auto bg-white"
                      />

                      {/* Visual Seal Overlay */}
                      {(() => {
                        const activeStampDataUrl = getActiveStampDataUrl();
                        if (!activeStampDataUrl) return null;
                        const overlayPos = getOverlayPosition();

                        return (
                          <div
                            className="absolute border border-dashed border-emerald-500/80 pointer-events-none select-none flex items-center justify-center bg-emerald-500/5 transition-all duration-75"
                            style={{
                              left: `${overlayPos.left}%`,
                              top: `${overlayPos.top}%`,
                              width: `${overlayPos.width}%`,
                              height: `${overlayPos.height}%`,
                              opacity: stampOpacity / 100,
                              transform: `rotate(${stampRotation}deg)`,
                            }}
                          >
                            {/* Small draggable indicator badge */}
                            <div className="absolute -top-2.5 -left-2.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-md">
                              <Move className="w-2.5 h-2.5" />
                            </div>

                            <img
                              src={activeStampDataUrl}
                              alt="Live Seal Overlaid"
                              className="w-full h-full object-contain pointer-events-none"
                              referrerPolicy="no-referrer"
                            />

                            {/* Label coordinates tooltip */}
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-mono py-0.5 px-1.5 rounded whitespace-nowrap opacity-75">
                              X: {manualX}%, Y: {manualY}%
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Page Navigator Controls */}
                  {pdfDocInstance && pdfPagesCount > 1 && (
                    <div className="flex items-center justify-between gap-4 w-full bg-slate-50 border border-slate-200 p-2 rounded-lg">
                      <span className="text-[11px] font-bold text-slate-700">
                        Page Navigator:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={previewPageNum === 1}
                          onClick={() => setPreviewPageNum(p => Math.max(1, p - 1))}
                          className="px-2.5 py-1 text-[10px] font-extrabold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          ◀ Back
                        </button>
                        <span className="text-[11px] font-mono font-bold text-slate-800 min-w-[50px] text-center">
                          {previewPageNum} / {pdfPagesCount}
                        </span>
                        <button
                          type="button"
                          disabled={previewPageNum === pdfPagesCount}
                          onClick={() => setPreviewPageNum(p => Math.min(pdfPagesCount, p + 1))}
                          className="px-2.5 py-1 text-[10px] font-extrabold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next ▶
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Run button */}
            <div className="pt-2">
              <button 
                type="button"
                onClick={handleProcessPdfStamping}
                disabled={processingPdf || !selectedFile}
                className="w-full py-3 h-12 bg-[#16a34a] hover:bg-[#15803d] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold uppercase rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {processingPdf ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating Branded PDF Document...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Apply Selected Seal & Download PDF
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
