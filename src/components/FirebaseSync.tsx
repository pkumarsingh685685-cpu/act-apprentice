import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { doc, collection, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export function FirebaseSync() {
  useEffect(() => {
    // Migration logic
    const checkMigration = async () => {
      try {
        const globalDoc = await getDoc(doc(db, "global", "appState"));
        if (globalDoc.exists()) {
          const data = globalDoc.data().state;
          const migrationDoc = await getDoc(doc(db, "global", "migration_done"));
          if (!migrationDoc.exists() && data) {
            console.log("Migrating data from single document to collections...");
            
            // Migrate singletons
            if (data.config) await setDoc(doc(db, "settings", "config"), data.config);
            if (data.headerConfig) await setDoc(doc(db, "settings", "headerConfig"), data.headerConfig);
            if (data.logos) await setDoc(doc(db, "settings", "logos"), data.logos);
            if (data.noticeImage) await setDoc(doc(db, "settings", "noticeImage"), data.noticeImage);
            if (data.audioAnnouncement) await setDoc(doc(db, "settings", "audioAnnouncement"), data.audioAnnouncement);
            if (data.warningConfig) await setDoc(doc(db, "settings", "warningConfig"), data.warningConfig);
            if (data.videoConfig) await setDoc(doc(db, "settings", "videoConfig"), data.videoConfig);
            if (data.images) await setDoc(doc(db, "settings", "images"), data.images);

            const collectionsToMigrate = [
              "sliderImages", "notices", "notifications", "meritPanels", 
              "results", "darCirculars", "actCirculars", "links", 
              "externalLinks", "internalLinks"
            ];
            
            for (const col of collectionsToMigrate) {
              if (data[col] && Array.isArray(data[col])) {
                for (const item of data[col]) {
                  if (item.id) {
                    await setDoc(doc(db, col, item.id), item);
                  }
                }
              }
            }

            await setDoc(doc(db, "global", "migration_done"), { done: true });
            console.log("Migration complete!");
          }
        }
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        const isOffline = errMessage.toLowerCase().includes("offline") || 
                          errMessage.toLowerCase().includes("backend") || 
                          errMessage.toLowerCase().includes("unreachable") ||
                          errMessage.toLowerCase().includes("unavailable") ||
                          errMessage.toLowerCase().includes("failed-precondition");
        if (isOffline) {
          console.warn("Migration skipped (client is offline):", errMessage);
        } else {
          console.error("Migration error:", err);
        }
      }
    };
    checkMigration();

    const unsubscribes: (() => void)[] = [];

    // 1. Sync Singleton Documents from traditional settings
    const singletons = [
      { key: "config", path: "settings/config" },
      { key: "headerConfig", path: "settings/headerConfig" },
      { key: "audioAnnouncement", path: "settings/audioAnnouncement" },
      { key: "warningConfig", path: "settings/warningConfig" },
      { key: "translations", path: "settings/translations" },
      { key: "sfDescriptions", path: "settings/sfDescriptions" }
    ];

    singletons.forEach(({ key, path }) => {
      const [col, documentId] = path.split("/");
      const unsub = onSnapshot(doc(db, col, documentId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          useStore.setState({ [key]: data } as any);
          if (key === "translations") {
            import("../i18n").then(({ default: i18n }) => {
              if (data.en) i18n.addResourceBundle("en", "translation", data.en, true, true);
              if (data.hi) i18n.addResourceBundle("hi", "translation", data.hi, true, true);
            });
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `${col}/${documentId}`);
      });
      unsubscribes.push(unsub);
    });

    // Sync modern videoConfig
    unsubscribes.push(onSnapshot(doc(db, "videos", "homepage_video"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        useStore.setState((state: any) => ({ videoConfig: { ...state.videoConfig, enabled: data.enabled, url: data.url } }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "videos/homepage_video");
    }));

    // Sync modern noticeImage
    unsubscribes.push(onSnapshot(doc(db, "images", "homepage_notice"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        useStore.setState((state: any) => ({ noticeImage: { ...state.noticeImage, title: data.title, description: data.description, image: data.url, enabled: data.enabled } }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "images/homepage_notice");
    }));

    // Sync logos
    unsubscribes.push(onSnapshot(collection(db, "logos"), (snapshot) => {
      const logosData: any = {};
      snapshot.forEach(d => {
        const data = d.data();
        logosData[data.id] = { 
          image: data.url, 
          enabled: data.enabled !== false,
          customHeight: typeof data.customHeight === 'number' ? data.customHeight : data.customHeight ? Number(data.customHeight) : undefined
        };
      });
      if (Object.keys(logosData).length > 0) {
        useStore.setState((state: any) => ({ logos: { ...state.logos, ...logosData } }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "logos");
    }));

    // Sync slider images (from images collection where category is slider)
    unsubscribes.push(onSnapshot(collection(db, "images"), (snapshot) => {
      const sliders = snapshot.docs.map(d => d.data()).filter((d: any) => d.category === "slider").map((d: any) => ({
         id: d.id,
         image: d.url,
         title: d.title,
         description: d.description,
         order: d.order,
         enabled: d.enabled
      }));
      useStore.setState({ sliderImages: sliders.sort((a,b) => a.order - b.order) } as any);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "images");
    }));

    // Sync documents
    unsubscribes.push(onSnapshot(collection(db, "documents"), (snapshot) => {
      const grouped: any = { notices: [], notifications: [], meritPanels: [], results: [], darCirculars: [], actCirculars: [] };
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (grouped[data.category]) {
           grouped[data.category].push(data);
        }
      });
      Object.keys(grouped).forEach(k => {
        grouped[k] = grouped[k].sort((a: any, b: any) => a.order - b.order);
      });
      useStore.setState(grouped);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "documents");
    }));

    // Sync basic links
    const linkCollections = [
      "links",
      "externalLinks",
      "internalLinks",
      "issuedSFs",
      "apoWorkAllotments",
      "pending_sf4_drafts",
      "part2Template"
    ];

    linkCollections.forEach((colName) => {
      const unsub = onSnapshot(collection(db, colName), (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (colName === "part2Template" && items.length === 0) {
          // Auto-seed empty Firestore template
          import("../store/useStore").then(({ DEFAULT_PART2_TEMPLATE }) => {
            DEFAULT_PART2_TEMPLATE.forEach(item => {
              setDoc(doc(db, "part2Template", item.id), item).catch(console.error);
            });
          });
          return;
        }
        // Sort by order if it exists
        const sorted = items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        useStore.setState({ [colName]: sorted } as any);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, colName);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const favicon = useStore((state) => state.logos?.favicon);

  useEffect(() => {
    if (favicon?.enabled && favicon?.image) {
      try {
        const iconLinks = document.querySelectorAll("link[rel*='icon']");
        if (iconLinks.length > 0) {
          iconLinks.forEach((link: any) => {
            link.href = favicon.image;
          });
        } else {
          const link = document.createElement("link");
          link.rel = "icon";
          link.type = "image/png";
          link.href = favicon.image;
          document.head.appendChild(link);
        }

        const appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (appleLink) {
          appleLink.href = favicon.image;
        } else {
          const link = document.createElement("link");
          link.rel = "apple-touch-icon";
          link.href = favicon.image;
          document.head.appendChild(link);
        }
      } catch (err) {
        console.error("Error setting favicon dynamically:", err);
      }
    }
  }, [favicon]);

  return null;
}
