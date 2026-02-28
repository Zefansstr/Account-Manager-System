"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Layers,
  Building2,
  Shield,
  ChevronDown,
  ChevronRight,
  Laptop,
  FileText,
  Wrench,
  DollarSign,
  Monitor,
  Tag,
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
    title: "Assets Master",
    href: "/asset-management/accounts",
    icon: Laptop,
    menuName: "Accounts",
  },
  {
    title: "Assignment Log",
    href: "/asset-management/assignment-log",
    icon: FileText,
    menuName: "AssignmentLog",
  },
  {
    title: "Maintenance Log",
    href: "/asset-management/maintenance-log",
    icon: Wrench,
    menuName: "MaintenanceLog",
  },
];

const settingsSubmenus = [
  {
    title: "Device",
    href: "/asset-management/devices",
    icon: Monitor,
    menuName: "Devices",
  },
  {
    title: "Brand",
    href: "/asset-management/brands",
    icon: Tag,
    menuName: "Brands",
  },
  {
    title: "Department",
    href: "/asset-management/departments",
    icon: Building2,
    menuName: "Departments",
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
          "Dashboard", "Accounts", "AssignmentLog", "MaintenanceLog",
          "Devices", "Brands", "Departments"
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
  
  const showSettingsMenu = visibleSettingsSubmenus.length > 0;

  const navItemClass = "flex items-center gap-3 rounded py-2 px-3 text-sm font-medium transition-colors";
  const navItemActive = "bg-[#7f5539] text-white";
  const navItemInactive = "text-[#1e1e1e] dark:text-gray-200 hover:bg-[rgba(127,85,57,0.08)] dark:hover:bg-white/10";
  const submenuItemClass = "flex items-center gap-3 rounded py-2 px-3 text-sm font-medium transition-colors";

  return (
    <aside className="sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-[242px] flex-shrink-0 bg-white dark:bg-[#000000] overflow-y-auto">
      <nav className="flex h-full flex-col p-4">
        <p className="text-xs font-medium text-[rgba(127,85,57,0.62)] dark:text-gray-400 mb-3 px-1 mt-1">Asset Management</p>
        <div className="flex flex-col gap-1">
        {menuItems.map((item) => {
          if (!visibleMenus.includes(item.menuName)) return null;
          const isActive = item.href === "/asset-management" 
            ? pathname === item.href || pathname === "/asset-management/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
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

        {showSettingsMenu && (
          <div className="space-y-1">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "w-full text-left",
                navItemClass,
                isSettingsOpen || visibleSettingsSubmenus.some(item => pathname === item.href || pathname.startsWith(item.href + "/")) ? navItemActive : navItemInactive
              )}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">Settings</span>
              {isSettingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
                        isActive ? "bg-[#7f5539]/10 text-[#7f5539] dark:bg-[#7f5539]/20 dark:text-[#a06540]" : "text-gray-600 dark:text-gray-400 hover:bg-[rgba(127,85,57,0.08)] dark:hover:bg-white/10"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
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
