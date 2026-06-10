/// <reference types="vite/client" />
import { useStore } from "../store/useStore";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadToStorage(file: File, folder: string = 'uploads'): Promise<string> {
  if (!file) throw new Error("No file provided");

  console.log("=== CLIENT RESILIENT UPLOAD INITIATED ===", { fileName: file.name, folder });

  const config = useStore.getState().config;
  const cloudName = (config.cloudinaryName || "").trim();
  const uploadPreset = (config.cloudinaryPreset || "").trim();

  // ==========================================
  // CHANNEL 1: Direct Cloudinary Client-Side Upload
  // ==========================================
  if (cloudName && uploadPreset) {
    try {
      console.log("=== CHANNEL 1: ATTEMPTING DIRECT CLIENT-SIDE CLOUDINARY UPLOAD ===");
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const cloudinaryForm = new FormData();
      cloudinaryForm.append("file", file);
      cloudinaryForm.append("upload_preset", uploadPreset);
      cloudinaryForm.append("folder", folder);

      const cloudinaryRes = await fetch(cloudinaryUrl, {
        method: "POST",
        body: cloudinaryForm,
      });

      if (!cloudinaryRes.ok) {
        const errText = await cloudinaryRes.text();
        throw new Error(`Cloudinary returned ${cloudinaryRes.status}: ${errText}`);
      }

      const cloudinaryData = await cloudinaryRes.json();
      const finalUrl = cloudinaryData.secure_url || cloudinaryData.url;
      
      if (finalUrl) {
        console.log("=== CHANNEL 1: DIRECT CLIENT-SIDE CLOUDINARY SUCCESS ===", finalUrl);
        return finalUrl;
      }
      throw new Error("Cloudinary response missing URL fields");
    } catch (cloudinaryDirectErr: any) {
      console.warn("=== CHANNEL 1: DIRECT CLIENT-SIDE CLOUDINARY FAILED ===", cloudinaryDirectErr);
    }
  }

  // ==========================================
  // CHANNEL 2: Firebase Storage Direct Client Upload
  // ==========================================
  try {
    console.log("=== CHANNEL 2: ATTEMPTING DIRECT FIREBASE STORAGE UPLOAD ===");
    
    // Sanitize file name for cloud safety
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFileName = `${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);

    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    
    console.log("=== CHANNEL 2: DIRECT FIREBASE STORAGE SUCCESS ===", downloadUrl);
    return downloadUrl;
  } catch (firebaseStorageErr: any) {
    console.warn("=== CHANNEL 2: DIRECT FIREBASE STORAGE FAILED ===", firebaseStorageErr);

    // ==========================================
    // CHANNEL 3: Express Server API Upload (Resilient Fallback)
    // ==========================================
    try {
      console.log("=== CHANNEL 3: ATTEMPTING EXPRESS SERVER PROXY UPLOAD ===");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      if (cloudName) {
        formData.append("cloudinaryName", cloudName);
      }
      if (uploadPreset) {
        formData.append("cloudinaryPreset", uploadPreset);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data: any;
      let isHtmlResponse = false;

      try {
        data = JSON.parse(responseText);
      } catch (parseStaticErr) {
        isHtmlResponse = true;
      }

      if (!isHtmlResponse && response.ok && data && data.url) {
        console.log("=== CHANNEL 3: EXPRESS SERVER PROXY SUCCESS ===", data.url);
        return data.url;
      }

      const sampleText = responseText.slice(0, 100).trim();
      throw new Error(`Express upload endpoint returned non-JSON/invalid status (${response.status}). Response: "${sampleText}"`);
    } catch (expressErr: any) {
      console.error("=== CHANNEL 3: EXPRESS SERVER PROXY FAILED ===", expressErr);
      throw new Error(
        `All upload channels failed! Direct and proxy uploading are unavailable.\n` +
        `- Cloudinary Direct: ${cloudName ? "Tried and failed" : "Not configured"}\n` +
        `- Firebase Cloud Storage Error: ${firebaseStorageErr.message || String(firebaseStorageErr)}\n` +
        `- Express Proxy Error: ${expressErr.message || String(expressErr)}`
      );
    }
  }
}
