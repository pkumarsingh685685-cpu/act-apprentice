import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { uploadToStorage } from "../utils/upload";
import {
  LogOut,
  Plus,
  Trash2,
  Settings,
  List,
  FileText,
  Image as ImageIcon,
  Upload,
  PanelTop,
  LayoutDashboard,
} from "lucide-react";
import { Header } from "../components/Header";
import {
  DocumentCategory,
  DocumentItem,
  SiteConfig,
  HeaderConfig,
} from "../types";
import { toast } from "sonner";

export default function AdminDashboard() {
  const isAdmin = useStore((state) => state.isAdmin);
  const lastLoginTime = useStore((state) => state.lastLoginTime);
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tabs = [
    { id: "dashboard", name: "Dashboard Overview", icon: LayoutDashboard },
    { id: "settings", name: "Global Settings", icon: Settings },
    { id: "header", name: "Header Management", icon: PanelTop },
    { id: "audio", name: "Audio Upload (Home Screen)", icon: PanelTop },
    { id: "logo", name: "Logo Management", icon: ImageIcon },
    { id: "slider", name: "Banner & Slider Management", icon: ImageIcon },
    { id: "noticeImage", name: "Homepage Image Management", icon: ImageIcon },
    { id: "notices", name: "Notices", icon: FileText },
    { id: "notifications", name: "Notifications", icon: FileText },
    { id: "meritPanels", name: "Merit Panels", icon: List },
    { id: "results", name: "Results", icon: List },
    { id: "darCirculars", name: "DAR Circulars", icon: FileText },
    { id: "actCirculars", name: "Act Circulars", icon: FileText },
    { id: "links", name: "Railways Website Link", icon: Settings },
    { id: "externalLinks", name: "External Links", icon: Settings },
    { id: "internalLinks", name: "Internal Links", icon: Settings },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-[#1c3f60] text-white shrink-0 flex flex-col">
        <div className="p-4 bg-[#15304a] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Admin CMS</h2>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 flex items-center gap-2 hover:bg-red-500/20 rounded-md text-red-400 transition-colors text-sm font-medium"
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full text-center text-sm font-bold py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-md transition-all flex items-center justify-center gap-2 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-[pulse_2s_ease-in-out_infinite] hover:scale-[1.02]"
          >
            View Website
          </button>
        </div>
        <div className="px-4 py-3 bg-[#11273c] text-xs text-gray-300 border-b border-[#0d1e2e]">
          <div>
            <span className="font-semibold text-white">Logged in as:</span>{" "}
            Admin
          </div>
          {lastLoginTime && (
            <div className="mt-0.5">
              <span className="font-semibold text-white">Last Login:</span>{" "}
              {new Date(lastLoginTime).toLocaleString()}
            </div>
          )}
        </div>
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-[#e31837] text-white"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === "dashboard" && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <LayoutDashboard className="w-16 h-16 text-[#1c3f60] mb-4 opacity-80" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to Admin Portal
              </h2>
              <p className="text-gray-500 max-w-md">
                Please select an option from the sidebar to manage your content,
                settings, and documents.
              </p>
            </div>
          )}
          {activeTab === "settings" && <SettingsForm />}
          {activeTab === "header" && <HeaderManager />}
          {activeTab === "audio" && <AudioManager />}
          {activeTab === "logo" && <LogoManager />}
          {activeTab === "slider" && <SliderManager />}
          {activeTab === "noticeImage" && <NoticeImageManager />}
          {[
            "notices",
            "notifications",
            "meritPanels",
            "results",
            "darCirculars",
            "actCirculars",
          ].includes(activeTab) && (
            <DocumentManager
              type={activeTab as DocumentCategory}
              title={tabs.find((t) => t.id === activeTab)?.name || ""}
            />
          )}
          {activeTab === "links" && <LinksManager />}
          {activeTab === "externalLinks" && <ExternalLinksManager />}
          {activeTab === "internalLinks" && <InternalLinksManager />}
        </div>
      </div>
    </div>
  );
}

// Logo Manager Helper
function LogoManager() {
  const logos = useStore((state) => state.logos);
  const updateLogo = useStore((state) => state.updateLogo);

  const handles = [
    { key: "railwayLogo", label: "Railway Logo" },
    { key: "govLogo", label: "Government Logo" },
    { key: "nationalEmblem", label: "National Emblem" },
  ];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const max = 400; // Compress
            if (width > max || height > max) {
              const ratio = Math.min(max / width, max / height);
              width = width * ratio;
              height = height * ratio;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Failed to create blob"));
                try {
                  const url = await uploadToStorage(new File([blob], file.name, { type: 'image/webp' }), 'logos');
                  updateLogo(key as any, { image: url });
                  resolve(true);
                } catch (err) {
                  reject(err);
                }
              }, "image/webp", 0.8);
            } else {
              reject();
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Logo Uploaded Successfully",
      error: (err: any) => err.message || "Upload Failed",
    });
  };

  const handleRemove = (key: string) => {
    const promise = new Promise((resolve) => {
      updateLogo(key as any, { image: "" });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleToggle = (key: string, enabled: boolean) => {
    const promise = new Promise((resolve) => {
      updateLogo(key as any, { enabled });
      setTimeout(resolve, 200);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Logo Management</h3>
        <p className="text-sm text-gray-500">
          Only ONE active logo per category. Upload to replace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {handles.map((item) => {
          const logoData = logos[item.key as keyof typeof logos];
          return (
            <div
              key={item.key}
              className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-center mb-4">
                <h4 className="font-semibold text-sm">{item.label}</h4>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded shadow-sm border">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${logoData.enabled ? "text-green-600" : "text-red-500"}`}
                  >
                    {logoData.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={logoData.enabled}
                    onChange={(e) => handleToggle(item.key, e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
              <div className="w-full flex-1 flex flex-col items-center justify-center mb-4 min-h-[120px] bg-white border border-dashed border-gray-300 rounded p-4 relative">
                {logoData.image ? (
                  <img
                    src={logoData.image}
                    alt={item.label}
                    className="max-h-[100px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No image set</span>
                )}
                {!logoData.enabled && (
                  <div className="absolute inset-0 bg-gray-100/60 rounded flex items-center justify-center">
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow">
                      Disabled
                    </span>
                  </div>
                )}
              </div>
              <div className="w-full flex gap-2">
                <label className="flex-1 cursor-pointer bg-[#1c3f60] text-white py-2 px-3 rounded-md text-sm font-medium text-center hover:bg-blue-900 transition flex items-center justify-center gap-2">
                  <Upload size={16} /> {logoData.image ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, item.key)}
                  />
                </label>
                {logoData.image && (
                  <button
                    onClick={() => handleRemove(item.key)}
                    className="bg-red-100 text-red-600 px-3 py-2 rounded-md hover:bg-red-200 transition"
                    title="Delete Logo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Homepage Image Management
function NoticeImageManager() {
  const noticeImage = useStore((state) => state.noticeImage);
  const updateNoticeImage = useStore((state) => state.updateNoticeImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const max = 1200; // Compress
            if (width > max || height > max) {
              const ratio = Math.min(max / width, max / height);
              width = width * ratio;
              height = height * ratio;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Failed to create blob"));
                try {
                  const url = await uploadToStorage(new File([blob], file.name, { type: 'image/webp' }), 'notices');
                  updateNoticeImage({ image: url });
                  resolve(true);
                } catch (err) {
                  reject(err);
                }
              }, "image/webp", 0.8);
            } else {
              reject();
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      e.target.value = "";
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Image Uploaded Successfully",
      error: "Upload Failed",
    });
  };

  const handleDelete = () => {
    const promise = new Promise((resolve) => {
      updateNoticeImage({ image: "" });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleUpdate = (data: Partial<typeof noticeImage>) => {
    updateNoticeImage(data);
  };

  const handleToggle = (enabled: boolean) => {
    const promise = new Promise((resolve) => {
      updateNoticeImage({ enabled });
      setTimeout(resolve, 200);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Homepage Image Management</h3>
          <p className="text-sm text-gray-500">
            Image displayed directly below the Notice Board.
          </p>
        </div>
      </div>

      <div className="border border-gray-200 rounded p-4 flex flex-col md:flex-row gap-4 bg-white shadow-sm overflow-hidden relative">
        {!noticeImage.enabled && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10">
            Disabled
          </div>
        )}
        <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 flex-shrink-0 flex items-center justify-center rounded overflow-hidden relative">
          {noticeImage.image ? (
            <img
              src={noticeImage.image}
              className={`w-full h-full object-cover ${!noticeImage.enabled ? "opacity-50 grayscale" : ""}`}
              alt={noticeImage.title}
            />
          ) : (
            <span className="text-xs text-gray-400">No Image Uploaded</span>
          )}

          <label className="absolute bottom-2 right-2 cursor-pointer bg-[#1c3f60] text-white p-2 rounded-full hover:bg-blue-900 transition shadow">
            <Upload size={16} />
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Image Title
              </label>
              <input
                type="text"
                value={noticeImage.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                onBlur={() => handleToggle(noticeImage.enabled)}
                className="w-full p-2 text-sm border rounded font-semibold focus:ring-1 focus:ring-[#1c3f60]"
                placeholder="Image Title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Image Description
              </label>
              <textarea
                value={noticeImage.description}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                onBlur={() => handleToggle(noticeImage.enabled)}
                rows={3}
                className="w-full p-2 text-sm border rounded text-gray-600 focus:ring-1 focus:ring-[#1c3f60]"
                placeholder="Short description..."
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border">
              <span className="text-xs font-bold text-gray-700">Display:</span>
              <input
                type="checkbox"
                checked={noticeImage.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-600">
                {noticeImage.enabled ? "On" : "Off"}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={!noticeImage.image}
                className="p-1 px-3 border rounded text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Banner Slider Manager
function SliderManager() {
  const sliderImages = useStore((state) => state.sliderImages);
  const addSliderImage = useStore((state) => state.addSliderImage);
  const updateSliderImage = useStore((state) => state.updateSliderImage);
  const deleteSliderImage = useStore((state) => state.deleteSliderImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (sliderImages.length >= 10) {
      toast.error("Maximum 10 images allowed. Please delete an image first.");
      return;
    }

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const max = 1200; // Compress
            if (width > max || height > max) {
              const ratio = Math.min(max / width, max / height);
              width = width * ratio;
              height = height * ratio;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Failed to create blob"));
                try {
                  const url = await uploadToStorage(new File([blob], file.name, { type: 'image/webp' }), 'sliders');
                  addSliderImage({
                    title: "New Slider Banner",
                    description: "",
                    image: url,
                    enabled: true,
                    order: sliderImages.length + 1,
                  });
                  resolve(true);
                } catch (err) {
                  reject(err);
                }
              }, "image/webp", 0.8);
            } else {
              reject();
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      // reset input
      e.target.value = "";
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Image Uploaded Successfully",
      error: "Upload Failed",
    });
  };

  const handleMove = (id: string, dir: -1 | 1) => {
    const list = [...sliderImages].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((i) => i.id === id);
    if ((dir === -1 && idx > 0) || (dir === 1 && idx < list.length - 1)) {
      const temp = list[idx].order;
      list[idx].order = list[idx + dir].order;
      list[idx + dir].order = temp;
      // save
      const promise = new Promise((resolve) => {
        updateSliderImage(list[idx].id, { order: list[idx].order });
        updateSliderImage(list[idx + dir].id, { order: list[idx + dir].order });
        setTimeout(resolve, 200);
      });
      toast.promise(promise, {
        loading: "Saving...",
        success: "Updated Successfully",
        error: "Update Failed",
      });
    }
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteSliderImage(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleUpdate = (
    id: string,
    data: Partial<(typeof sliderImages)[0]>,
  ) => {
    // For text inputs like title and description, we don't want to show toasts on every keystroke.
    // But for checkbox (enabled) we want to. Let's just update silently here, and add a separate save button for text, or just update silently.
    updateSliderImage(id, data);
  };

  const handleToggle = (id: string, enabled: boolean) => {
    const promise = new Promise((resolve) => {
      updateSliderImage(id, { enabled });
      setTimeout(resolve, 200);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  const sortedImages = [...sliderImages].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Banner & Slider Management</h3>
          <p className="text-sm text-gray-500">
            {sliderImages.length}/10 images uploaded.
          </p>
        </div>
        <label
          className={`cursor-pointer bg-[#1c3f60] text-white py-2 px-4 rounded-md text-sm font-medium text-center hover:bg-blue-900 transition flex items-center justify-center gap-2 ${sliderImages.length >= 10 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Plus size={16} /> Add Image
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={sliderImages.length >= 10}
          />
        </label>
      </div>

      {sliderImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded border border-dashed">
          No slider images found. Upload an image to preview the homepage
          slider.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedImages.map((img, index) => (
            <div
              key={img.id}
              className="border border-gray-200 rounded p-4 flex flex-col md:flex-row gap-4 bg-white shadow-sm overflow-hidden relative"
            >
              {!img.enabled && (
                <div className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10">
                  Disabled
                </div>
              )}
              <div className="w-full md:w-64 h-32 md:h-auto bg-gray-100 flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                <img
                  src={img.image}
                  className={`w-full h-full object-cover ${!img.enabled ? "opacity-50 grayscale" : ""}`}
                  alt={img.title}
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={img.title}
                    onChange={(e) =>
                      handleUpdate(img.id, { title: e.target.value })
                    }
                    onBlur={() => handleToggle(img.id, img.enabled)}
                    className="w-full p-2 text-sm border rounded font-semibold focus:ring-1 focus:ring-[#1c3f60]"
                    placeholder="Banner Title"
                  />
                  <textarea
                    value={img.description}
                    onChange={(e) =>
                      handleUpdate(img.id, { description: e.target.value })
                    }
                    onBlur={() => handleToggle(img.id, img.enabled)}
                    rows={2}
                    className="w-full p-2 text-sm border rounded text-gray-600 focus:ring-1 focus:ring-[#1c3f60]"
                    placeholder="Banner short description..."
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border">
                    <span className="text-xs font-bold text-gray-700">
                      Display:
                    </span>
                    <input
                      type="checkbox"
                      checked={img.enabled}
                      onChange={(e) => handleToggle(img.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-600">
                      {img.enabled ? "On" : "Off"}
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMove(img.id, -1)}
                      disabled={index === 0}
                      className="p-1 px-2 border rounded text-xs bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Up
                    </button>
                    <button
                      onClick={() => handleMove(img.id, 1)}
                      disabled={index === sortedImages.length - 1}
                      className="p-1 px-2 border rounded text-xs bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Down
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-1 px-2 border rounded text-xs text-red-600 hover:bg-red-50 ml-4 flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Form Helper
function SettingsForm() {
  const storeConfig = useStore((state) => state.config);
  const updateConfig = useStore((state) => state.updateConfig);
  const [localConfig, setLocalConfig] = useState<SiteConfig>(storeConfig);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setLocalConfig({ ...localConfig, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const promise = new Promise((resolve) => {
      Object.entries(localConfig).forEach(([k, v]) => {
        updateConfig(k as keyof SiteConfig, v as string);
      });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Saved Successfully",
      error: "Save Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">Global Settings</h3>
        <button
          onClick={handleSave}
          className="bg-[#1c3f60] hover:bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          Save Settings
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Helpline Number
          </label>
          <input
            name="helpline"
            value={localConfig.helpline}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Header Email</label>
          <input
            name="email"
            value={localConfig.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Marquee Text</label>
          <input
            name="marqueeText"
            value={localConfig.marqueeText}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Cloudinary Settings */}
        <div className="md:col-span-2 mt-4 pt-4 border-t">
          <h4 className="text-md font-semibold mb-3">Cloudinary Setup (For Image/PDF Uploads)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cloud Name</label>
              <input
                name="cloudinaryName"
                value={localConfig.cloudinaryName || ''}
                onChange={handleChange}
                placeholder="e.g. dxyz123"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upload Preset</label>
              <input
                name="cloudinaryPreset"
                value={localConfig.cloudinaryPreset || ''}
                onChange={handleChange}
                placeholder="e.g. my_preset"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These settings locally override environment variables.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Mobile
          </label>
          <input
            name="contactMobile"
            value={localConfig.contactMobile}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Email
          </label>
          <input
            name="contactEmail"
            value={localConfig.contactEmail}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Contact Address
          </label>
          <textarea
            name="contactAddress"
            value={localConfig.contactAddress}
            onChange={handleChange}
            className="w-full p-2 border rounded h-24"
          />
        </div>
      </div>
    </div>
  );
}

// Document Manager Helper
function DocumentManager({
  type,
  title,
}: {
  type: DocumentCategory;
  title: string;
}) {
  const items = useStore((state) => state[type]);
  const addDocument = useStore((state) => state.addDocument);
  const deleteDocument = useStore((state) => state.deleteDocument);

  const [isAdding, setIsAdding] = useState(false);
  const [newDoc, setNewDoc] = useState<Omit<DocumentItem, "id">>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    viewLink: "",
    downloadLink: "",
    isNew: false,
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addDocument(type, newDoc);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Document Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewDoc({
      title: "",
      date: new Date().toISOString().split("T")[0],
      viewLink: "",
      downloadLink: "",
      isNew: false,
      order: items.length + 2,
    });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteDocument(type, id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">{title} Management</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add New
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              required
              value={newDoc.title}
              onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              className="w-full p-2 border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={newDoc.date}
              onChange={(e) => setNewDoc({ ...newDoc, date: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Order Index (Lower = First)
            </label>
            <input
              type="number"
              required
              value={newDoc.order}
              onChange={(e) =>
                setNewDoc({ ...newDoc, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Upload Document (PDF/Image) to Cloudinary
            </label>
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const toastId = toast.loading("Uploading attached document to Cloudinary...");
                try {
                  const url = await uploadToStorage(file, "documents");
                  setNewDoc({ ...newDoc, viewLink: url, downloadLink: url });
                  toast.success("Document uploaded successfully", { id: toastId });
                } catch (err: any) {
                  toast.error(err.message || "Document upload failed", { id: toastId });
                }
              }}
              className="w-full p-2 border rounded bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              File View Link (Auto-filled on upload)
            </label>
            <input
              value={newDoc.viewLink}
              onChange={(e) =>
                setNewDoc({ ...newDoc, viewLink: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              File Download Link (Auto-filled on upload)
            </label>
            <input
              value={newDoc.downloadLink}
              onChange={(e) =>
                setNewDoc({ ...newDoc, downloadLink: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isNew"
              checked={newDoc.isNew}
              onChange={(e) =>
                setNewDoc({ ...newDoc, isNew: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isNew" className="text-sm font-medium">
              Show "NEW" Badge
            </label>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 w-full sm:w-auto"
            >
              Save Item
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Title</th>
              <th className="p-3">Date</th>
              <th className="p-3">Badge</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.title}</td>
                  <td className="p-3">{item.date}</td>
                  <td className="p-3">
                    {item.isNew ? (
                      <span className="text-red-500 font-bold">NEW</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Header Manager Helper
function HeaderManager() {
  const storeHeaderConfig = useStore((state) => state.headerConfig);
  const updateHeaderConfig = useStore((state) => state.updateHeaderConfig);

  const [localConfig, setLocalConfig] =
    useState<HeaderConfig>(storeHeaderConfig);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalConfig(storeHeaderConfig);
  }, [storeHeaderConfig]);

  const handleReset = () => {
    setLocalConfig(storeHeaderConfig);
    setShowPreview(false);
  };

  const handleSave = () => {
    const promise = new Promise((resolve) => {
      updateHeaderConfig(localConfig);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Saved Successfully",
      error: "Save Failed",
    });
  };

  const fields = [
    {
      key: "mainTitle",
      label: "Main Website Title",
      textKey: "mainTitleText",
      enabledKey: "mainTitleEnabled",
    },
    {
      key: "railwayHindi",
      label: "Hindi Railway Name",
      textKey: "railwayHindiText",
      enabledKey: "railwayHindiEnabled",
    },
    {
      key: "railwayEnglish",
      label: "English Railway Name",
      textKey: "railwayEnglishText",
      enabledKey: "railwayEnglishEnabled",
    },
    {
      key: "divisionHindi",
      label: "Hindi Division Name",
      textKey: "divisionHindiText",
      enabledKey: "divisionHindiEnabled",
    },
    {
      key: "divisionEnglish",
      label: "English Division Name",
      textKey: "divisionEnglishText",
      enabledKey: "divisionEnglishEnabled",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Header Management</h3>
          <p className="text-sm text-gray-500">
            Manage the main titles and subtitles of the portal header.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium transition"
          >
            Reset
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition"
          >
            {showPreview ? "Edit Mode" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none px-4 py-2 bg-[#e31837] text-white hover:bg-red-700 rounded-md text-sm font-medium transition"
          >
            Save Updates
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="border border-gray-300 rounded-lg overflow-hidden relative shadow-inner">
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 font-bold z-10 rounded-br shadow tracking-wider uppercase">
            Preview Mode
          </div>
          <div className="bg-gray-100 p-4 sm:p-8 pt-12">
            <div className="shadow-lg rounded-xl overflow-hidden pointer-events-none border border-gray-200 bg-white">
              <Header previewConfig={localConfig} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f) => (
            <div
              key={f.key}
              className="bg-gray-50 border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <label className="text-sm font-bold text-[#1c3f60]">
                  {f.label}
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded shadow-sm border">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${localConfig[f.enabledKey as keyof HeaderConfig] ? "text-green-600" : "text-red-500"}`}
                  >
                    {localConfig[f.enabledKey as keyof HeaderConfig]
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={
                      localConfig[f.enabledKey as keyof HeaderConfig] as boolean
                    }
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        [f.enabledKey]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
              <input
                type="text"
                value={localConfig[f.textKey as keyof HeaderConfig] as string}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    [f.textKey]: e.target.value,
                  })
                }
                disabled={!localConfig[f.enabledKey as keyof HeaderConfig]}
                className={`w-full p-2 border rounded-md transition-colors font-medium text-gray-800 ${!localConfig[f.enabledKey as keyof HeaderConfig] ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Links Manager Helper
function LinksManager() {
  const items = useStore((state) => state.links);
  const addLink = useStore((state) => state.addLink);
  const deleteLink = useStore((state) => state.deleteLink);

  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addLink(newLink);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Link Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewLink({ name: "", url: "", order: items.length + 2 });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteLink(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">
          Railways Website Link Management
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add Link
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              URL (https://...)
            </label>
            <input
              required
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              required
              type="number"
              value={newLink.order}
              onChange={(e) =>
                setNewLink({ ...newLink, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">URL</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-blue-600">{item.url}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExternalLinksManager() {
  const items = useStore((state) => state.externalLinks);
  const addLink = useStore((state) => state.addExternalLink);
  const deleteLink = useStore((state) => state.deleteExternalLink);

  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addLink(newLink);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Link Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewLink({ name: "", url: "", order: items.length + 2 });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteLink(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">External Links Management</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add Link
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              required
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              required
              type="number"
              value={newLink.order}
              onChange={(e) =>
                setNewLink({ ...newLink, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">URL</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-blue-600">{item.url}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InternalLinksManager() {
  const items = useStore((state) => state.internalLinks);
  const addLink = useStore((state) => state.addInternalLink);
  const deleteLink = useStore((state) => state.deleteInternalLink);

  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addLink(newLink);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Link Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewLink({ name: "", url: "", order: items.length + 2 });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteLink(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">Internal Links Management</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add Link
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              required
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              required
              type="number"
              value={newLink.order}
              onChange={(e) =>
                setNewLink({ ...newLink, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">URL</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-blue-600">{item.url}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Audio Manager Helper
function AudioManager() {
  const audioAnnouncement = useStore((state) => state.audioAnnouncement);
  const updateAudioAnnouncement = useStore(
    (state) => state.updateAudioAnnouncement,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        const url = await uploadToStorage(file, 'audio');
        updateAudioAnnouncement({ audio: url });
        resolve(true);
      } catch (err) {
        reject(err);
      }
      e.target.value = "";
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Audio Uploaded Successfully",
      error: (err: any) => err.message || "Upload Failed",
    });
  };

  const handleDelete = () => {
    const promise = new Promise((resolve) => {
      updateAudioAnnouncement({ audio: "" });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleToggle = (enabled: boolean) => {
    const promise = new Promise((resolve) => {
      updateAudioAnnouncement({ enabled });
      setTimeout(resolve, 200);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Header Audio Management</h3>
          <p className="text-sm text-gray-500">
            Audio displayed in the header region.
          </p>
        </div>
      </div>

      <div className="border border-gray-200 rounded p-4 flex flex-col gap-4 bg-white shadow-sm overflow-hidden relative">
        {!audioAnnouncement.enabled && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10">
            Disabled
          </div>
        )}
        <div className="w-full bg-gray-100 flex-shrink-0 flex items-center justify-center p-6 rounded overflow-hidden relative">
          {audioAnnouncement.audio ? (
            <audio
              controls
              src={audioAnnouncement.audio}
              className={`w-full max-w-sm ${!audioAnnouncement.enabled ? "opacity-50 grayscale" : ""}`}
            />
          ) : (
            <span className="text-xs text-gray-400">No Audio Uploaded</span>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border">
                <span className="text-xs font-bold text-gray-700">
                  Display:
                </span>
                <input
                  type="checkbox"
                  checked={audioAnnouncement.enabled}
                  onChange={(e) => handleToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-600">
                  {audioAnnouncement.enabled ? "On" : "Off"}
                </span>
              </label>

              <label className="cursor-pointer bg-[#1c3f60] text-white px-3 py-1.5 rounded text-xs hover:bg-blue-900 transition shadow">
                Replace Audio
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={!audioAnnouncement.audio}
                className="p-1 px-3 border rounded text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete Audio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
