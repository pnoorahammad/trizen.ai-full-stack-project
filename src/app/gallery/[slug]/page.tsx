"use client";

import { useState, useEffect, use } from "react";
import {
  Lock,
  Camera,
  Download,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Photo {
  id: string;
  url: string;
  filename: string;
  createdAt: string;
}

interface GalleryData {
  unlocked: boolean;
  event: {
    title: string;
    description: string;
    date: string;
  };
  photos?: Photo[];
}

export default function PublicGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<GalleryData | null>(null);

  // Lightbox Modal
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchGalleryPhotos();
  }, [slug]);

  const fetchGalleryPhotos = async () => {
    try {
      const res = await fetch(`/api/gallery/${slug}/photos`);
      const data = await res.json();

      if (res.status === 404) {
        setError("Gallery not found or unpublished.");
        setLoading(false);
        return;
      }

      setGallery(data);
    } catch (err) {
      setError("Failed to load gallery details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/gallery/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PIN verification failed");

      // Reload gallery photos on successful cookie unlock
      fetchGalleryPhotos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <Camera className="w-8 h-8 text-indigo-500 animate-pulse" />
          <span className="text-sm font-medium">Loading Gallery...</span>
        </div>
      </div>
    );
  }

  // State 1: Locked Gallery (Requires 6-Digit PIN)
  if (!gallery?.unlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Dynamic Glowing Accents */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full z-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {gallery?.event?.title || "Protected Customer Gallery"}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Enter the 6-digit access PIN provided by your photographer to view your curated photo gallery.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl">
            {error && (
              <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 text-center uppercase tracking-widest mb-3">
                  Security PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full text-center py-4 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || pin.length !== 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {verifying ? "Unlocking Gallery..." : "Unlock Access"}
              </button>
            </form>

            <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Private & Encrypted Client Access
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Unlocked Public Customer Gallery Grid
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Banner */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">{gallery.event.title}</h2>
              <span className="text-[10px] text-slate-400">Official Customer Gallery</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Unlocked</span>
          </div>
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">{gallery.event.title}</h1>
          {gallery.event.description && (
            <p className="text-slate-400 text-sm mt-2">{gallery.event.description}</p>
          )}
          <p className="text-xs text-indigo-400 font-semibold mt-2">
            Showing {gallery.photos?.length || 0} Curated Highlights
          </p>
        </div>

        {gallery.photos?.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No curated photos published yet.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {gallery.photos?.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative group rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer break-inside-avoid shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-xs">
                  <span className="p-3 bg-slate-900/90 rounded-xl text-white hover:scale-110 transition-transform">
                    <Eye className="w-5 h-5 text-indigo-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Fullscreen Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-full cursor-pointer transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.filename}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />

            <div className="mt-4 flex items-center justify-between w-full max-w-md px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <span className="text-slate-300 font-mono truncate mr-4">
                {selectedPhoto.filename}
              </span>
              <a
                href={selectedPhoto.url}
                target="_blank"
                download={selectedPhoto.filename}
                rel="noreferrer"
                className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
