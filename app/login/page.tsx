"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Lock, ArrowRight, Sun, Moon, Shield, Users, BarChart3, Zap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/components/providers/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
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
        setIsLoginOpen(false);
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

  const openLogin = () => setIsLoginOpen(true);

  return (
    <div className="min-h-screen bg-[#faf8f6] dark:bg-[#0a0a0a] text-[#1e1e1e] dark:text-gray-100 transition-colors duration-300">
      {/* Theme toggle - fixed top right */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <Logo width={40} height={40} variant="green" />
          <span className="text-lg font-semibold tracking-tight text-[#1e1e1e] dark:text-white">
            Nextgate
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openLogin}
            className="hidden sm:inline-flex text-sm font-medium text-[#5d5d5d] dark:text-gray-400 hover:text-[#7f5539] dark:hover:text-[#a06540] transition-colors"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 dark:bg-white/10 border border-[#7F5539]/15 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 text-[#7f5539]" />
            ) : (
              <Sun className="h-5 w-5 text-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7f5539]/5 via-transparent to-[#7f5539]/10 dark:from-[#7f5539]/10 dark:via-transparent dark:to-[#7f5539]/5" />
        <div className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-[#7f5539]/20 dark:bg-[#7f5539]/15 blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7f5539]/10 dark:bg-[#7f5539]/20 text-[#7f5539] dark:text-[#a06540] text-sm font-medium mb-6">
              <Zap className="h-4 w-4" /> Account & access management
            </p>
            <h1 className="font-manrope text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1e1e1e] dark:text-white leading-[1.1] mb-6">
              Manage teams,{" "}
              <span className="text-[#7f5539] dark:text-[#a06540]">one place.</span>
            </h1>
            <p className="text-lg text-[#5d5d5d] dark:text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10">
              Centralized account management with roles, permissions, and full audit trails. Secure, fast, and built for scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#7f5539] hover:bg-[#6b4730] dark:bg-[#a06540] dark:hover:bg-[#8f5540] text-white font-semibold shadow-lg shadow-[#7f5539]/25 dark:shadow-[#7f5539]/30 transition-all duration-200"
              >
                Get started <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#7F5539]/30 dark:border-[#7F5539]/50 text-[#7f5539] dark:text-[#a06540] font-semibold hover:bg-[#7f5539]/5 dark:hover:bg-[#7f5539]/10 transition-all duration-200"
              >
                See features
              </a>
            </div>
          </div>
          <div className="hidden lg:block flex-1 relative">
            {/* Dashboard preview mockup */}
            <div className="max-w-md mx-auto rounded-2xl border border-[#7F5539]/20 dark:border-[#7F5539]/30 bg-white/90 dark:bg-[#141414]/95 shadow-xl shadow-[#7f5539]/15 dark:shadow-black/30 overflow-hidden backdrop-blur-sm">
              <div className="h-10 px-4 flex items-center gap-2 border-b border-[#7F5539]/15 dark:border-white/10 bg-[#f5f0eb] dark:bg-[#1a1a1a]">
                <div className="w-2 h-2 rounded-full bg-[#7f5539]/60" />
                <div className="w-2 h-2 rounded-full bg-[#7f5539]/40" />
                <div className="w-2 h-2 rounded-full bg-[#7f5539]/40" />
                <span className="ml-2 text-xs font-medium text-[#5d5d5d] dark:text-gray-500">Dashboard</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Accounts", value: "248", icon: Users },
                    { label: "Operators", value: "12", icon: Shield },
                    { label: "Active", value: "98%", icon: BarChart3 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl bg-[#faf8f6] dark:bg-white/5 border border-[#7F5539]/15 dark:border-white/10 p-3">
                      <Icon className="h-4 w-4 text-[#7f5539] dark:text-[#a06540] mb-1.5" />
                      <p className="text-[10px] font-medium text-[#5d5d5d] dark:text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className="text-lg font-bold text-[#1e1e1e] dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-[#7F5539]/15 dark:border-white/10 overflow-hidden">
                  <div className="h-8 px-3 flex items-center bg-[#f0eae4] dark:bg-white/5 border-b border-[#7F5539]/15 dark:border-white/10">
                    <span className="text-xs font-semibold text-[#1e1e1e] dark:text-white">Recent activity</span>
                  </div>
                  <div className="divide-y divide-[#7F5539]/10 dark:divide-white/10">
                    {["Account created", "Role updated", "Login"].map((text, i) => (
                      <div key={i} className="h-9 px-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7f5539] dark:bg-[#a06540]" />
                        <span className="text-xs text-[#5d5d5d] dark:text-gray-400">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 lg:px-12 bg-white/50 dark:bg-white/5 border-y border-[#7F5539]/10 dark:border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm font-medium text-[#7f5539] dark:text-[#a06540] mb-2">Why choose us</p>
          <h2 className="font-manrope text-3xl sm:text-4xl font-extrabold text-center text-[#1e1e1e] dark:text-white mb-16">
            Everything you need to stay in control
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Secure & compliant", desc: "Role-based access and full audit logs for every action." },
              { icon: Users, title: "Team & roles", desc: "Manage operators and permissions in one place." },
              { icon: BarChart3, title: "Insights & reports", desc: "Dashboards and exports to understand usage." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-8 rounded-2xl bg-white dark:bg-white/5 border border-[#7F5539]/15 dark:border-white/10 shadow-sm hover:shadow-lg hover:border-[#7F5539]/25 dark:hover:border-[#7F5539]/40 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#7f5539]/10 dark:bg-[#7f5539]/20 flex items-center justify-center mb-6 group-hover:bg-[#7f5539]/20 dark:group-hover:bg-[#7f5539]/30 transition-colors">
                  <Icon className="h-6 w-6 text-[#7f5539] dark:text-[#a06540]" />
                </div>
                <h3 className="font-manrope text-xl font-extrabold text-[#1e1e1e] dark:text-white mb-3">{title}</h3>
                <p className="text-[#5d5d5d] dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login popup */}
      <Dialog open={isLoginOpen} onOpenChange={(open) => { setIsLoginOpen(open); if (!open) setError(""); }}>
        <DialogContent className="sm:max-w-md border-[#7F5539]/20 dark:border-[#7F5539]/30 bg-white dark:bg-[#111111]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#1e1e1e] dark:text-white">Welcome back</DialogTitle>
            <p className="text-sm text-[#5d5d5d] dark:text-gray-400 mt-1">Sign in to access the management system</p>
          </DialogHeader>
          {!mounted ? (
            <div className="space-y-5 animate-pulse py-4">
              <div className="h-10 rounded-lg bg-[#7f5539]/10 dark:bg-white/10" />
              <div className="h-10 rounded-lg bg-[#7f5539]/10 dark:bg-white/10" />
              <div className="h-12 rounded-lg bg-[#7f5539]/10 dark:bg-white/10" />
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5 pt-2" autoComplete="off" data-form-type="other">
              <div>
                <label className="flex items-center gap-2 text-[#1e1e1e] dark:text-gray-200 mb-2 text-sm font-medium">
                  <User className="h-4 w-4 text-[#7f5539] dark:text-[#a06540]" />
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#faf8f6] dark:bg-[#1a1a1a] border border-[#7F5539]/25 dark:border-[#7F5539]/40 rounded-xl text-[#1e1e1e] dark:text-gray-200 placeholder:text-[#5d5d5d] dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7f5539]/50 focus:border-[#7f5539] transition-all"
                  required
                  autoComplete="off"
                  name="user-identifier"
                  data-lpignore="true"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[#1e1e1e] dark:text-gray-200 mb-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-[#7f5539] dark:text-[#a06540]" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-[#faf8f6] dark:bg-[#1a1a1a] border border-[#7F5539]/25 dark:border-[#7F5539]/40 rounded-xl text-[#1e1e1e] dark:text-gray-200 placeholder:text-[#5d5d5d] dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7f5539]/50 focus:border-[#7f5539] transition-all"
                    required
                    autoComplete="off"
                    name="user-secret"
                    data-lpignore="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5d5d5d] dark:text-gray-500 hover:text-[#7f5539] dark:hover:text-[#a06540] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#7f5539] hover:bg-[#6b4730] dark:bg-[#a06540] dark:hover:bg-[#8f5540] text-white font-semibold shadow-lg shadow-[#7f5539]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-12 border-t border-[#7F5539]/10 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo width={28} height={28} variant="green" />
            <span className="text-sm font-medium text-[#5d5d5d] dark:text-gray-500">Nextgate</span>
          </div>
          <p className="text-sm text-[#5d5d5d] dark:text-gray-500">
            © {new Date().getFullYear()} Account Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
