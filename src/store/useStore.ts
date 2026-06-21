import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, DocumentCategory, DocumentItem, LinkItem, Part2Field } from "../types";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, addDoc, collection } from "firebase/firestore";
import { toast } from "sonner";

export const DEFAULT_PART2_TEMPLATE: Part2Field[] = [
  { id: "p2_1", label: "1 Nature of Chargesheet given (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 1 },
  { id: "p2_2", label: "2 Whether DAR case files is furnished in original (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 2 },
  { id: "p2_3", label: "3 Whether the chargesheet was issued by the competent authority (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 3 },
  { id: "p2_4_a", label: "4 (a)** Chargesheet alongwith all the annexures :", choice: "", value: "", isSubField: false, order: 4 },
  { id: "p2_4_b", label: "(b) Whether any corrigendum to the chargesheet has been issued :", choice: "", value: "", isSubField: true, order: 5 },
  { id: "p2_4_c", label: "(c )** If yes, corrigendum to the chargesheet :", choice: "", value: "", isSubField: true, order: 6 },
  { id: "p2_5", label: "5** Records of delivery of the chargesheet to the CO :", choice: "", value: "", isSubField: false, order: 7 },
  { id: "p2_6", label: "6 Whether CO has submitted reply to the Chargesheet (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 8 },
  { id: "p2_7", label: "7** If yes, CO's reply :", choice: "", value: "", isSubField: false, order: 9 },
  { id: "p2_8", label: "8** Nomination of Defence Helper, if any and consent letter of the defence helper :", choice: "", value: "", isSubField: false, order: 10 },
  { id: "p2_9_a", label: "9 (a) Whether the CO was suspended in connection with the misconduct (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 11 },
  { id: "p2_9_b", label: "(b)** If yes, order of suspension and revocation of suspension, if any :", choice: "", value: "", isSubField: true, order: 12 },
  { id: "p2_10_a", label: "10 (a) Whether this is a vigilance case (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 13 },
  { id: "p2_10_b", label: "(b)** If yes, vigilance investigation report (together with deposition recorded, if any) :", choice: "", value: "", isSubField: true, order: 14 },
  { id: "p2_11_a", label: "11 (a) Whether this is a CBI case (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 15 },
  { id: "p2_11_b", label: "(b)** If yes, CBI investigation report (together with deposition recorded, if any) :", choice: "", value: "", isSubField: true, order: 16 },
  { id: "p2_12_a", label: "12 (a) Whether action initiated on basis of CVC's advice (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 17 },
  { id: "p2_12_b", label: "(b)** If yes, CVC's 1st stage and 2nd stage advice :", choice: "", value: "", isSubField: true, order: 18 },
  { id: "p2_13_a", label: "13 (a)** All orders of the DA appointing the inquiry officer(s) :", choice: "", value: "", isSubField: false, order: 19 },
  { id: "p2_13_b", label: "(b) Name and designation of all the inquiry officers appointed in the case :", choice: "", value: "", isSubField: true, order: 20 },
  { id: "p2_14", label: "14** All orders of the DA appointing the presenting officer(s) :", choice: "", value: "", isSubField: false, order: 21 },
  { id: "p2_15_a", label: "15 (a)** All the notices of the IO to the CO and Prosecution Witness (es) intimating them the holding of the inquiry :", choice: "", value: "", isSubField: false, order: 22 },
  { id: "p2_15_b", label: "(b) Whether the notices were delivered /deemed delivered to the CO/DH for all the days (Tick the correct option) :", choice: "", value: "", isSubField: true, order: 23 },
  { id: "p2_16_a", label: "16 (a) Whether ex-parte proceeding has been held on any day (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 24 },
  { id: "p2_16_b", label: "(b) If yes,whether the proper procedure as laid down in Board's letter No. E(D&A)90 RG 6-38 dated 18.04.1990 has been followed (Tick the correct option) :", choice: "", value: "", isSubField: true, order: 25 },
  { id: "p2_17_a", label: "17 (a) Whether any representation has been received from the CO for additional documents and /or defence witnesses (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 26 },
  { id: "p2_17_b", label: "(b)** If yes, the representation of the CO and letter/noting vide which they disposed of :", choice: "", value: "", isSubField: true, order: 27 },
  { id: "p2_17_c", label: "(c) Whether additional/defence documents as demanded by the CO were allowed by the IO (Tick the correct option) :", choice: "", value: "", isSubField: true, order: 28 },
  { id: "p2_17_d", label: "(d)** If yes, description of Defence/additional documents allowed. (Details of the same in respect of each document may be given with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "", isSubField: true, order: 29 },
  { id: "p2_18", label: "18** Correspondence of the IO with the DA, if any :", choice: "", value: "", isSubField: false, order: 30 },
  { id: "p2_19_a", label: "19 (a) Whether all the prosecution witness (es) listed in Annexure-IV of the chargesheet have been examined by the IO (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 31 },
  { id: "p2_19_b", label: "(b) ** If no, the reasons therefor may be indicated :", choice: "", value: "", isSubField: true, order: 32 },
  { id: "p2_19_c", label: "(c) ** Deposition/oral statements recorded from all the Prosecution witness (es), if any (Details may be given w.r.t. each witness with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "", isSubField: true, order: 33 },
  { id: "p2_20_a", label: "20 (a) Whether all the Defence witness (es) have been examined by the IO (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 34 },
  { id: "p2_20_b", label: "(b)** Deposition/oral statements recorded from all the Defence witness (es), if any (Details may be given w.r.t each witness (es) with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "", isSubField: true, order: 35 },
  { id: "p2_21", label: "21** Statement of defence submitted by the CO during the inquiry proceedings under rule 9 (19) of RS (D&A) Rules :", choice: "", value: "", isSubField: false, order: 36 },
  { id: "p2_22_a", label: "22 (a) Whether general examination of the CO is done (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 37 },
  { id: "p2_22_b", label: "(b) ** If yes, folio at which general examination of CO is placed :", choice: "", value: "", isSubField: true, order: 38 },
  { id: "p2_22_c", label: "(c) If no, the reasons therefore may be indicated :", choice: "", value: "", isSubField: true, order: 39 },
  { id: "p2_23", label: "23 Description of all the Relied Upon Documents (RUD) mentioned in the Annexure-III of the chargesheet. (Details of the same in respect of each document may be given with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "", isSubField: false, order: 40 },
  { id: "p2_24_a", label: "24 (a)** Written brief, if any, submitted by the presenting officer :", choice: "", value: "", isSubField: false, order: 41 },
  { id: "p2_24_b", label: "(b)** Records of supply of PO's brief to the CO :", choice: "", value: "", isSubField: true, order: 42 },
  { id: "p2_25", label: "25 Written brief, if any, submitted by the CO under rule 9 (22) of RS (D&A) Rules :", choice: "", value: "", isSubField: false, order: 43 },
  { id: "p2_26_a", label: "26 (a) Whether CO has submitted any representation regarding biasness of the IO (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 44 },
  { id: "p2_26_b", label: "(b) ** If yes, representation of the CO regarding biasness of the IO :", choice: "", value: "", isSubField: true, order: 45 },
  { id: "p2_26_c", label: "(c) ** Competent Authority's letter/order vide which the CO's representation regarding biasness of the IO has been disposed of :", choice: "", value: "", isSubField: true, order: 46 },
  { id: "p2_27_a", label: "27 (a)** Inquiry Report :", choice: "", value: "", isSubField: false, order: 47 },
  { id: "p2_27_b", label: "(b)** Records of supply of the inquiry report to the CO :", choice: "", value: "", isSubField: true, order: 48 },
  { id: "p2_28_a", label: "28 (a) Is there any disagreement of the DA with the inquiry report (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 49 },
  { id: "p2_28_b", label: "(b)** If yes, reasons of disagreement of the DA with the findings of the IO :", choice: "", value: "", isSubField: true, order: 50 },
  { id: "p2_28_c", label: "(c)** Records of communication of the reasons for disagreement to the CO along with the inquiry report :", choice: "", value: "", isSubField: true, order: 51 },
  { id: "p2_29_a", label: "29 (a) Whether the CO has submitted representation against the inquiry report/disagreement memorandum (Tick the correct option) :", choice: "", value: "", isSubField: false, order: 52 },
  { id: "p2_29_b", label: "(b)** If yes, the CO's representation against the inquiry report/disagreement memorandum :", choice: "", value: "", isSubField: true, order: 53 },
  { id: "p2_30", label: "30 Self-contained note and Parawise comments of the DA & AA, on the CO's representation against the inquiry report/penalty imposed/disagreement memorandum :", choice: "", value: "", isSubField: false, order: 54 }
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAdmin: false,
      sessionExpiry: null,
      lastLoginTime: null,
      login: () =>
        set({
          isAdmin: true,
          lastLoginTime: new Date().toISOString(),
          sessionExpiry: null,
        }),
      logout: () =>
        set({ isAdmin: false, sessionExpiry: null, lastLoginTime: null }),
      checkSession: () =>
        set((state) => {
          if (state.isSfAuthenticated && state.sfAuthenticatedAt) {
            const durationMinutes = parseInt(state.config.sfSessionDuration || "30", 10);
            const diffInMs = Date.now() - new Date(state.sfAuthenticatedAt).getTime();
            if (diffInMs > durationMinutes * 60 * 1000) {
              return {
                isSfAuthenticated: false,
                sfAuthenticatedAt: null
              };
            }
          }
          return state;
        }),

      isSfAuthenticated: false,
      sfAuthenticatedAt: null,
      sfLogin: () =>
        set({
          isSfAuthenticated: true,
          sfAuthenticatedAt: new Date().toISOString(),
        }),
      sfLogout: () =>
        set({
          isSfAuthenticated: false,
          sfAuthenticatedAt: null,
        }),

      config: {
        helpline: "139",
        email: "info@nfr.railnet.gov.in",
        address: "DRM Office, Katihar",
        marqueeText:
          "Welcome to ACT Apprentice Cell. Latest merit panel for 2025 has been published.",
        contactMobile: "8709796234",
        contactEmail: "actadmin.kir@gmail.com",
        contactAddress:
          "DRM Office, Katihar, Bihar 854105, Personnel Branch, Act Apprentice Cell",
        developerCreditText: "Developed & Managed by - Prashant Kumar Singh, Sr.Clerk/P/KIR",
        candidateDataCsvUrl: "",
        sfPasscode: "124612",
        sfSessionDuration: "30",
        showSfPdfPreview: "true",
        srDpoNameEn: "Sri Sanjeev Kumar",
        srDpoNameHi: "श्री संजीव कुमार",
        srDpoDesignationEn: "Sr. DPO / KIR",
        srDpoDesignationHi: "वरिष्ठ मंडल कार्मिक अधिकारी / कटिहार (Sr. DPO / KIR)",
        importantMessageText: "ATTENTION CANDIDATES: All Act Apprentice notifications, selection schedules, and physical document verification lists are hosted ONLY on this official web portal. Please do not trust unauthorized agents demanding financial transactions or job guarantees under our DRM/Katihar division name.",
        importantMessageEnabled: "true",
        ta_rate_l1_l5: "625",
        ta_rate_l6_l8: "1000",
        ta_rate_l9_l11: "1125",
        ta_rate_l12_l13: "1250",
        ta_rate_l14_l18: "1500",
        enableContingentSection: "true",
        enablePrintMetadata: "true",
      },
      updateConfig: (key, value) => set((state) => {
        const newConfig = { ...state.config, [key]: value };
        setDoc(doc(db, "settings", "config"), newConfig).catch(console.error);
        return { config: newConfig };
      }),

      translations: { en: {}, hi: {} },
      updateTranslation: (lang, key, value) => set((state) => {
        const newTranslations = { ...state.translations, [lang]: { ...state.translations[lang], [key]: value } };
        setDoc(doc(db, "settings", "translations"), newTranslations).catch(console.error);
        return { translations: newTranslations };
      }),
      updateTranslationsBatch: (lang, updates) => set((state) => {
        const newTranslations = { ...state.translations, [lang]: { ...state.translations[lang], ...updates } };
        setDoc(doc(db, "settings", "translations"), newTranslations).catch(console.error);
        return { translations: newTranslations };
      }),

      headerConfig: {
        mainTitleText: "ACT APPRENTICE CELL",
        mainTitleEnabled: true,
        railwayHindiText: "",
        railwayHindiEnabled: false,
        railwayEnglishText: "",
        railwayEnglishEnabled: false,
        divisionHindiText: "",
        divisionHindiEnabled: false,
        divisionEnglishText: "",
        divisionEnglishEnabled: false,
      },
      updateHeaderConfig: (config) => set((state) => {
        setDoc(doc(db, "settings", "headerConfig"), config).catch(console.error);
        return { headerConfig: config };
      }),

      logos: {
        railwayLogo: { image: "", enabled: true },
        govLogo: { image: "", enabled: true },
        nationalEmblem: { image: "", enabled: true },
        ministryLogo: { image: "", enabled: true },
        favicon: { image: "", enabled: true },
        namePlate: { image: "", enabled: true },
      },
      updateLogo: (key, data) => set((state) => {
        const newLogos = { ...state.logos, [key]: { ...state.logos[key], ...data } };
        setDoc(doc(db, "logos", key), {
          id: key,
          title: key,
          url: newLogos[key].image || "",
          type: "image",
          enabled: newLogos[key].enabled ?? true,
          customHeight: newLogos[key].customHeight ?? null,
          createdAt: new Date().toISOString()
        }).catch((err) => console.error("Firebase update error:", err));
        return { logos: newLogos };
      }),

      noticeImage: {
        image: "",
        title: "Notice Board Image",
        description: "Updates and information.",
        enabled: true,
      },
      updateNoticeImage: (data) => set((state) => {
        const newNoticeImage = { ...state.noticeImage, ...data };
        setDoc(doc(db, "images", "homepage_notice"), {
          id: "homepage_notice",
          category: "noticeImage",
          title: newNoticeImage.title,
          description: newNoticeImage.description,
          url: newNoticeImage.image || "",
          type: "image",
          enabled: newNoticeImage.enabled,
          createdAt: new Date().toISOString()
        }).catch(console.error);
        return { noticeImage: newNoticeImage };
      }),

      audioAnnouncement: {
        audio: "",
        enabled: true,
      },
      updateAudioAnnouncement: (data) => set((state) => {
        const newAudioAnnouncement = { ...state.audioAnnouncement, ...data };
        setDoc(doc(db, "settings", "audioAnnouncement"), newAudioAnnouncement).catch(console.error);
        return { audioAnnouncement: newAudioAnnouncement };
      }),

      sliderImages: [],
      addSliderImage: (image) => set((state) => {
        const id = generateId();
        const newImage = { ...image, id };
        setDoc(doc(db, "images", id), {
          id,
          category: "slider",
          title: newImage.title,
          description: newImage.description,
          url: newImage.image,
          type: "image",
          enabled: newImage.enabled,
          order: newImage.order,
          createdAt: new Date().toISOString()
        }).catch(console.error);
        return { sliderImages: [...state.sliderImages, newImage] };
      }),
      updateSliderImage: (id, data) => set((state) => {
        const updatedImages = state.sliderImages.map((img) => img.id === id ? { ...img, ...data } : img);
        const newImage = updatedImages.find((img) => img.id === id);
        if (newImage) setDoc(doc(db, "images", id), {
          id,
          category: "slider",
          title: newImage.title,
          description: newImage.description,
          url: newImage.image,
          type: "image",
          enabled: newImage.enabled,
          order: newImage.order,
          createdAt: new Date().toISOString()
        }).catch(console.error);
        return { sliderImages: updatedImages };
      }),
      deleteSliderImage: (id) => set((state) => {
        deleteDoc(doc(db, "images", id)).catch(console.error);
        return { sliderImages: state.sliderImages.filter((img) => img.id !== id) };
      }),

      warningConfig: {
        text: "Please be aware of fake job offers. Railway recruitment is done only through official channels.",
        enabled: true,
      },
      updateWarningConfig: (data) => set((state) => {
        const newWarningConfig = { ...state.warningConfig, ...data };
        setDoc(doc(db, "settings", "warningConfig"), newWarningConfig).catch(console.error);
        return { warningConfig: newWarningConfig };
      }),

      videoConfig: {
        url: "",
        enabled: true,
      },
      updateVideoConfig: (data) => set((state) => {
        const newVideoConfig = { ...state.videoConfig, ...data };
        setDoc(doc(db, "videos", "homepage_video"), {
           id: "homepage_video",
           title: "Homepage Video",
           url: newVideoConfig.url,
           type: "video",
           enabled: newVideoConfig.enabled,
           createdAt: new Date().toISOString()
        }).catch(console.error);
        return { videoConfig: newVideoConfig };
      }),

      images: {
        railwayLogo: "",
        govLogo: "",
        nationalEmblem: "",
        heroBanner: "",
      },
      updateImage: (key, base64) => set((state) => {
        const newImages = { ...state.images, [key]: base64 };
        setDoc(doc(db, "settings", "images"), newImages).catch(console.error);
        return { images: newImages };
      }),

      sfDescriptions: {
        "SF-1": "Order of Suspension",
        "SF-2": "Order of Deemed Suspension",
        "SF-3": "Certificate of Subsistence Allowance",
        "SF-4": "Order of Revocation of Suspension",
        "SF-5": "Charge Memorandum for Major Penalty",
        "SF-6": "Refusing of permission to inspect documents",
        "SF-7": "Appointment of Inquiry Officer / Board of Inquiry",
        "SF-8": "Appointment of Presenting Officer",
        "SF-9": "Not in use",
        "SF-10": "Disciplinary action in common proceedings",
        "SF-11": "Charge Memorandum for Minor Penalty",
        "SF-11b": "Charge Memorandum for Minor Penalty (If inquiry held)",
        "SF-12": "Memorandum where action is proposed under Rule 14(i)",
        "SF-13": "Permission from President for action against pensioner",
        "SF-14": "Standard form for charge sheet for Pensioner",
      },
      updateSFDescription: (id, description) => set((state) => {
        const newDescriptions = { ...state.sfDescriptions, [id]: description };
        setDoc(doc(db, "settings", "sfDescriptions"), newDescriptions).catch(console.error);
        return { sfDescriptions: newDescriptions };
      }),

      sfFixedTexts: {
        "SF-1": {
          whereContemplatedPending: "Whereas disciplinary proceeding against",
          servantContemplatedPending: "(Name and designation of the Railway servant) is contemplated/Pending",
          whereCriminalCase: "Whereas a case against",
          servantCriminalCase: "(Name and designation of the Railway servant) in respect of whom a criminal offence is under investigation / inquiry / trail.",
          placeUnderSuspensionText: "Now, therefore, the undersigned (the authority competent to place the Railway Servant under suspension in terms of the Schedules II and III appended to RS (D&A) Rules, 1968/ an authority mentioned in proviso to [Rule 4 of the RS (D&A) Rules, 1968], in exercise of the powers conferred by Rule 4/proviso to Rule 4 of RS (D&A) Rules, 1968, hereby places the said",
          placeUnderSuspensionSuff: "under suspension",
          furtherOrderedHeader: "It is further ordered that during the period this order shall remain in force, the said",
          cannotLeaveHq: "shall not leave the headquarters without obtaining the previous permission of the competent authority.",
          copyToDefault: "Orders regarding subsistence allowance admissible to him during the period of suspension will issue separately."
        },
        "SF-4": {
          whereasPlace: "Whereas the order placing",
          underSuspension: "under suspension",
          wasMadeDeemed: "was made/was deemed to have been made by the Undersigned on",
          revokesSaidOrder: "Now, therefore, the undersigned (the authority which made or is deemed to have made the order of suspension or any other authority to which that authority is subordinate) in exercise of the powers conferred by Clause (c) of sub-rule (5) of Rule 5 of the RS (D&A) Rule, 1968, hereby revokes the said order of suspension"
        },
        "SF-5": {
          proposesInquiry: "The undersigned proposes to hold an inquiry against the said Railway servant under Rule 9 of the Railway Servants (Discipline and Appeal) Rules, 1968. The substance of the imputations of misconduct or misbehaviour in respect of which the inquiry is proposed to be held is set out in the enclosed statement of articles of charge (Annexure I). A statement of the imputations of misconduct or misbehaviour in support of each article of charge is enclosed (Annexure II). A list of documents by which and a list of witnesses by whom the articles of charge are proposed to be sustained are also enclosed (Annexures III and IV).",
          directedSubmit: "The said Railway servant is hereby directed to submit to the undersigned a written statement of his defense within ten days of the receipt of this memorandum."
        },
        "SF-11": {
          proposesAction: "The undersigned proposes to take action against the said Railway servant under Rule 11 of the Railway Servants (Discipline and Appeal) Rules, 1968. The substance of the imputations of misconduct or misbehaviour in respect of which action is proposed to be taken is set out in the enclosed statement of misconduct or misbehaviour.",
          givenOpportunity: "The said Railway servant is hereby given an opportunity to make such representation as he may wish to make against the proposal. If he fails to submit his representation within ten days, it will be presumed that he has no representation to make."
        }
      },
      updateSFFixedText: (sfType, key, value) => set((state) => {
        const currentTexts = state.sfFixedTexts || {};
        const sfTexts = currentTexts[sfType] || {};
        const newTexts = { ...currentTexts, [sfType]: { ...sfTexts, [key]: value } };
        setDoc(doc(db, "settings", "sfFixedTexts"), newTexts).catch(console.error);
        return { sfFixedTexts: newTexts };
      }),

      issuedSFs: [],
      pending_sf4_drafts: [],
      addIssuedSF: (sf) => set((state) => {
        const existing = (state.issuedSFs || []).find((item) => 
          item.employeeName === sf.employeeName &&
          item.sfType === sf.sfType &&
          (item.memorandumNo || "").trim().toLowerCase() === (sf.memorandumNo || "").trim().toLowerCase()
        );

        if (existing) {
          const nextStatus: "issued" | "untracked" = existing.trackStatus === "issued" ? "issued" : "untracked";
          const updatedSF = { 
            ...existing, 
            ...sf, 
            trackStatus: nextStatus,
            pausedUntil: nextStatus === "untracked" ? null : existing.pausedUntil,
            printedAt: Date.now() 
          };
          setDoc(doc(db, "issuedSFs", existing.id), updatedSF).catch(console.error);
          return { 
            issuedSFs: state.issuedSFs.map((item) => item.id === existing.id ? updatedSF : item) 
          };
        }

        const id = generateId();
        const newSF = { ...sf, id, printedAt: Date.now() };
        setDoc(doc(db, "issuedSFs", id), newSF).catch(console.error);
        return { issuedSFs: [...(state.issuedSFs || []), newSF] };
      }),
      updateIssuedSF: (id, updates) => set((state) => {
        const updatedSFs = (state.issuedSFs || []).map((sf) => 
          sf.id === id ? { ...sf, ...updates } : sf
        );
        const updatedSF = updatedSFs.find((sf) => sf.id === id);
        if (updatedSF) setDoc(doc(db, "issuedSFs", id), updatedSF).catch(console.error);
        return { issuedSFs: updatedSFs };
      }),
      toggleIssuedSFFinalised: (id) => set((state) => {
        const targetSF = (state.issuedSFs || []).find((sf) => sf.id === id);
        let updatedSFs = state.issuedSFs || [];
        
        if (targetSF) {
          const nextFinalised = !targetSF.isFinalised;
          updatedSFs = updatedSFs.map((sf) => 
            sf.id === id ? { ...sf, isFinalised: nextFinalised } : sf
          );
          
          const updatedSF = { ...targetSF, isFinalised: nextFinalised };
          setDoc(doc(db, "issuedSFs", id), updatedSF).catch(console.error);
          
          if (targetSF.sfType === "SF-1" && nextFinalised) {
            const pendingSF4Record = {
              employeeName: targetSF.employeeName || "",
              designation: targetSF.designation || "",
              fileNo: targetSF.memorandumNo || "",
              status: "pending",
              createdAt: Date.now(),
              suspensionOrderDate: targetSF.issuedDate || new Date().toISOString().split("T")[0],
              signatureName: targetSF.signatureName || "",
              authorityDesignation: targetSF.authorityDesignation || "",
              salutation: targetSF.salutation || "Shri",
              workingUnder: targetSF.workingUnder || "",
              railway: targetSF.railway || "North Frontier Railway",
              placeOfIssue: targetSF.placeOfIssue || "Katihar",
              additionalCopies: targetSF.additionalCopies || [],
            };
            addDoc(collection(db, "pending_sf4_drafts"), pendingSF4Record)
              .then(() => {
                toast.info("SF-4 draft has been automatically generated for this employee!");
              })
              .catch((err) => {
                console.error("Error generating SF-4 draft:", err);
              });
          }
        }
        return { issuedSFs: updatedSFs };
      }),
      deleteIssuedSF: (id) => set((state) => {
        deleteDoc(doc(db, "issuedSFs", id)).catch(console.error);
        return { issuedSFs: (state.issuedSFs || []).filter((sf) => sf.id !== id) };
      }),

      notices: [
        {
          id: "1",
          title:
            "Important Notice regarding act apprentice document verification",
          date: "2026-05-20",
          viewLink: "#",
          downloadLink: "#",
          isNew: true,
          order: 1,
        },
      ],
      notifications: [
        {
          id: "1",
          title: "Notification for recruitment of ACT Apprentices 2025-26",
          date: "2026-05-15",
          viewLink: "#",
          downloadLink: "#",
          isNew: true,
          order: 1,
        },
      ],
      meritPanels: [
        {
          id: "1",
          title: "Provisional part panel for ACT Apprentice 2024-25",
          date: "2026-05-10",
          viewLink: "#",
          downloadLink: "#",
          isNew: false,
          order: 1,
        },
      ],
      results: [
        {
          id: "1",
          title: "Final Result of Document Verification held in April 2026",
          date: "2026-05-02",
          viewLink: "#",
          downloadLink: "#",
          isNew: false,
          order: 1,
        },
      ],
      darCirculars: [
        {
          id: "1",
          title: "DAR Rules Update 2025",
          date: "2025-12-01",
          viewLink: "#",
          downloadLink: "#",
          isNew: false,
          order: 1,
        },
      ],
      actCirculars: [
        {
          id: "1",
          title: "Stipend Guidelines 2026",
          date: "2026-01-15",
          viewLink: "#",
          downloadLink: "#",
          isNew: false,
          order: 1,
        },
      ],

      links: [
        {
          id: "1",
          name: "Indian Railways",
          url: "https://indianrailways.gov.in",
          order: 1,
        },
        {
          id: "2",
          name: "NFR Official Website",
          url: "https://nfr.indianrailways.gov.in",
          order: 2,
        },
        {
          id: "3",
          name: "Apprenticeship India",
          url: "https://www.apprenticeshipindia.gov.in",
          order: 3,
        },
      ],

      externalLinks: [],

      internalLinks: [
        {
          id: "1",
          name: "HRMS Portal (Employee Login)",
          url: "https://hrms.indianrail.gov.in/HRMS",
          order: 1,
        },
        {
          id: "2",
          name: "NFR Intranet",
          url: "http://10.205.2.19/",
          order: 2,
        },
        {
          id: "3",
          name: "AIMS / IPAS",
          url: "https://aims.indianrailways.gov.in",
          order: 3,
        },
      ],

      apoWorkAllotments: [],

      addDocument: (type, docData) => set((state) => {
        const id = generateId();
        const newDoc = { ...docData, id };
        setDoc(doc(db, "documents", id), {
          id,
          category: type,
          title: newDoc.title,
          url: newDoc.downloadLink || newDoc.viewLink,
          viewLink: newDoc.viewLink,
          downloadLink: newDoc.downloadLink,
          type: "pdf",
          date: newDoc.date,
          isNew: newDoc.isNew,
          order: newDoc.order,
          createdAt: new Date().toISOString()
        }).catch(console.error);
        return { [type]: [...state[type], newDoc] };
      }),

      updateDocument: (type, id, updatedDoc) => set((state) => {
        const updatedDocs = state[type].map((d) => d.id === id ? { ...d, ...updatedDoc } : d);
        const newDoc = updatedDocs.find((d) => d.id === id);
        if (newDoc) setDoc(doc(db, "documents", id), {
          id,
          category: type,
          title: newDoc.title,
          url: newDoc.downloadLink || newDoc.viewLink,
          viewLink: newDoc.viewLink,
          downloadLink: newDoc.downloadLink,
          type: "pdf",
          date: newDoc.date,
          isNew: newDoc.isNew,
          order: newDoc.order,
          createdAt: new Date().toISOString()
        }).catch(console.error);
        return { [type]: updatedDocs };
      }),

      deleteDocument: (type, id) => set((state) => {
        deleteDoc(doc(db, "documents", id)).catch(console.error);
        return { [type]: state[type].filter((d) => d.id !== id) };
      }),

      addLink: (link) => set((state) => {
        const id = generateId();
        const newLink = { ...link, id };
        setDoc(doc(db, "links", id), newLink).catch(console.error);
        return { links: [...state.links, newLink] };
      }),

      updateLink: (id, updatedLink) => set((state) => {
        const updatedLinks = state.links.map((link) => link.id === id ? { ...link, ...updatedLink } : link);
        const newLink = updatedLinks.find((link) => link.id === id);
        if (newLink) setDoc(doc(db, "links", id), newLink).catch(console.error);
        return { links: updatedLinks };
      }),

      deleteLink: (id) => set((state) => {
        deleteDoc(doc(db, "links", id)).catch(console.error);
        return { links: state.links.filter((link) => link.id !== id) };
      }),

      addExternalLink: (link) => set((state) => {
        const id = generateId();
        const newLink = { ...link, id };
        setDoc(doc(db, "externalLinks", id), newLink).catch(console.error);
        return { externalLinks: [...state.externalLinks, newLink] };
      }),

      updateExternalLink: (id, updatedLink) => set((state) => {
        const updatedLinks = state.externalLinks.map((link) => link.id === id ? { ...link, ...updatedLink } : link);
        const newLink = updatedLinks.find((link) => link.id === id);
        if (newLink) setDoc(doc(db, "externalLinks", id), newLink).catch(console.error);
        return { externalLinks: updatedLinks };
      }),

      deleteExternalLink: (id) => set((state) => {
        deleteDoc(doc(db, "externalLinks", id)).catch(console.error);
        return { externalLinks: state.externalLinks.filter((link) => link.id !== id) };
      }),

      addInternalLink: (link) => set((state) => {
        const id = generateId();
        const newLink = { ...link, id };
        setDoc(doc(db, "internalLinks", id), newLink).catch(console.error);
        return { internalLinks: [...state.internalLinks, newLink] };
      }),

      updateInternalLink: (id, updatedLink) => set((state) => {
        const updatedLinks = state.internalLinks.map((link) => link.id === id ? { ...link, ...updatedLink } : link);
        const newLink = updatedLinks.find((link) => link.id === id);
        if (newLink) setDoc(doc(db, "internalLinks", id), newLink).catch(console.error);
        return { internalLinks: updatedLinks };
      }),

      deleteInternalLink: (id) => set((state) => {
        deleteDoc(doc(db, "internalLinks", id)).catch(console.error);
        return { internalLinks: state.internalLinks.filter((link) => link.id !== id) };
      }),

      addApoAllotment: (allotment) => set((state) => {
        const id = generateId();
        const newAllotment = { ...allotment, id };
        setDoc(doc(db, "apoWorkAllotments", id), newAllotment).catch(console.error);
        return { apoWorkAllotments: [...(state.apoWorkAllotments || []), newAllotment] };
      }),

      updateApoAllotment: (id, changedAllotment) => set((state) => {
        const updatedAllotments = (state.apoWorkAllotments || []).map((a) => a.id === id ? { ...a, ...changedAllotment } : a);
        const newAllotment = updatedAllotments.find((a) => a.id === id);
        if (newAllotment) setDoc(doc(db, "apoWorkAllotments", id), newAllotment).catch(console.error);
        return { apoWorkAllotments: updatedAllotments };
      }),

      deleteApoAllotment: (id) => set((state) => {
        deleteDoc(doc(db, "apoWorkAllotments", id)).catch(console.error);
        return { apoWorkAllotments: (state.apoWorkAllotments || []).filter((a) => a.id !== id) };
      }),

      part2Template: DEFAULT_PART2_TEMPLATE,

      addPart2TemplateField: (field) => set((state) => {
        const id = field.id || "p2_" + generateId();
        const order = field.order || (state.part2Template.length ? Math.max(...state.part2Template.map(f => f.order || 0)) + 1 : 1);
        const newField: Part2Field = {
          ...field,
          id,
          choice: "",
          value: "",
          order,
        };
        setDoc(doc(db, "part2Template", id), newField).catch(console.error);
        return { part2Template: [...state.part2Template, newField].sort((a, b) => (a.order || 0) - (b.order || 0)) };
      }),

      updatePart2TemplateField: (id, updates) => set((state) => {
        const updatedFields = state.part2Template.map((f) => f.id === id ? { ...f, ...updates } : f);
        const findField = updatedFields.find((f) => f.id === id);
        if (findField) {
          setDoc(doc(db, "part2Template", id), findField).catch(console.error);
        }
        return { part2Template: updatedFields.sort((a, b) => (a.order || 0) - (b.order || 0)) };
      }),

      deletePart2TemplateField: (id) => set((state) => {
        deleteDoc(doc(db, "part2Template", id)).catch(console.error);
        return { part2Template: state.part2Template.filter((f) => f.id !== id) };
      }),

      reorderPart2TemplateFields: (orderedFields) => set((state) => {
        const updatedFields = orderedFields.map((f, index) => {
          const updated = { ...f, order: index + 1 };
          setDoc(doc(db, "part2Template", f.id), updated).catch(console.error);
          return updated;
        });
        return { part2Template: updatedFields };
      }),
    }),
    {
      name: "railway-portal-storage",
    },
  ),
);
