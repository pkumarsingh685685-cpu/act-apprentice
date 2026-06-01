import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { doc, collection, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

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
        console.error("Migration error:", err);
      }
    };
    checkMigration();

    const unsubscribes: (() => void)[] = [];

    // 1. Sync Singleton Documents from traditional settings
    const singletons = [
      { key: "config", path: "settings/config" },
      { key: "headerConfig", path: "settings/headerConfig" },
      { key: "audioAnnouncement", path: "settings/audioAnnouncement" },
      { key: "warningConfig", path: "settings/warningConfig" }
    ];

    singletons.forEach(({ key, path }) => {
      const [col, documentId] = path.split("/");
      const unsub = onSnapshot(doc(db, col, documentId), (snapshot) => {
        if (snapshot.exists()) {
          useStore.setState({ [key]: snapshot.data() } as any);
        }
      });
      unsubscribes.push(unsub);
    });

    // Sync modern videoConfig
    unsubscribes.push(onSnapshot(doc(db, "videos", "homepage_video"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        useStore.setState({ videoConfig: { enabled: data.enabled, url: data.url } } as any);
      }
    }));

    // Sync modern noticeImage
    unsubscribes.push(onSnapshot(doc(db, "images", "homepage_notice"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        useStore.setState({ noticeImage: { title: data.title, description: data.description, image: data.url, enabled: data.enabled } } as any);
      }
    }));

    // Sync logos
    unsubscribes.push(onSnapshot(collection(db, "logos"), (snapshot) => {
      const logosData: any = {};
      snapshot.forEach(d => {
        const data = d.data();
        logosData[data.id] = { image: data.url, enabled: data.enabled };
      });
      if (Object.keys(logosData).length > 0) {
        useStore.setState({ logos: logosData } as any);
      }
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
    }));

    // Sync basic links
    const linkCollections = [
      "links",
      "externalLinks",
      "internalLinks"
    ];

    linkCollections.forEach((colName) => {
      const unsub = onSnapshot(collection(db, colName), (snapshot) => {
        const items = snapshot.docs.map(d => d.data());
        // Sort by order if it exists
        const sorted = items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        useStore.setState({ [colName]: sorted } as any);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  return null;
}
