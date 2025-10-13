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
import { supabase } from "@/lib/supabase";

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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

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
    
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Request permission if not granted yet
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
    
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
    
    // Fallback: Poll for unread count every 20 seconds
    const pollInterval = setInterval(fetchUnreadCount, 20000);
    
    // Try real-time subscription (optional - fallback to polling if fails)
    const opStr = localStorage.getItem("operator");
    let channel: any = null;
    
    if (opStr) {
      const operator = JSON.parse(opStr);
      
      // Subscribe to chat_messages for real-time updates
      const channelName = `sidebar-notifications-${operator.id}`;
      console.log('🚀 Starting realtime subscription:', channelName);
      
      try {
        channel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: false },
              presence: { key: operator.id },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
            },
            async (payload) => {
              console.log('🔔 New message received:', payload);
              
              // Check if message is for current user
              const messageData = payload.new as any;
              
              // Don't show notification for own messages
              if (messageData.sender_id === operator.id) {
                console.log('⏭️ Skipping own message');
                return;
              }
              
              // Check if operator is participant in this room
              try {
                const { data: participant, error } = await supabase
                  .from('chat_participants')
                  .select('id')
                  .eq('room_id', messageData.room_id)
                  .eq('operator_id', operator.id)
                  .maybeSingle();
                
                // If not a participant, ignore this message
                if (!participant || error) {
                  console.log('⏭️ Not a participant in this room');
                  return;
                }
                
                console.log('✅ Operator is participant - showing notification');
              } catch (error) {
                console.error('Error checking participant:', error);
                return;
              }
              
              // Fetch updated unread count
              await fetchUnreadCount();
              
              // Get notification preferences
              const soundEnabled = localStorage.getItem('notification_sound') !== 'false';
              const desktopEnabled = localStorage.getItem('notification_desktop') !== 'false';
              
              console.log('🔊 Sound enabled:', soundEnabled);
              console.log('🔔 Desktop enabled:', desktopEnabled);
              
              // Play notification sound
              if (soundEnabled) {
                try {
                  // Simple beep sound
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0KVa7n77BdGAg+ltrzxnMpBSuBzfLaizsIGWi88OScSgwOUKXi8bllHAU3ktXyzn0xBSV8yvDdj0EJE12z6OysWBUIR5/e8sFuJAUuhM/x2Ik6BxtnvvDnm0gMDFCk4/K5ZBsCNpHU8tB/MwUlfc3w3I9DChRcs+jrrFgVCEae3vPDbyQELoTP8diJOgcbZ77w6JxJDA1Qo+Pzt2IbAjWQ0/HQgDQFJH3N8NyPRAoUXLPo66xYFQhFnd7zxnEmBCyDz/HaijsFG2e+8OidSgwNUKPj8rdkGwIzj9Pw0oI1BSN9zfDckUYKFFuy6OuwWhYJQ53d88d0KAUrhM/y3Iw+BxhmvfDom0kMC0+h4vO4axwCMY3S8NODNwUie8vw3ZJICBNarejqsF4YCUGa3PPIdy4FKoTP8t+PPgYWY7zv6aFOCwpLn+H1vGwhAjCMz/HVhzwGIHfH79yUTAcTVqvn67BgGwk+mNvzzn0yBS2Fz/Lfkj4GFWK77+mjUAwJSZ3g9b9xJAIuitDx14g+BiByxu/ckE4IElWq5uuwYRsJPZbb89CPOQUtg87y4JU/BhVhuuz')
                  audio.volume = 0.5;
                  await audio.play();
                  console.log('🎵 Sound played successfully');
                } catch (error) {
                  console.error('❌ Could not play sound:', error);
                }
              }
              
              // Show desktop notification
              if (desktopEnabled && notificationPermission === 'granted') {
                try {
                  // Fetch room details for better notification
                  const res = await fetch(`/api/chat/rooms/${messageData.room_id}`, {
                    headers: { "X-Operator-Id": operator.id }
                  });
                  const roomData = await res.json();
                  
                  const notification = new Notification('💬 New Message', {
                    body: `${roomData.data?.room?.subject || 'Support Chat'}: ${messageData.message.substring(0, 100)}`,
                    icon: '/icon.png',
                    badge: '/icon.png',
                    tag: messageData.room_id,
                    requireInteraction: false,
                  });
                  
                  console.log('🪟 Desktop notification shown');
                  
                  // Click notification to focus window
                  notification.onclick = () => {
                    window.focus();
                    notification.close();
                  };
                  
                  // Auto-close after 5 seconds
                  setTimeout(() => notification.close(), 5000);
                } catch (error) {
                  console.error('❌ Could not show notification:', error);
                }
              }
            }
          )
          .subscribe((status, err) => {
            console.log('📡 Realtime subscription status:', status);
            if (err) {
              console.error('❌ Realtime subscription error:', err);
              console.warn('⚠️ Falling back to polling mode');
            }
            if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime connection established!');
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('⚠️ Realtime channel error - using polling mode');
            } else if (status === 'TIMED_OUT') {
              console.warn('⚠️ Realtime connection timed out - using polling mode');
            } else if (status === 'CLOSED') {
              console.log('⚠️ Realtime connection closed');
            }
          });
      } catch (error) {
        console.error('Failed to setup realtime subscription:', error);
        console.warn('⚠️ Using polling mode only');
      }
    }
    
    return () => {
      console.log('🔌 Cleaning up');
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
  }, [notificationPermission]);

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
