"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  MessageSquare,
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
    icon: Users,
    menuName: "Accounts",
  },
  {
    title: "Support Chat",
    href: "/support-chat",
    icon: MessageSquare,
    menuName: "Support Chat",
    showBadge: true, // For unread count
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: FileText,
    menuName: "Audit Logs",
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
    icon: ShieldCheck,
    menuName: "Operator Roles",
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
  const [isOperatorsOpen, setIsOperatorsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleMenus, setVisibleMenus] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = () => {
      const admin = isSuperAdmin();
      setIsAdmin(admin);
      
      if (admin) {
        // Super Admin can see everything
        setVisibleMenus([
          "Dashboard", "Accounts", "Support Chat", "Audit Logs", 
          "Operators", "Operator Roles", 
          "Applications", "Lines", "Departments", "Roles"
        ]);
      } else {
        // Filter menus based on permissions
        // Note: Dashboard and Support Chat are always visible (handled in canViewMenu)
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
    
    checkPermissions();
    
    // Fetch unread chat count
    const fetchUnreadCount = async () => {
      try {
        const opStr = localStorage.getItem("operator");
        if (!opStr) return;
        
        const operator = JSON.parse(opStr);
        const headers: HeadersInit = { "X-Operator-Id": operator.id };
        
        const res = await fetch("/api/chat/unread-count", { headers });
        const json = await res.json();
        
        setUnreadChatCount(json.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };
    
    fetchUnreadCount();
    
    // Optimized: Refresh every 60 seconds (reduced from 30s)
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
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
  const visibleOperatorSubmenus = operatorSubmenus.filter(item => 
    visibleMenus.includes(item.menuName)
  );
  
  const visibleSettingsSubmenus = settingsSubmenus.filter(item => 
    visibleMenus.includes(item.menuName)
  );
  
  // Check if parent menus should be visible (at least one submenu is visible)
  const showOperatorsMenu = visibleOperatorSubmenus.length > 0;
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
          
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {item.showBadge && unreadChatCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Operators with Submenu */}
        {showOperatorsMenu && (
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

        {/* Settings with Submenu */}
        {showSettingsMenu && (
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
      </nav>
    </aside>
  );
}
