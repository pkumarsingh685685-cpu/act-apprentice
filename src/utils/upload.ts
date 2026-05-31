/// <reference types="vite/client" />
import { useStore } from "../store/useStore";

export async function uploadToStorage(file: File, folder: string = 'uploads'): Promise<string> {
  if (!file) throw new Error("No file provided");

  const config = useStore.getState().config;
  const cloudName = config.cloudinaryName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = config.cloudinaryPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary setup is incomplete. Please set Cloudinary Cloud Name and Upload Preset in Admin Settings -> Global Settings.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }

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
