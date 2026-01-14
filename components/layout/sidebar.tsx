"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  AppWindow,
  Layers,
  Building2,
  Shield,
  UserCog,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canViewMenu, isSuperAdmin } from "@/lib/permissions";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    menuName: "Dashboard",
  },
  {
    title: "Accounts",
    href: "/accounts",
    icon: UserCog,
    menuName: "Accounts",
  },
];

const operatorSubmenus = [
  {
    title: "Operators",
    href: "/operators",
    icon: UserCog,
    menuName: "Operators",
  },
  {
    title: "Roles",
    href: "/operator-roles",
    icon: Cog,
    menuName: "Operator Roles",
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: FileText,
    menuName: "Audit Logs",
  },
];

const settingsSubmenus = [
  {
    title: "Applications",
    href: "/applications",
    icon: AppWindow,
    menuName: "Applications",
  },
  {
    title: "Lines",
    href: "/lines",
    icon: Layers,
    menuName: "Lines",
  },
  {
    title: "Departments",
    href: "/departments",
    icon: Building2,
    menuName: "Departments",
  },
  {
    title: "Roles",
    href: "/roles",
    icon: Shield,
    menuName: "Roles",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOperatorsOpen, setIsOperatorsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleMenus, setVisibleMenus] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = async () => {
    try {
      const operatorStr = localStorage.getItem("operator");
      let userId, username;
      
      if (operatorStr) {
        const operator = JSON.parse(operatorStr);
        userId = operator.id;
        username = operator.username;
      }

      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });
      
      localStorage.removeItem("operator");
      localStorage.removeItem("permissions");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check permissions on mount (optimized with requestAnimationFrame)
  useEffect(() => {
    const checkPermissions = () => {
      const admin = isSuperAdmin();
      setIsAdmin(admin);
      
      if (admin) {
        // Super Admin can see everything
        setVisibleMenus([
          "Dashboard", "Accounts", 
          "Operators", "Operator Roles", "Audit Logs", 
          "Applications", "Lines", "Departments", "Roles"
        ]);
      } else {
        // Filter menus based on permissions
        // Note: Dashboard is always visible (handled in canViewMenu)
        const visible: string[] = [];
        
        // Check main menus
        menuItems.forEach((item) => {
          if (canViewMenu(item.menuName)) {
            visible.push(item.menuName);
          }
        });
        
        // Check operator submenus
        operatorSubmenus.forEach((item) => {
          if (canViewMenu(item.menuName)) {
            visible.push(item.menuName);
          }
        });
        
        // Check settings submenus
        settingsSubmenus.forEach((item) => {
          if (canViewMenu(item.menuName)) {
            visible.push(item.menuName);
          }
        });
        
        setVisibleMenus(visible);
      }
    };
    
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      checkPermissions();
    });
  }, []);

  const isOperatorsActive = operatorSubmenus.some(
    item => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  const isSettingsActive = pathname === "/settings" || 
    settingsSubmenus.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));

  const handleOperatorsToggle = () => {
    setIsOperatorsOpen(!isOperatorsOpen);
    if (!isOperatorsOpen && isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  };

  const handleSettingsToggle = () => {
    setIsSettingsOpen(!isSettingsOpen);
    if (!isSettingsOpen && isOperatorsOpen) {
      setIsOperatorsOpen(false);
    }
  };

  // Filter visible submenus
  // If in Operator Setting pages, show all operator submenus
  const isOperatorSetting = pathname === "/operators" || pathname === "/operator-roles" || pathname === "/audit-logs" || pathname.startsWith("/operators/") || pathname.startsWith("/operator-roles/") || pathname.startsWith("/audit-logs/");
  const visibleOperatorSubmenus = isOperatorSetting 
    ? operatorSubmenus 
    : operatorSubmenus.filter(item => visibleMenus.includes(item.menuName));
  
  const visibleSettingsSubmenus = settingsSubmenus.filter(item => 
    visibleMenus.includes(item.menuName)
  );
  
  // Check if parent menus should be visible (at least one submenu is visible)
  // Only show Operators menu when in Operator Setting pages
  const shouldShowOnlyOperators = isOperatorSetting;
  
  // Hide Operators menu when in Account Management (dashboard/accounts)
  const isAccountManagement = pathname === "/dashboard" || pathname === "/accounts" || pathname.startsWith("/accounts/") || pathname.startsWith("/dashboard/");
  const shouldHideOperatorsMenu = isAccountManagement;
  
  // Show Operators menu if in Operator Setting pages OR if has permission and not in Account Management
  const showOperatorsMenu = isOperatorSetting || (visibleOperatorSubmenus.length > 0 && !shouldHideOperatorsMenu);
  const showSettingsMenu = visibleSettingsSubmenus.length > 0;

  return (
    <aside className="sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
      <nav className="flex h-full flex-col gap-1 p-4">
        {/* Regular Menu Items - Hide when in Operator Setting */}
        {!shouldShowOnlyOperators && menuItems.map((item) => {
          // Check if menu is visible
          if (!visibleMenus.includes(item.menuName)) {
            return null;
          }
          
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
            </Link>
          );
        })}

        {/* Operators Menu - Show as direct links when in Operator Setting, otherwise as submenu */}
        {showOperatorsMenu && !shouldHideOperatorsMenu && (
          <>
            {shouldShowOnlyOperators ? (
              // Direct menu items when in Operator Setting
              visibleOperatorSubmenus.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-foreground hover:bg-secondary hover:text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.title}</span>
                  </Link>
                );
              })
            ) : (
              // Expandable submenu when not in Operator Setting
              <div>
                <button
                  onClick={handleOperatorsToggle}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isOperatorsActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-foreground hover:bg-secondary hover:text-primary"
                  )}
                >
                  <UserCog className="h-5 w-5" />
                  <span className="flex-1 text-left">Operators</span>
                  {isOperatorsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Submenu */}
                {isOperatorsOpen && (
                  <div className="mt-1 ml-4 space-y-1">
                    {visibleOperatorSubmenus.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/20 text-primary border-l-2 border-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Settings with Submenu - Hide when in Operator Setting */}
        {showSettingsMenu && !shouldShowOnlyOperators && (
          <div>
            <button
              onClick={handleSettingsToggle}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isSettingsActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <Settings className="h-5 w-5" />
              <span className="flex-1 text-left">Settings</span>
              {isSettingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Submenu */}
            {isSettingsOpen && (
              <div className="mt-1 ml-4 space-y-1">
                {visibleSettingsSubmenus.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/20 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Logout Button - At the bottom */}
        <div className="mt-auto pt-4 border-t border-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              "text-foreground hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <LogOut className="h-5 w-5" />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
