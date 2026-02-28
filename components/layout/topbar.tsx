"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, LogOut, Sun, Moon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { useOperatorStore } from "@/lib/operator-store";
import { hasModuleAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const MODULES = [
  { title: "Account Management", href: "/accounts" },
  { title: "Product Management", href: "/products" },
  { title: "Operator Setting", href: "/operators" },
  { title: "Asset Management", href: "/asset-management" },
] as const;

function NexgateLogo({ className }: { className?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" className={className}>
      <rect x="1" y="1" width="6" height="6" rx="1" fill="#7f5539" />
      <rect x="10" y="1" width="6" height="6" rx="1" fill="#7f5539" />
      <rect x="1" y="10" width="6" height="6" rx="1" fill="#7f5539" />
      <rect x="10" y="10" width="6" height="6" rx="1" fill="#7f5539" />
    </svg>
  );
}

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [operatorName, setOperatorName] = useState("Admin");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get operator from localStorage
    const operatorStr = localStorage.getItem("operator");
    if (operatorStr) {
      const operator = JSON.parse(operatorStr);
      setOperatorName(operator.full_name || operator.username);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    useOperatorStore.getState().clearOperator();
    localStorage.removeItem("operator");
    localStorage.removeItem("permissions");
    router.push("/");
  };

  // Determine module title based on pathname
  const getModuleTitle = () => {
    if (pathname?.startsWith("/products")) {
      return "Product Management";
    } else if (pathname?.startsWith("/asset-management")) {
      return "Asset Management";
    } else if (pathname === "/operators" || pathname === "/operator-roles" || pathname?.startsWith("/audit-logs")) {
      return "Operator Setting";
    }
    return "Account Management";
  };

  const currentTitle = getModuleTitle();
  const isAccountManagement = pathname === "/dashboard" || pathname === "/accounts" || pathname.startsWith("/accounts/") || pathname.startsWith("/dashboard/");
  const isSettingsArea = pathname === "/settings" || pathname?.startsWith("/applications") || pathname?.startsWith("/lines") || pathname?.startsWith("/departments") || pathname?.startsWith("/roles");
  const isProductManagement = pathname?.startsWith("/products");
  const isAssetManagement = pathname?.startsWith("/asset-management");
  const isOperatorSetting = pathname === "/operators" || pathname === "/operator-roles" || pathname?.startsWith("/audit-logs");
  const showModuleDropdown = isAccountManagement || isSettingsArea || isProductManagement || isAssetManagement || isOperatorSetting;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f] bg-white dark:bg-[#000000]">
      <div className="flex h-14 items-center justify-between px-6 gap-4">
        {showModuleDropdown ? (
          <div
            ref={dropdownRef}
            className="relative flex items-center gap-3 min-w-0 rounded bg-[rgba(240,232,223,0.8)] dark:bg-white/10 pl-2 pr-2 py-1.5 cursor-pointer"
          >
            <NexgateLogo className="flex-shrink-0" />
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 min-w-0 transition-colors cursor-pointer"
            >
              <h1 className="text-base font-medium text-[#1e1e1e] dark:text-white truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                {currentTitle}
              </h1>
              <ChevronDown className={`h-4 w-4 text-[#1e1e1e] dark:text-gray-300 flex-shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f] bg-white dark:bg-[#101211] shadow-lg py-1 z-50">
                {MODULES.map((m) => (
                  <button
                    key={m.href}
                    type="button"
                    onClick={() => {
                      if (m.title === "Operator Setting" && !hasModuleAccess("operator-setting")) {
                        alert("You don't have permission to access this menu. Please contact administrator.");
                        setDropdownOpen(false);
                        return;
                      }
                      if (m.title === "Product Management" && !hasModuleAccess("product-management")) {
                        alert("You don't have permission to access this menu. Please contact administrator.");
                        setDropdownOpen(false);
                        return;
                      }
                      if (m.title === "Asset Management" && !hasModuleAccess("asset-management")) {
                        alert("You don't have permission to access this menu. Please contact administrator.");
                        setDropdownOpen(false);
                        return;
                      }
                      router.push(m.href);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors rounded ${
                      currentTitle === m.title
                        ? "bg-[#7f5539]/15 dark:bg-[#7f5539]/25 text-[#7f5539] dark:text-[#a06540]"
                        : "text-[#1e1e1e] dark:text-gray-200 hover:bg-[rgba(245,237,230,0.6)] dark:hover:bg-white/10"
                    }`}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[#1e1e1e] dark:text-white">
              {currentTitle}
            </h1>
          </div>
        )}

        <div className="flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={cn(
              "h-9 w-9 p-0",
              showModuleDropdown
                ? "hover:bg-[rgba(240,232,223,0.8)] dark:hover:bg-white/10 hover:text-[#1e1e1e] dark:hover:text-white"
                : "hover:bg-secondary hover:text-foreground"
            )}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2",
            showModuleDropdown
              ? "border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f] bg-[rgba(240,232,223,0.5)] dark:bg-white/10"
              : "border-border bg-secondary"
          )}>
            <User className={cn("h-4 w-4", showModuleDropdown ? "text-[#7f5539]" : "text-primary")} />
            <span className={cn("text-sm font-medium", showModuleDropdown ? "text-[#1e1e1e] dark:text-white" : "text-foreground")}>{operatorName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "h-9 px-3 text-sm font-medium",
              showModuleDropdown
                ? "hover:bg-[rgba(127,85,57,0.08)] dark:hover:bg-white/10 hover:text-[#1e1e1e] dark:text-gray-200 dark:hover:text-white"
                : "hover:bg-secondary hover:text-foreground"
            )}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

