import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export function FirebaseSync() {
  const isAdmin = useStore((state) => state.isAdmin);
  const isUpdatingFromFirebase = useRef(false);

  // Read snapshot
  useEffect(() => {
    const docRef = doc(db, "global", "appState");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().state;
        if (data) {
          isUpdatingFromFirebase.current = true;
          useStore.setState((prev) => ({
            ...prev,
            ...data,
            // Keep local admin session intact!
            isAdmin: prev.isAdmin,
            sessionExpiry: prev.sessionExpiry,
            lastLoginTime: prev.lastLoginTime,
          }));
          setTimeout(() => {
            isUpdatingFromFirebase.current = false;
          }, 500);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Write changes (only if Admin)
  useEffect(() => {
    if (!isAdmin) return;

    let timeout: any;
    const unsubscribe = useStore.subscribe((state) => {
      if (isUpdatingFromFirebase.current) return;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Filter out auth methods and session
        const {
          isAdmin,
          sessionExpiry,
          lastLoginTime,
          login,
          logout,
          checkSession,
          addDocument,
          updateDocument,
          deleteDocument,
          addLink,
          updateLink,
          deleteLink,
          addExternalLink,
          updateExternalLink,
          deleteExternalLink,
          addInternalLink,
          updateInternalLink,
          deleteInternalLink,
          updateConfig,
          updateHeaderConfig,
          updateLogo,
          updateNoticeImage,
          updateAudioAnnouncement,
          addSliderImage,
          updateSliderImage,
          deleteSliderImage,
          ...publicState
        } = state as any;

        const cleanState = JSON.parse(JSON.stringify(publicState));

        setDoc(
          doc(db, "global", "appState"),
          { state: cleanState },
          { merge: true },
        ).catch((err) => console.error("Error saving global state", err));
      }, 1000); // debounce 1 second
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [isAdmin]);

  return null;
}
