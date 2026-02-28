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
  
  // Settings area: /settings, /applications, /lines, /departments, /roles — pakai tema coklat sama seperti account management
  const isSettingsArea =
    pathname === "/settings" ||
    pathname?.startsWith("/applications") ||
    pathname?.startsWith("/lines") ||
    pathname?.startsWith("/departments") ||
    pathname?.startsWith("/roles");

  // Hide Operators menu when in Account Management (dashboard/accounts) or Settings area
  const isAccountManagement = pathname === "/dashboard" || pathname === "/accounts" || pathname.startsWith("/accounts/") || pathname.startsWith("/dashboard/");
  const shouldHideOperatorsMenu = isAccountManagement || isSettingsArea;
  // Show Operators menu if in Operator Setting pages OR if has permission and not in Account Management
  const showOperatorsMenu = isOperatorSetting || (visibleOperatorSubmenus.length > 0 && !shouldHideOperatorsMenu);
  const showSettingsMenu = visibleSettingsSubmenus.length > 0;

  const navItemClass = "flex items-center gap-3 rounded py-2 px-3 text-sm font-medium transition-colors";
  const navItemActive = "bg-[#7f5539] text-white";
  const navItemInactive = "text-[#1e1e1e] dark:text-gray-200 hover:bg-[rgba(127,85,57,0.08)] dark:hover:bg-white/10";
  const submenuItemClass = "flex items-center gap-3 rounded py-2 px-3 text-sm font-medium transition-colors";

  return (
    <aside className="sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-[242px] flex-shrink-0 overflow-y-auto translate-z-0 will-change-[transform] backface-hidden bg-white dark:bg-[#000000]">
      <nav className="flex h-full flex-col p-4">
        {isAccountManagement && (
          <p className="text-xs font-medium text-[rgba(127,85,57,0.62)] dark:text-gray-400 mb-3 px-1 mt-1">General</p>
        )}
        {isSettingsArea && (
          <p className="text-xs font-medium text-[rgba(127,85,57,0.62)] dark:text-gray-400 mb-3 px-1 mt-1">Settings</p>
        )}
        {isOperatorSetting && (
          <p className="text-xs font-medium text-[rgba(127,85,57,0.62)] dark:text-gray-400 mb-3 px-1 mt-1">Operator Setting</p>
        )}
        <div className="flex flex-col gap-1">
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
              className={cn(navItemClass, isActive ? navItemActive : navItemInactive)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.title}</span>
            </Link>
          );
        })}

        {/* Operators Menu - Show as direct links when in Operator Setting, otherwise as submenu */}
        {showOperatorsMenu && !shouldHideOperatorsMenu && (
          <>
            {shouldShowOnlyOperators ? (
              visibleOperatorSubmenus.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(navItemClass, isActive ? navItemActive : navItemInactive)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.title}</span>
                  </Link>
                );
              })
            ) : (
              // Expandable submenu when not in Operator Setting
              <div className="space-y-1">
                <button
                  onClick={handleOperatorsToggle}
                  className={cn(navItemClass, isOperatorsActive ? navItemActive : navItemInactive, "w-full text-left")}
                >
                  <Cog className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">Operators</span>
                  {isOperatorsOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                </button>

                {/* Submenu */}
                {isOperatorsOpen && (
                  <div className="mt-1 ml-3 space-y-1">
                    {visibleOperatorSubmenus.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={cn(
                            submenuItemClass,
                            isActive ? "bg-[#7f5539]/12 dark:bg-[#7f5539]/25 text-[#7f5539] dark:text-[#a06540] hover:bg-[#7f5539]/20 dark:hover:bg-[#7f5539]/35" : "text-gray-600 dark:text-gray-400 hover:bg-[rgba(127,85,57,0.08)] dark:hover:bg-white/10"
                          )}
                        >
                          <Icon className="flex-shrink-0 h-4 w-4" />
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

        {showSettingsMenu && !shouldShowOnlyOperators && (
          <div className="space-y-1">
            <button
              onClick={handleSettingsToggle}
              className={cn(navItemClass, isSettingsActive ? navItemActive : navItemInactive, "w-full text-left")}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">Settings</span>
              {isSettingsOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            </button>
            {isSettingsOpen && (
              <div className="mt-1 ml-3 space-y-1">
                {visibleSettingsSubmenus.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        submenuItemClass,
                        isActive ? "bg-[#7f5539]/12 dark:bg-[#7f5539]/25 text-[#7f5539] dark:text-[#a06540] hover:bg-[#7f5539]/20 dark:hover:bg-[#7f5539]/35" : "text-gray-600 dark:text-gray-400 hover:bg-[rgba(127,85,57,0.08)] dark:hover:bg-white/10"
                      )}
                    >
                      <Icon className="flex-shrink-0 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </div>
      </nav>
    </aside>
  );
}
