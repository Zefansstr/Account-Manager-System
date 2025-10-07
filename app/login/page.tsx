"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Eye, EyeOff, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated World Map Background */}
      <div className="absolute inset-0 bg-[#0a0e27]">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, #22c55e 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: 'center',
          }}
        />
        {/* Animated dots overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0e27]/50 to-[#0a0e27]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-xl px-6">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-2xl shadow-primary/50 mb-5 relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative">
              <UserCog className="h-12 w-12 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Account Management System
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form - No outer container */}
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off" data-form-type="other">
          {/* Username Field */}
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
              required
              autoComplete="off"
              name="user-identifier"
              data-lpignore="true"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 pr-12"
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
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Error Message */}
            {error && (
              <div className="backdrop-blur-md bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-full text-sm">
                {error}
              </div>
            )}

          {/* Submit Button */}
          <div className="flex justify-center pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-full shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Account Management System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </div>
  );
}

