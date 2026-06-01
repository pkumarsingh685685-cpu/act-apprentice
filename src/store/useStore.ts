import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, DocumentCategory, DocumentItem, LinkItem } from "../types";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

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
          return state;
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
      },
      updateConfig: (key, value) => set((state) => {
        const newConfig = { ...state.config, [key]: value };
        setDoc(doc(db, "settings", "config"), newConfig).catch(console.error);
        return { config: newConfig };
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
      },
      updateLogo: (key, data) => set((state) => {
        const newLogos = { ...state.logos, [key]: { ...state.logos[key], ...data } };
        setDoc(doc(db, "logos", key), {
          id: key,
          title: key,
          url: newLogos[key].image,
          type: "image",
          enabled: newLogos[key].enabled,
          createdAt: new Date().toISOString()
        }).catch(console.error);
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
    }),
    {
      name: "railway-portal-storage",
    },
  ),
);
