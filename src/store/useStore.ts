import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState, DocumentCategory, DocumentItem, LinkItem } from "../types";

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
      updateConfig: (key, value) =>
        set((state) => ({ config: { ...state.config, [key]: value } })),

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
      updateHeaderConfig: (config) => set({ headerConfig: config }),

      logos: {
        railwayLogo: { image: "", enabled: true },
        govLogo: { image: "", enabled: true },
        nationalEmblem: { image: "", enabled: true },
      },
      updateLogo: (key, data) =>
        set((state) => ({
          logos: { ...state.logos, [key]: { ...state.logos[key], ...data } },
        })),

      noticeImage: {
        image: "",
        title: "Notice Board Image",
        description: "Updates and information.",
        enabled: true,
      },
      updateNoticeImage: (data) =>
        set((state) => ({ noticeImage: { ...state.noticeImage, ...data } })),

      audioAnnouncement: {
        audio: "",
        enabled: true,
      },
      updateAudioAnnouncement: (data) =>
        set((state) => ({
          audioAnnouncement: { ...state.audioAnnouncement, ...data },
        })),

      sliderImages: [],
      addSliderImage: (image) =>
        set((state) => ({
          sliderImages: [...state.sliderImages, { ...image, id: generateId() }],
        })),
      updateSliderImage: (id, data) =>
        set((state) => ({
          sliderImages: state.sliderImages.map((img) =>
            img.id === id ? { ...img, ...data } : img,
          ),
        })),
      deleteSliderImage: (id) =>
        set((state) => ({
          sliderImages: state.sliderImages.filter((img) => img.id !== id),
        })),

      warningConfig: {
        text: "Please be aware of fake job offers. Railway recruitment is done only through official channels.",
        enabled: true,
      },
      updateWarningConfig: (data) =>
        set((state) => ({
          warningConfig: { ...state.warningConfig, ...data },
        })),

      videoConfig: {
        url: "",
        enabled: true,
      },
      updateVideoConfig: (data) =>
        set((state) => ({
          videoConfig: { ...state.videoConfig, ...data },
        })),

      images: {
        railwayLogo: "",
        govLogo: "",
        nationalEmblem: "",
        heroBanner: "",
      },
      updateImage: (key, base64) =>
        set((state) => ({ images: { ...state.images, [key]: base64 } })),

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

      addDocument: (type, doc) =>
        set((state) => ({
          [type]: [...state[type], { ...doc, id: generateId() }],
        })),

      updateDocument: (type, id, updatedDoc) =>
        set((state) => ({
          [type]: state[type].map((doc) =>
            doc.id === id ? { ...doc, ...updatedDoc } : doc,
          ),
        })),

      deleteDocument: (type, id) =>
        set((state) => ({
          [type]: state[type].filter((doc) => doc.id !== id),
        })),

      addLink: (link) =>
        set((state) => ({
          links: [...state.links, { ...link, id: generateId() }],
        })),

      updateLink: (id, updatedLink) =>
        set((state) => ({
          links: state.links.map((link) =>
            link.id === id ? { ...link, ...updatedLink } : link,
          ),
        })),

      deleteLink: (id) =>
        set((state) => ({
          links: state.links.filter((link) => link.id !== id),
        })),

      addExternalLink: (link) =>
        set((state) => ({
          externalLinks: [
            ...state.externalLinks,
            { ...link, id: generateId() },
          ],
        })),

      updateExternalLink: (id, updatedLink) =>
        set((state) => ({
          externalLinks: state.externalLinks.map((link) =>
            link.id === id ? { ...link, ...updatedLink } : link,
          ),
        })),

      deleteExternalLink: (id) =>
        set((state) => ({
          externalLinks: state.externalLinks.filter((link) => link.id !== id),
        })),

      addInternalLink: (link) =>
        set((state) => ({
          internalLinks: [
            ...state.internalLinks,
            { ...link, id: generateId() },
          ],
        })),

      updateInternalLink: (id, updatedLink) =>
        set((state) => ({
          internalLinks: state.internalLinks.map((link) =>
            link.id === id ? { ...link, ...updatedLink } : link,
          ),
        })),

      deleteInternalLink: (id) =>
        set((state) => ({
          internalLinks: state.internalLinks.filter((link) => link.id !== id),
        })),
    }),
    {
      name: "railway-portal-storage",
    },
  ),
);
