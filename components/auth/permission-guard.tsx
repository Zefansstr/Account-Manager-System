"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { canViewMenu, isSuperAdmin } from "@/lib/permissions";

interface PermissionGuardProps {
  menuName: string;
  children: React.ReactNode;
}

export function PermissionGuard({ menuName, children }: PermissionGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // Check if super admin (bypass all checks)
      if (isSuperAdmin()) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // Check if has permission to view this menu
      const canView = canViewMenu(menuName);

      if (!canView) {
        // No access, redirect to dashboard
        router.push("/dashboard");
        return;
      }

      setHasAccess(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [menuName, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

