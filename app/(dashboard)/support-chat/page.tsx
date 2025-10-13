"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Send, Paperclip, Plus, X, Check, CheckCheck, Users, User, Trash2, Settings, Bell, Volume2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PermissionGuard } from "@/components/auth/permission-guard";

type ChatRoom = {
  id: string;
  room_type: string;
  subject: string;
  group_name?: string;
  status: string;
  priority: string;
  created_by: string;
  assigned_to: string | null;
  lastMessage: any;
  unreadCount: number;
  last_message_at: string;
  otherParticipant?: any;
  participantCount?: number;
};

type Message = {
  id: string;
  message: string;
  sender_id: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  chat_attachments?: any[];
};

type Operator = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
};

export default function SupportChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Current operator
  const [currentOperator, setCurrentOperator] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"all" | "personal" | "group">("all");

  // Dialogs
  const [isCreatePersonalOpen, setIsCreatePersonalOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Notification settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(true);

  // Personal chat
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorForChat, setSelectedOperatorForChat] = useState("");

  // Group chat
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedGroupParticipants, setSelectedGroupParticipants] = useState<string[]>([]);

  // File attachment
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache for operators list (no need to refetch every time)
  const operatorsCache = useRef<{data: Operator[], timestamp: number} | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const opStr = localStorage.getItem("operator");
    if (opStr) {
      const op = JSON.parse(opStr);
      setCurrentOperator(op);
      setIsSuperAdmin(op.role_name === "Super Admin");
    }
    
    // Load notification settings
    const soundSetting = localStorage.getItem('notification_sound');
    const desktopSetting = localStorage.getItem('notification_desktop');
    setSoundEnabled(soundSetting !== 'false');
    setDesktopEnabled(desktopSetting !== 'false');
  }, []);

  useEffect(() => {
    if (currentOperator) {
      fetchRooms();
      // Only fetch operators once on mount or when needed
      if (!operatorsCache.current || Date.now() - operatorsCache.current.timestamp > CACHE_DURATION) {
        fetchOperators();
      } else {
        setOperators(operatorsCache.current.data);
      }
    }
  }, [currentOperator, activeTab]);

  // Real-time subscription for chat messages
  useEffect(() => {
    if (!selectedRoom || !currentOperator) return;

    console.log(`🔗 Subscribing to room: ${selectedRoom.id}`);

    const channel = supabase
      .channel(`room-${selectedRoom.id}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        async (payload) => {
          console.log("💬 New message in room:", payload);
          const newMessage = payload.new as any;
          
          // Check if message already exists (avoid duplicates from optimistic UI)
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('Message already exists, skipping...');
              return prev;
            }
            
            // Also remove any temp message with same timestamp (if optimistic UI was used)
            const filtered = prev.filter(msg => !msg.id.startsWith('temp-'));
            
            // Add message to state for instant display
            return [...filtered, {
              id: newMessage.id,
              message: newMessage.message,
              sender_id: newMessage.sender_id,
              message_type: newMessage.message_type,
              created_at: newMessage.created_at,
              is_read: newMessage.is_read,
              chat_attachments: []
            }];
          });
          
          // Mark as read if not own message
          if (newMessage.sender_id !== currentOperator.id) {
            try {
              // Update last_read_at to mark messages as read
              await supabase
                .from('chat_participants')
                .update({ last_read_at: new Date().toISOString() })
                .eq('room_id', selectedRoom.id)
                .eq('operator_id', currentOperator.id);
              
              console.log('✅ Marked as read');
            } catch (error) {
              console.error("Failed to mark as read:", error);
            }
          }
          
          // Refresh rooms list to update last message
          fetchRooms();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        (payload) => {
          console.log("✏️ Message updated:", payload);
          // Update message in state (e.g., read status changed)
          const updatedMessage = payload.new as any;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id 
              ? { ...msg, is_read: updatedMessage.is_read }
              : msg
          ));
        }
      )
      .subscribe((status) => {
        console.log(`📡 Room subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to room messages!');
        }
      });

    return () => {
      console.log(`🔌 Unsubscribing from room: ${selectedRoom.id}`);
      supabase.removeChannel(channel);
    };
  }, [selectedRoom, currentOperator]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const headers: HeadersInit = {};
      if (currentOperator?.id) {
        headers["X-Operator-Id"] = currentOperator.id;
      }

      // Fetch different endpoints based on active tab
      let endpoint = "/api/chat/rooms";
      if (activeTab === "personal") {
        endpoint = "/api/chat/personal";
      } else if (activeTab === "group") {
        endpoint = "/api/chat/groups";
      }
      // For "all" tab, use default /api/chat/rooms (shows all types)

      // Add timestamp to prevent caching issues
      const url = `${endpoint}?t=${Date.now()}`;
      const res = await fetch(url, { 
        headers,
        // Add cache control for better performance
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      setRooms(json.data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      // Don't clear rooms on error, keep previous data
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    if (!currentOperator?.id) return;
    
    try {
      const headers: HeadersInit = { "X-Operator-Id": currentOperator.id };
      const res = await fetch("/api/operators/list", { headers });
      const json = await res.json();
      
      // Filter out current operator
      const otherOperators = (json.data || []).filter(
        (op: Operator) => op.id !== currentOperator.id
      );
      
      // If not Super Admin, only show Super Admins
      const filteredOperators = !isSuperAdmin
        ? otherOperators.filter((op: Operator) => op.role === "Super Admin")
        : otherOperators;
      
      setOperators(filteredOperators);
      
      // Cache operators list
      operatorsCache.current = {
        data: filteredOperators,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("Error fetching operators:", error);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const headers: HeadersInit = {};
      if (currentOperator?.id) {
        headers["X-Operator-Id"] = currentOperator.id;
      }

      const res = await fetch(`/api/chat/rooms/${roomId}`, { headers });
      const json = await res.json();
      setMessages(json.data?.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    fetchMessages(room.id);
  };

  const handleCreatePersonalChat = async () => {
    if (!selectedOperatorForChat || !currentOperator) return;

    try {
      const res = await fetch("/api/chat/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiator_id: currentOperator.id,
          target_operator_id: selectedOperatorForChat,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setIsCreatePersonalOpen(false);
        setSelectedOperatorForChat("");
        setActiveTab("personal");
        fetchRooms();
        if (json.data?.id) {
          // Find the room and select it
          setTimeout(() => {
            const room = rooms.find(r => r.id === json.data.id);
            if (room) handleSelectRoom(room);
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error creating personal chat:", error);
    }
  };

  const handleCreateGroupChat = async () => {
    if (!groupName || selectedGroupParticipants.length === 0 || !currentOperator) return;

    try {
      const res = await fetch("/api/chat/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_name: groupName,
          description: groupDescription,
          created_by: currentOperator.id,
          participant_ids: selectedGroupParticipants,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setIsCreateGroupOpen(false);
        setGroupName("");
        setGroupDescription("");
        setSelectedGroupParticipants([]);
        setActiveTab("group");
        fetchRooms();
        handleSelectRoom(json.data);
      }
    } catch (error) {
      console.error("Error creating group chat:", error);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!isSuperAdmin || !currentOperator) return;
    
    // Show custom confirmation dialog
    setRoomToDelete(roomId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete || !currentOperator) return;

    try {
      const res = await fetch(`/api/chat/rooms?room_id=${roomToDelete}&operator_id=${currentOperator.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Close dialog
        setIsDeleteConfirmOpen(false);
        setRoomToDelete(null);
        
        // Clear selection and refresh
        setSelectedRoom(null);
        setMessages([]);
        fetchRooms();
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('notification_sound', soundEnabled.toString());
    localStorage.setItem('notification_desktop', desktopEnabled.toString());
    setIsSettingsOpen(false);
    
    // Request notification permission if desktop notifications are enabled
    if (desktopEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedRoom || !currentOperator) return;

    const messageText = newMessage.trim() || "📎 File attached";
    const tempId = `temp-${Date.now()}`; // Temporary ID for optimistic UI
    
    // OPTIMISTIC UI: Show message immediately! (Like WhatsApp)
    const optimisticMessage: Message = {
      id: tempId,
      message: messageText,
      sender_id: currentOperator.id,
      message_type: selectedFile ? "attachment" : "text",
      created_at: new Date().toISOString(),
      is_read: false,
      chat_attachments: [],
    };
    
    // Add to UI instantly!
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input immediately
    const messageToSend = newMessage;
    const fileToUpload = selectedFile;
    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          sender_id: currentOperator.id,
          message: messageToSend.trim() || "📎 File attached",
          message_type: fileToUpload ? "attachment" : "text",
        }),
      });

      if (res.ok) {
        const json = await res.json();
        
        // Replace temp message with real message from database
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...json.data, chat_attachments: [] } : msg
        ));
        
        if (fileToUpload && json.data) {
          const formData = new FormData();
          formData.append("file", fileToUpload);
          formData.append("message_id", json.data.id);
          formData.append("uploaded_by", currentOperator.id);

          const uploadRes = await fetch("/api/chat/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const uploadError = await uploadRes.json();
            console.error("Upload error:", uploadError);
            
            // Show user-friendly error message
            if (uploadError.error === "Storage bucket not configured") {
              alert("⚠️ File upload is not configured yet.\n\nPlease ask administrator to setup Supabase Storage.\n\nSee SETUP-STORAGE.md for instructions.");
            } else {
              alert(`Failed to upload file: ${uploadError.message || uploadError.error}`);
            }
          }
        }

        fetchRooms();
      } else {
        const error = await res.json();
        
        // Remove optimistic message if failed
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        
        alert(error.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "resolved": return "bg-gray-500";
      case "closed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "normal": return "bg-blue-500";
      case "low": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getRoomTypeIcon = (roomType: string) => {
    switch (roomType) {
      case "personal": return <User className="h-4 w-4" />;
      case "group": return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.room_type === "group") {
      return room.group_name || room.subject;
    }
    if (room.room_type === "personal" && room.otherParticipant) {
      return `Chat with ${room.otherParticipant.username}`;
    }
    return room.subject;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <PermissionGuard menuName="Support Chat">
      <div className="fixed top-16 left-64 right-0 bottom-0 p-4 overflow-hidden">
        <div className="h-full flex gap-4">
        {/* Left: Chat Rooms List */}
        <div className="w-1/3 border border-border rounded-lg bg-card p-4 flex flex-col">
          {/* Header with Settings */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Chats</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSettingsOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4 border-b border-border">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === "all"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-1" />
              All Chats
            </button>
            <button
              onClick={() => setActiveTab("personal")}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === "personal"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4 inline mr-1" />
              Personal
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === "group"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              Groups
            </button>
          </div>

          {/* New Chat Buttons */}
          <div className="mb-4 space-y-2">
            {activeTab === "all" && (
              <>
                <Button size="sm" className="w-full" onClick={() => setIsCreatePersonalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Personal Chat
                </Button>
                {isSuperAdmin && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setIsCreateGroupOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Group Chat
                  </Button>
                )}
              </>
            )}
            {activeTab === "personal" && (
              <Button size="sm" className="w-full" onClick={() => setIsCreatePersonalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Personal Chat
              </Button>
            )}
            {activeTab === "group" && isSuperAdmin && (
              <Button size="sm" className="w-full" onClick={() => setIsCreateGroupOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Group Chat
              </Button>
            )}
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {rooms.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No {activeTab} chats yet.
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`p-3 rounded-lg cursor-pointer border transition-all ${
                    selectedRoom?.id === room.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      {getRoomTypeIcon(room.room_type)}
                      <h3 className="font-medium text-sm text-foreground line-clamp-1">
                        {getRoomDisplayName(room)}
                      </h3>
                    </div>
                    {room.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                        {room.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  {room.room_type === "support" && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(room.status)}`} />
                      <span className="text-xs text-muted-foreground capitalize">{room.status}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(room.priority)} text-white`}>
                        {room.priority}
                      </span>
                    </div>
                  )}
                  
                  {room.room_type === "group" && room.participantCount && (
                    <div className="flex items-center gap-1 mb-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {room.participantCount} members
                      </span>
                    </div>
                  )}
                  
                  {room.lastMessage && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {room.lastMessage.message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Chat Messages */}
        <div className="flex-1 border border-border rounded-lg bg-card flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {getRoomTypeIcon(selectedRoom.room_type)}
                    <h2 className="font-semibold text-foreground">
                      {getRoomDisplayName(selectedRoom)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedRoom.room_type === "support" && (
                      <>
                        <Badge variant="outline" className="capitalize text-xs">
                          {selectedRoom.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-xs">
                          {selectedRoom.priority}
                        </Badge>
                      </>
                    )}
                    {selectedRoom.room_type === "group" && selectedRoom.participantCount && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedRoom.participantCount} members
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Delete button (Super Admin only) */}
                {isSuperAdmin && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRoom(selectedRoom.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentOperator?.id;
                  const isSystem = msg.message_type === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"} rounded-lg p-3`}>
                        <div className="text-sm">{msg.message}</div>
                        
                        {msg.chat_attachments && msg.chat_attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.chat_attachments.map((att: any) => (
                              <a
                                key={att.id}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {att.file_name}
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                          {isOwn && (
                            msg.is_read ? (
                              <CheckCheck className="h-3 w-3 text-green-400" />
                            ) : (
                              <Check className="h-3 w-3 opacity-50" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                {selectedFile && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-secondary rounded">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </div>
          )}
        </div>

        {/* Create Personal Chat Dialog */}
        <Dialog open={isCreatePersonalOpen} onOpenChange={setIsCreatePersonalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Personal Chat</DialogTitle>
              <DialogDescription>
                {isSuperAdmin 
                  ? "Select an operator to chat with" 
                  : "Select a Super Admin to chat with"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="operator">Select Operator *</Label>
                <select
                  id="operator"
                  value={selectedOperatorForChat}
                  onChange={(e) => setSelectedOperatorForChat(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Choose an operator --</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.username} ({op.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePersonalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePersonalChat} disabled={!selectedOperatorForChat}>
                Start Chat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Group Chat Dialog (Super Admin only) */}
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Group Chat</DialogTitle>
              <DialogDescription>Create a group chat with multiple participants</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Team Discussion"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="groupDescription">Description</Label>
                <Textarea
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Group purpose..."
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Select Participants * (Select at least one)</Label>
                <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto">
                  {operators.map((op) => (
                    <div key={op.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id={`participant-${op.id}`}
                        checked={selectedGroupParticipants.includes(op.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupParticipants([...selectedGroupParticipants, op.id]);
                          } else {
                            setSelectedGroupParticipants(
                              selectedGroupParticipants.filter((id) => id !== op.id)
                            );
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`participant-${op.id}`} className="text-sm cursor-pointer">
                        {op.username} ({op.role})
                      </label>
                    </div>
                  ))}
                </div>
                {selectedGroupParticipants.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedGroupParticipants.length} participant(s) selected
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroupChat} 
                disabled={!groupName || selectedGroupParticipants.length === 0}
              >
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Chat</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setRoomToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteRoom}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notification Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notification Settings</DialogTitle>
              <DialogDescription>
                Customize your chat notification preferences
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Sound Notification */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Volume2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-semibold text-foreground">Sound Notification</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Play a sound when you receive a new message
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    soundEnabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  role="switch"
                  aria-checked={soundEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Desktop Notification */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-semibold text-foreground">Desktop Notification</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Show Windows notification when you receive a message (only when tab is not focused)
                    </p>
                    {desktopEnabled && 'Notification' in window && Notification.permission !== 'granted' && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                        <span className="text-xs text-orange-700 dark:text-orange-400">
                          ⚠️ Permission required. Click Save to request permission.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDesktopEnabled(!desktopEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    desktopEnabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  role="switch"
                  aria-checked={desktopEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      desktopEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </PermissionGuard>
  );
}
