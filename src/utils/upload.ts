/// <reference types="vite/client" />
import { useStore } from "../store/useStore";

export async function uploadToStorage(file: File, folder: string = 'uploads'): Promise<string> {
  if (!file) throw new Error("No file provided");

  const config = useStore.getState().config;
  const cloudName = config.cloudinaryName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = config.cloudinaryPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Fallback to Firebase Storage if Cloudinary is not configured
  if (!cloudName || !uploadPreset) {
    try {
      const { storage } = await import('../firebase');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (err) {
      console.error("Firebase Storage Upload Error:", err);
      throw new Error("Cloudinary is not configured, and Firebase Storage fallback failed. Please configure Cloudinary.");
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Cloudinary upload error:", errorData);
    throw new Error(errorData.error?.message || "Failed to upload to Cloudinary");
  }

  const data = await response.json();
  return data.secure_url;
}
