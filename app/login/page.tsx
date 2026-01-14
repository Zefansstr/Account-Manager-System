"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, UserCog, Shield, ShieldCheck, Users, FileText, Settings, ArrowRight, Check, User, Lock, ArrowLeft, BarChart3, Sparkles, DollarSign, Gamepad2, LayoutDashboard, Package, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProductsPage, setShowProductsPage] = useState(false);

  // Check if already logged in on mount
  useEffect(() => {
    const operatorStr = localStorage.getItem("operator");
    if (operatorStr) {
      setIsLoggedIn(true);
    }
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
        setIsLoggedIn(true);
        setError("");
        setUsername("");
        setPassword("");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle module selection - langsung redirect tanpa login lagi
  const handleSelectModule = (module: "dashboard" | "products" | "device-management" | "operators") => {
    // Navigate immediately - let layout handle loading state
    // Using router.push with shallow routing for faster navigation
    switch (module) {
      case "dashboard":
        router.push("/dashboard");
        break;
      case "products":
        router.push("/products");
        break;
      case "device-management":
        router.push("/device-management");
        break;
      case "operators":
        router.push("/operators");
        break;
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description: "Strict access management",
    },
    {
      icon: Users,
      title: "Account Management",
      description: "Intuitive dashboard",
    },
    {
      icon: FileText,
      title: "Audit Logs",
      description: "Complete activity tracking",
    },
    {
      icon: Settings,
      title: "Customizable Settings",
      description: "Flexible configuration",
    },
  ];

  const products = [
    {
      name: "PK Mechanism Dashboard",
      logo: "/logo-product/PK Mechanism.svg",
      url: "https://pk-mechanism-dashboard.vercel.app/login",
    },
    {
      name: "USDT Tracker",
      logo: "/logo-product/usdt.svg",
      url: "https://usdt-tracking-module.vercel.app/login",
    },
    {
      name: "Efficiency Insight Dashboard",
      logo: null,
      customComponent: true, // Menggunakan komponen LogoMark
      url: "https://efficiency-insights-dashboard.vercel.app/login",
    },
    {
      name: "nexplan",
      logo: null, // Menggunakan custom underscore oranye
      customLogo: true,
      url: "https://monthlyschedulenexmax.vercel.app/login",
    },
    {
      name: "X ARENA",
      logo: null, // Logo belum ada, akan menggunakan icon fallback
      icon: Gamepad2,
      url: "https://x-arena-dashboard.vercel.app/landing",
    },
    {
      name: "SCRM Dashboard",
      logo: null, // Logo belum ada, akan menggunakan icon fallback
      icon: LayoutDashboard,
      url: "https://crm-backend-dashboard-2025-versi-1.vercel.app/login",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/background-2.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {showProductsPage && isLoggedIn ? (
          /* Products Page */
          <div className="w-full max-w-6xl mx-auto animate-fadeInUp">
            {/* Back Button */}
            <button
              onClick={() => {
                setShowProductsPage(false);
              }}
              className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group animate-fadeInUp"
              style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back to Home</span>
            </button>

            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl animate-fadeInUp transition-all duration-300" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="text-center mb-8 animate-fadeInUp" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Our Products
                </h2>
                <p className="text-gray-400 text-sm">
                  Explore our collection of products and services
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {products.map((product, index) => {
                  const Icon = product.icon;
                  return (
                    <a
                      key={index}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 hover:opacity-80 transition-opacity whitespace-nowrap flex-shrink-0 animate-fadeInUp"
                      style={{ animationDelay: `${0.4 + index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
                    >
                      {product.customLogo && product.name === "nexplan" ? (
                        <div className="flex items-center gap-0">
                          <span className="text-4xl font-bold text-orange-500 -translate-y-1">_</span>
                          <span className="text-2xl font-semibold text-white">
                            {product.name}
                          </span>
                        </div>
                      ) : product.customComponent && product.name === "Efficiency Insight Dashboard" ? (
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <LogoMark sizeClass="w-10 h-10" />
                          <span className="text-base font-semibold text-white">
                            {product.name}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="h-10 flex items-center justify-center">
                            {product.logo ? (
                              <Image
                                src={product.logo}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            ) : (
                              Icon && (
                                <Icon className="h-7 w-7 text-white group-hover:text-primary transition-colors" />
                              )
                            )}
                          </div>
                          <span className="text-base font-semibold text-white">
                            {product.name}
                          </span>
                        </>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        ) : !isLoggedIn ? (
          /* Login Form - Muncul Pertama Kali */
          <div className="w-full max-w-md mx-auto">
            <div className="backdrop-blur-md bg-white/5 border border-primary/30 rounded-3xl p-8 shadow-2xl shadow-primary/20 animate-[fadeIn_0.3s_ease-in-out] transition-all duration-300">
              {/* Header with Logo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center mb-4">
                  <Logo width={64} height={64} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Nex - Management
                </h2>
                <p className="text-gray-400 text-sm">
                  Sign In To Access All Management System
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5" autoComplete="off" data-form-type="other">
                {/* Username Field */}
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
                    className="w-full px-4 py-3 backdrop-blur-md bg-[#0a0e27]/80 border border-primary/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                    required
                    autoComplete="off"
                    name="user-identifier"
                    data-lpignore="true"
                  />
                </div>

                {/* Password Field */}
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
                      className="w-full px-4 py-3 backdrop-blur-md bg-[#0a0e27]/80 border border-primary/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 pr-12"
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
                </div>

                {/* Error Message */}
                {error && (
                  <div className="backdrop-blur-md bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary border border-primary/30 rounded-lg text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
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
            </div>
          </div>
        ) : (
          /* Landing Page Content - Sama Persis dengan Sebelumnya */
          <div className="w-full max-w-6xl mx-auto">
            {/* Logo & Title */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s', width: '96px', height: '96px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                <div className="relative">
                  <Logo width={96} height={96} />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Account Management System
              </h1>
            </div>

            {/* Sign In, Products & Device Management Buttons - Unified Color Design */}
            <div className="text-center mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {/* Account Management Card */}
                <button
                  onClick={() => handleSelectModule("dashboard")}
                  className="group relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:bg-white/10 hover:border-primary/50 hover:-translate-y-2 transform"
                >
                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Logo width={64} height={64} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      Account Management
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Access Main Dashboard
                    </p>
                    <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl" />
                </button>

                {/* Product Management Card */}
                <button
                  onClick={() => handleSelectModule("products")}
                  className="group relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:bg-white/10 hover:border-primary/50 hover:-translate-y-2 transform"
                >
                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Logo width={64} height={64} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      Product Management
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Access Company Product
                    </p>
                    <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl" />
                </button>

                {/* Device Management Card */}
                <button
                  onClick={() => handleSelectModule("device-management")}
                  className="group relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:bg-white/10 hover:border-primary/50 hover:-translate-y-2 transform"
                >
                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Logo width={64} height={64} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      Device Management
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Control Device Access
                    </p>
                    <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl" />
                </button>

                {/* Operator Setting Card */}
                <button
                  onClick={() => handleSelectModule("operators")}
                  className="group relative overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:bg-white/10 hover:border-primary/50 hover:-translate-y-2 transform"
                >
                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Logo width={64} height={64} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      Operator Setting
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Manage Operators & Permissions
                    </p>
                    <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl" />
                </button>
              </div>
            </div>

            {/* Features Grid - Below Sign In Button */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-tight">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explore More & Logout Buttons - Side by Side */}
            <div className="text-center mb-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setShowProductsPage(true)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-full shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-[1.05] active:scale-[0.95] flex items-center justify-center gap-2 min-w-[180px]"
              >
                Explore More
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("operator");
                  localStorage.removeItem("permissions");
                  setIsLoggedIn(false);
                }}
                className="px-8 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-white font-semibold rounded-full shadow-lg shadow-red-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 transform hover:scale-[1.05] active:scale-[0.95] flex items-center justify-center gap-2 min-w-[180px]"
              >
                Logout
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      {!showProductsPage && (
        <footer className="relative z-10 border-t border-white/10 py-4 -mt-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                © 2025 Account Management System. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

