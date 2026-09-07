"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  CheckSquare,
  Square,
  Globe,
  Lock,
  UserPlus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface Photo {
  id: string;
  url: string;
  filename: string;
  isSelectedForGallery: boolean;
  uploadedBy: { email: string };
  createdAt: string;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  gallery?: {
    slug: string;
    isPublished: boolean;
  };
  members: { user: { id: string; email: string; role: string } }[];
  photos: Photo[];
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [slug, setSlug] = useState("");
  const [pin, setPin] = useState("");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Assign Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        if (res.status === 403) alert("Access Denied: You are not assigned to this event.");
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setEvent(data.event);
      if (data.event.gallery?.slug) {
        setSlug(data.event.gallery.slug);
      } else {
        setSlug(data.event.title.toLowerCase().replace(/[^a-z0-9]/g, "-"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Direct S3 Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(`Uploading 1 of ${files.length}...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);

      try {
        // Step 1: Request S3 pre-signed upload URL from backend
        const res = await fetch("/api/photos/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            filename: file.name,
            fileType: file.type || "image/jpeg",
            fileSize: file.size,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload URL failed");

        // Step 2: Client direct PUT file to storage endpoint
        try {
          await fetch(data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "image/jpeg" },
            body: file,
          });
        } catch (s3Err) {
          console.warn("Direct S3 PUT fallback simulation for local mode", s3Err);
        }
      } catch (err: any) {
        console.error("Upload error:", err);
      }
    }

    setUploading(false);
    setUploadProgress("");
    fetchEventDetails();
  };

  // Admin Photo Toggle Selection for Customer Gallery
  const togglePhotoSelection = async (photoId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelectedForGallery: !currentStatus }),
      });

      if (res.status === 403) {
        alert("Forbidden: Only Administrators can curate gallery photo selections.");
        return;
      }

      if (res.ok) {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                photos: prev.photos.map((p) =>
                  p.id === photoId ? { ...p, isSelectedForGallery: !currentStatus } : p
                ),
              }
            : null
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Publish Gallery Handler
  const handlePublishGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishLoading(true);
    setPublishError("");

    try {
      const res = await fetch("/api/gallery/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, slug, pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish gallery");

      setPublishSuccess(true);
      fetchEventDetails();
      setTimeout(() => setShowPublishModal(false), 1500);
    } catch (err: any) {
      setPublishError(err.message);
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading event details...
      </div>
    );
  }

  const selectedCount = event.photos.filter((p) => p.isSelectedForGallery).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </button>

          <div className="flex items-center space-x-3">
            {event.gallery?.isPublished && (
              <a
                href={`/gallery/${event.gallery.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                View Customer Gallery <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}

            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-3.5 py-1.5 rounded-lg shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              {event.gallery?.isPublished ? "Manage Gallery PIN" : "Publish Gallery"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{event.title}</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {event.description || "No description provided."}
            </p>
            <div className="flex items-center space-x-4 mt-3 text-xs text-slate-400">
              <span>📅 {new Date(event.date).toLocaleDateString()}</span>
              <span>📸 {event.photos.length} Total Photos</span>
              <span className="text-indigo-400 font-semibold">
                ✨ {selectedCount} Selected for Public Gallery
              </span>
            </div>
          </div>

          {/* Direct S3 Upload Button */}
          <div>
            <label className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? uploadProgress : "Upload Photos (S3 Pipeline)"}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Curation Grid Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-indigo-400" />
            Photo Curation Grid
          </h2>
          <span className="text-xs text-slate-400">
            Click checkbox to toggle visibility in public customer gallery.
          </span>
        </div>

        {/* Photo Grid */}
        {event.photos.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center">
            <Upload className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No photos uploaded for this event yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {event.photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative group rounded-xl overflow-hidden border transition-all ${
                  photo.isSelectedForGallery
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
                    : "border-slate-800 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full h-40 object-cover bg-slate-900"
                />

                {/* Selection Checkbox Overlay */}
                <button
                  type="button"
                  onClick={() => togglePhotoSelection(photo.id, photo.isSelectedForGallery)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 rounded-lg text-white backdrop-blur-md cursor-pointer hover:scale-110 transition-transform"
                >
                  {photo.isSelectedForGallery ? (
                    <CheckSquare className="w-5 h-5 text-indigo-400 fill-indigo-500/20" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div className="p-2 bg-slate-900/90 border-t border-slate-800 text-[10px] text-slate-400 truncate">
                  {photo.filename}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Publish Gallery Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Publish Customer Gallery</h2>
            <p className="text-xs text-slate-400 mb-4">
              Set custom access slug and 6-digit Security PIN for client viewing.
            </p>

            {publishError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {publishError}
              </div>
            )}

            {publishSuccess ? (
              <div className="p-6 text-center text-emerald-400 flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <span className="font-bold text-sm">Gallery Published Successfully!</span>
              </div>
            ) : (
              <form onSubmit={handlePublishGallery} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Public Gallery Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. wedding-preview"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Public URL: /gallery/{slug || "slug"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    6-Digit Customer Security PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 482917"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                  >
                    {publishLoading ? "Publishing..." : "Save & Publish"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
