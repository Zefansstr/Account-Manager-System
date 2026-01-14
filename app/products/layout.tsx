"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ProductsSidebar } from "@/components/layout/products-sidebar";
import { NoAccess } from "@/components/auth/no-access";
import { hasModuleAccess } from "@/lib/permissions";
import { Toaster } from "react-hot-toast";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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

      // Check module access (cached for performance)
      const access = hasModuleAccess("product-management");
      setHasAccess(access);
      setIsChecking(false);
    };

    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
      checkAccess();
    });
  }, [router]);

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
        <NoAccess moduleName="product-management" />
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
        <ProductsSidebar />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

