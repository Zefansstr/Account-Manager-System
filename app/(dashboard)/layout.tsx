"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { NoAccess } from "@/components/auth/no-access";
import * as permissions from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/permissions";
import { Toaster } from "react-hot-toast";

// Use hasModuleAccess with fallback
const hasModuleAccess = (moduleName: string): boolean => {
  try {
    if (permissions.hasModuleAccess && typeof permissions.hasModuleAccess === 'function') {
      return permissions.hasModuleAccess(moduleName);
    }
  } catch (error) {
    console.error("Error checking module access:", error);
  }
  
  // Fallback: check if user is super admin
  if (isSuperAdmin()) return true;
  
  // Fallback: return false if function not available
  return false;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      // Check if operator is logged in
      const operatorStr = localStorage.getItem("operator");
      if (!operatorStr) {
        router.push("/login");
        return;
      }

      // Check if current path is Operator Setting pages
      const isOperatorSettingPage = 
        pathname === "/operators" || 
        pathname === "/operator-roles" || 
        pathname === "/audit-logs" ||
        pathname?.startsWith("/operators/") ||
        pathname?.startsWith("/operator-roles/") ||
        pathname?.startsWith("/audit-logs/");

      if (isOperatorSettingPage) {
        // Check module access for Operator Setting (cached)
        const access = hasModuleAccess("operator-setting");
        setHasAccess(access);
        setIsChecking(false);
      } else {
        // For Account Management pages, allow access immediately (they will use PermissionGuard on individual pages)
        setHasAccess(true);
        setIsChecking(false);
      }
    };

    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
      checkAccess();
    });
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-background">
        <Topbar />
        <NoAccess moduleName="operator-setting" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#22c55e',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#fff',
              secondary: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

