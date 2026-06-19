import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface DraftStatus {
  lastSavedLocal: string | null;
  lastSavedCloud: string | null;
  isSaving: boolean;
  hasCloudDraft: boolean;
}

export function useAutoSaveDraft<T>(
  sfType: string,
  formData: T,
  setFormData: (data: T) => void,
  initialData: T
) {
  const [status, setStatus] = useState<DraftStatus>({
    lastSavedLocal: null,
    lastSavedCloud: null,
    isSaving: false,
    hasCloudDraft: false,
  });

  const isFirstMount = useRef(true);

  // 1. Initial Load on Mount
  useEffect(() => {
    const loadDraft = async () => {
      // Load Local Storage Draft
      const localKey = `draft_${sfType}`;
      const localDataStr = localStorage.getItem(localKey);
      
      // Load Cloud Draft Info
      let cloudData: T | null = null;
      try {
        const docRef = doc(db, "pending_sf_drafts", `draft_${sfType}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudDraft = docSnap.data();
          cloudData = cloudDraft.formData as T;
          setStatus(prev => ({
            ...prev,
            hasCloudDraft: true,
            lastSavedCloud: cloudDraft.updatedAt ? new Date(cloudDraft.updatedAt).toLocaleTimeString() : null,
          }));
        }
      } catch (e) {
        console.warn("Could not fetch cloud draft for info on mount:", e);
      }

      if (localDataStr) {
        try {
          const parsed = JSON.parse(localDataStr);
          setFormData(parsed);
          setStatus(prev => ({
            ...prev,
            lastSavedLocal: new Date().toLocaleTimeString(),
          }));
          toast.info(`Restored unsaved local draft for ${sfType}`);
        } catch (_) {}
      } else if (cloudData) {
        // If no local draft exists but a cloud draft does, ask user or restore
        setFormData(cloudData);
        toast.info(`Restored unsaved cloud draft for ${sfType}`);
      }
      isFirstMount.current = false;
    };

    loadDraft();
  }, [sfType]);

  // 2. Automagical 5 Seconds Auto-Saver to LocalStorage and Firestore
  useEffect(() => {
    if (isFirstMount.current) return;

    const saveTimer = setTimeout(async () => {
      setStatus(prev => ({ ...prev, isSaving: true }));
      const timeString = new Date().toLocaleTimeString();

      try {
        // Save Local
        localStorage.setItem(`draft_${sfType}`, JSON.stringify(formData));

        // Save Cloud
        const docId = `draft_${sfType}`;
        await setDoc(doc(db, "pending_sf_drafts", docId), {
          id: docId,
          sfType,
          formData,
          updatedAt: new Date().toISOString(),
          updatedBy: "Admin / Personnel Officer"
        });

        setStatus({
          lastSavedLocal: timeString,
          lastSavedCloud: timeString,
          isSaving: false,
          hasCloudDraft: true,
        });
      } catch (err) {
        console.warn("Failed to auto-save to cloud:", err);
        setStatus(prev => ({
          ...prev,
          lastSavedLocal: timeString,
          isSaving: false,
        }));
      }
    }, 5000);

    return () => clearTimeout(saveTimer);
  }, [formData, sfType]);

  // Helper to force manual save
  const triggerManualSave = async () => {
    setStatus(prev => ({ ...prev, isSaving: true }));
    const timeString = new Date().toLocaleTimeString();
    try {
      localStorage.setItem(`draft_${sfType}`, JSON.stringify(formData));
      
      await setDoc(doc(db, "pending_sf_drafts", `draft_${sfType}`), {
        id: `draft_${sfType}`,
        sfType,
        formData,
        updatedAt: new Date().toISOString(),
        updatedBy: "Admin / Personnel Officer"
      });

      setStatus({
        lastSavedLocal: timeString,
        lastSavedCloud: timeString,
        isSaving: false,
        hasCloudDraft: true,
      });
      toast.success("Draft backed up to secure cloud storage!");
    } catch (err) {
      toast.error("Cloud backup failed, draft saved locally instead.");
      setStatus(prev => ({
        ...prev,
        lastSavedLocal: timeString,
        isSaving: false,
      }));
    }
  };

  // Helper to clear draft
  const clearDraft = async () => {
    localStorage.removeItem(`draft_${sfType}`);
    try {
      await deleteDoc(doc(db, "pending_sf_drafts", `draft_${sfType}`));
    } catch (e) {
      console.warn("Failed deleting cloud draft", e);
    }
    setFormData(initialData);
    setStatus({
      lastSavedLocal: null,
      lastSavedCloud: null,
      isSaving: false,
      hasCloudDraft: false,
    });
    toast.success(`Cleared draft and restarted form for ${sfType}`);
  };

  return {
    status,
    triggerManualSave,
    clearDraft,
  };
}
