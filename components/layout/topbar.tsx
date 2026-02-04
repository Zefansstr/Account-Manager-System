"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, ArrowLeft, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { Logo } from "@/components/ui/logo";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [operatorName, setOperatorName] = useState("Admin");

  useEffect(() => {
    // Get operator from localStorage
    const operatorStr = localStorage.getItem("operator");
    if (operatorStr) {
      const operator = JSON.parse(operatorStr);
      setOperatorName(operator.full_name || operator.username);
    }
  }, []);

  const handleBack = () => {
    router.push("/login");
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Logo/Title */}
        <div className="flex items-center gap-3">
          {/* Logo with green circle background */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/30 flex-shrink-0">
            <Logo width={20} height={20} variant="white" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            {getModuleTitle()}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hover:bg-secondary hover:text-foreground"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{operatorName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    </header>
  );
}

