/// <reference types="vite/client" />
import { useStore } from "../store/useStore";

export async function uploadToStorage(file: File, folder: string = 'uploads'): Promise<string> {
  if (!file) throw new Error("No file provided");

  console.log("=== CLIENT UPLOAD TO PROXY ===", { fileName: file.name, folder });

  const config = useStore.getState().config;
  const cloudName = (config.cloudinaryName || "").trim();
  const uploadPreset = (config.cloudinaryPreset || "").trim();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (cloudName) {
    formData.append("cloudinaryName", cloudName);
  }
  if (uploadPreset) {
    formData.append("cloudinaryPreset", uploadPreset);
  }

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed via server proxy");
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error("No file URL returned from server upload handler");
    }

    console.log("=== PROXY UPLOAD SUCCESS ===", data.url);
    return data.url;
  } catch (error: any) {
    console.error("Client Upload Proxy Error:", error);
    throw new Error(error.message || "File upload failed via server proxy. Please check connection.");
  }
}


