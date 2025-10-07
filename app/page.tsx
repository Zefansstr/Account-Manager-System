"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const redirectBasedOnPermissions = async () => {
      // Check if operator is logged in
      const operatorStr = localStorage.getItem("operator");
      
      if (!operatorStr) {
        // Redirect to login if not logged in
        router.push("/login");
        return;
      }

      try {
        const operator = JSON.parse(operatorStr);
        
        // Super Admin always goes to dashboard
        if (operator.permissions?.isSuperAdmin) {
          router.push("/dashboard");
          return;
        }

        // For other roles, check permissions
        const permissions = operator.permissions?.menus || {};
        
        // Priority order for redirect
        const menuPriority = [
          { path: "/dashboard", key: "dashboard" },
          { path: "/accounts", key: "accounts" },
          { path: "/applications", key: "applications" },
          { path: "/lines", key: "lines" },
          { path: "/departments", key: "departments" },
          { path: "/roles", key: "roles" },
          { path: "/operators", key: "operators" },
          { path: "/operator-roles", key: "operator-roles" },
          { path: "/audit-logs", key: "audit-logs" },
        ];

        // Find first accessible menu
        for (const menu of menuPriority) {
          if (permissions[menu.key]?.can_view) {
            router.push(menu.path);
            return;
          }
        }

        // If no menu is accessible, logout
        localStorage.removeItem("operator");
        alert("You don't have permission to access any menu. Please contact administrator.");
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

