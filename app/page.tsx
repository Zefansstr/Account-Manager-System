"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSuperAdmin, canViewMenu } from "@/lib/permissions";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const redirectBasedOnPermissions = () => {
      const operatorStr = localStorage.getItem("operator");
      if (!operatorStr) {
        router.push("/login");
        return;
      }

      try {
        // Default setelah sign in: Account Management (pakai permission dari localStorage)
        if (isSuperAdmin()) {
          router.push("/accounts");
          return;
        }

        // Priority order — Account Management pertama, pakai canViewMenu (baca dari localStorage "permissions")
        const menuPriority: { path: string; menuName: string }[] = [
          { path: "/accounts", menuName: "Accounts" },
          { path: "/dashboard", menuName: "Dashboard" },
          { path: "/applications", menuName: "Applications" },
          { path: "/lines", menuName: "Lines" },
          { path: "/departments", menuName: "Departments" },
          { path: "/roles", menuName: "Roles" },
          { path: "/operators", menuName: "Operators" },
          { path: "/operator-roles", menuName: "Operator Roles" },
          { path: "/audit-logs", menuName: "Audit Logs" },
        ];

        for (const menu of menuPriority) {
          if (canViewMenu(menu.menuName)) {
            router.push(menu.path);
            return;
          }
        }

        localStorage.removeItem("operator");
        localStorage.removeItem("permissions");
        router.push("/login");
      } catch (error) {
        console.error("Error checking permissions:", error);
        router.push("/login");
      }
    };

    redirectBasedOnPermissions();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

