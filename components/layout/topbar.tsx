"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Bell, MessageSquare, X, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  message: string;
  created_at: string;
  sender_username: string;
  room_id: string;
  room_name: string;
  room_type: string;
};

export function Topbar() {
  const router = useRouter();
  const [operatorName, setOperatorName] = useState("Admin");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [operatorId, setOperatorId] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get operator from localStorage
    const operatorStr = localStorage.getItem("operator");
    if (operatorStr) {
      const operator = JSON.parse(operatorStr);
      setOperatorName(operator.full_name || operator.username);
      setOperatorId(operator.id);
    }
    
    // Fetch unread chat count and notifications
    const fetchData = async () => {
      try {
        const opStr = localStorage.getItem("operator");
        if (!opStr) return;
        
        const operator = JSON.parse(opStr);
        const headers: HeadersInit = { "X-Operator-Id": operator.id };
        
        // Fetch unread count
        const countRes = await fetch("/api/chat/unread-count", { headers });
        const countJson = await countRes.json();
        setUnreadChatCount(countJson.unreadCount || 0);
        
        // Fetch notifications
        const notifRes = await fetch("/api/chat/notifications", { headers });
        const notifJson = await notifRes.json();
        setNotifications(notifJson.data || []);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };
    
    fetchData();
    
    // Optimized: Refresh every 60 seconds (reduced from 30s)
    // This halves the number of API calls while still providing timely updates
    const interval = setInterval(fetchData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark this notification as read
      await fetch("/api/chat/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_ids: [notification.id],
          operator_id: operatorId,
        }),
      });

      // Navigate to chat page
      router.push("/support-chat");
      setShowNotifications(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications.length === 0) return;

    try {
      const messageIds = notifications.map((n) => n.id);
      await fetch("/api/chat/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_ids: messageIds,
          operator_id: operatorId,
        }),
      });

      setNotifications([]);
      setUnreadChatCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click
    
    if (!operatorId) return;

    try {
      const res = await fetch("/api/chat/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_ids: [notificationId], operator_id: operatorId }),
      });

      if (res.ok) {
        // Remove notification from list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadChatCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Logo/Title */}
        <div className="flex items-center gap-2">
          {/* Logo Icon - Small & Professional */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Account Management
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-md p-2 hover:bg-secondary transition-colors"
              title="Chat Notifications"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50">
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full p-3 hover:bg-secondary transition-colors text-left"
                        >
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-medium text-sm text-foreground truncate">
                                  {notification.sender_username}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatTime(notification.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1 truncate">
                                {notification.room_name}
                              </p>
                              <p className="text-sm text-foreground line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="sticky bottom-0 bg-card border-t border-border p-2">
                    <button
                      onClick={() => {
                        router.push("/support-chat");
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-primary hover:underline py-1"
                    >
                      View all in Chat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{operatorName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

