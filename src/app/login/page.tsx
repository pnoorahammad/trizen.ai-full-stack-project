"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user.role === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/30">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-extrabold text-white tracking-tight">Trizen.ai</span>
        </div>
        <h2 className="text-center text-xl font-medium text-slate-400">
          Photo Sharing Platform Portal
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@trizen.com or team@trizen.com"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/25 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Quick Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@trizen.com");
                  setPassword("Admin@123");
                }}
                className="py-2.5 px-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-medium text-slate-200 text-left flex flex-col transition-all"
              >
                <span className="font-bold text-indigo-400">Admin</span>
                <span className="text-slate-400 text-[10px]">admin@trizen.com</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("team@trizen.com");
                  setPassword("Team@123");
                }}
                className="py-2.5 px-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-medium text-slate-200 text-left flex flex-col transition-all"
              >
                <span className="font-bold text-emerald-400">Team Member</span>
                <span className="text-slate-400 text-[10px]">team@trizen.com</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex justify-center items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Secure JWT & RBAC Protected Engine
        </div>
      </div>
    </div>
  );
}
