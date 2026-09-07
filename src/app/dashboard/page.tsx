"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  LogOut,
  Calendar,
  Users,
  Plus,
  ArrowRight,
  ShieldAlert,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Globe,
  Upload,
} from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  gallery?: {
    slug: string;
    isPublished: boolean;
  };
  members: { user: { id: string; email: string } }[];
  _count: { photos: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("TEAM_MEMBER");
  const [userEmail, setUserEmail] = useState<string>("");

  // New Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setEvents(data.events || []);

      // Infer role from response capabilities (or decode session token)
      const isUserAdmin = events.some((e) => e.members?.length > 0);
      setUserRole(isUserAdmin ? "ADMIN" : "TEAM_MEMBER");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, date }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");

      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setDate("");
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-wide">Trizen.ai Studio</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center text-xs font-semibold text-slate-400 hover:text-red-400 py-2 px-3 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Event Workspace</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage photography events, upload photos, and curate customer galleries.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No events assigned yet</h3>
            <p className="text-slate-500 text-xs mt-1">
              Contact an administrator or create a new event to start uploading photos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
                className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    {event.gallery?.isPublished ? (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        Published
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md flex items-center">
                        <Lock className="w-3 h-3 mr-1" />
                        Draft
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2">
                    {event.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {event._count?.photos || 0} Photos
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {event.members?.length || 0} Members
                    </span>
                  </div>

                  <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform flex items-center">
                    Open Event <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create New Event</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Arjun & Priya Wedding"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details or client notes..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  {createLoading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
