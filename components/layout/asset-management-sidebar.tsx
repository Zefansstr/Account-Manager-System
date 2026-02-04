"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  AppWindow,
  Layers,
  Building2,
  Shield,
  ChevronDown,
  ChevronRight,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canViewMenu, isSuperAdmin } from "@/lib/permissions";

const menuItems = [
  {
    title: "Dashboard",
    href: "/asset-management",
    icon: LayoutDashboard,
    menuName: "Dashboard",
  },
  {
    title: "Assets",
    href: "/asset-management/accounts",
    icon: Laptop,
    menuName: "Accounts",
  },
];

const settingsSubmenus = [
  {
    title: "Type",
    href: "/asset-management/applications",
    icon: AppWindow,
    menuName: "Applications",
  },
  {
    title: "Brand",
    href: "/asset-management/lines",
    icon: Layers,
    menuName: "Lines",
  },
];

export function AssetManagementSidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleMenus, setVisibleMenus] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check permissions on mount (optimized)
  useEffect(() => {
    const checkPermissions = () => {
      const admin = isSuperAdmin();
      setIsAdmin(admin);
      
      if (admin) {
        // Super Admin can see everything
        setVisibleMenus([
          "Dashboard", "Accounts", 
          "Applications", "Lines"
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

  // Auto-expand submenus based on current path
  useEffect(() => {
    const settingsSubmenuPaths = settingsSubmenus.map(item => item.href);
    
    if (settingsSubmenuPaths.some(path => pathname.startsWith(path))) {
      setIsSettingsOpen(true);
    }
  }, [pathname]);
  
  const visibleSettingsSubmenus = settingsSubmenus.filter(item => 
    visibleMenus.includes(item.menuName)
  );
  
  // Check if parent menus should be visible (at least one submenu is visible)
  const showSettingsMenu = visibleSettingsSubmenus.length > 0;

  return (
    <aside className="sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
      <nav className="flex h-full flex-col gap-1 p-4">
        {/* Regular Menu Items */}
        {menuItems.map((item) => {
          // Check if menu is visible
          if (!visibleMenus.includes(item.menuName)) {
            return null;
          }
          
          // For Dashboard: exact match only
          // For other items: exact match or starts with
          const isActive = item.href === "/asset-management" 
            ? pathname === item.href || pathname === "/asset-management/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
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

        {/* Settings with Submenu */}
        {showSettingsMenu && (
          <div>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isSettingsOpen || visibleSettingsSubmenus.some(item => pathname.startsWith(item.href))
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </div>
              {isSettingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {isSettingsOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {visibleSettingsSubmenus.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-primary/20 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
      </nav>
    </aside>
  );
}
