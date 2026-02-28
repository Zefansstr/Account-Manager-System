"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("operator", JSON.stringify(data.operator));
        localStorage.setItem("permissions", JSON.stringify(data.permissions));
        setUsername("");
        setPassword("");
        router.push("/");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/background-2.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="backdrop-blur-md bg-white/5 border border-primary/30 rounded-3xl p-8 shadow-2xl shadow-primary/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Logo width={96} height={96} variant="green" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Nex - Management
            </h2>
            <p className="text-gray-400 text-sm">
              Sign in to access the management system
            </p>
          </div>

          {!mounted ? (
            <div className="space-y-5 animate-pulse">
              <div className="h-10 rounded-lg bg-white/10" />
              <div className="h-10 rounded-lg bg-white/10" />
              <div className="h-12 rounded-lg bg-white/10" />
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5" autoComplete="off" data-form-type="other">
              <div>
                <label className="flex items-center gap-2 text-white mb-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 backdrop-blur-md bg-[#0a0e27]/80 border border-primary/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  required
                  autoComplete="off"
                  name="user-identifier"
                  data-lpignore="true"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-white mb-2 text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 backdrop-blur-md bg-[#0a0e27]/80 border border-primary/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all pr-12"
                    required
                    autoComplete="off"
                    name="user-secret"
                    data-lpignore="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="backdrop-blur-md bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary border border-primary/30 rounded-lg text-white font-semibold shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
