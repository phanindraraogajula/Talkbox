// src/components/GroupChatPanel.tsx
import { useState, useEffect, useRef } from "react";
import {
  Users,
  Pin,
  Bell,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Bold,
  Italic,
  Underline,
  Link,
  List,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { backend } from "../../constants";
import { io, type Socket } from "socket.io-client";

const API_BASE = `http://${backend.IP}:${backend.PORT}`;

/* ---------- types from API contract ---------- */

interface Message {
  id: string;
  author: string;
  time: string;
  message: string;
  avatarColor: string;
  initials: string;
}

interface SocketGroupMessage {
  id: number | string;
  content: string;
  senderUsername: string; // from API contract
  timestamp: string;
  groupId?: number;
}

interface GroupMember {
  userId: string;
  firstName?: string;
  lastName?: string;
}

interface GroupChatPanelProps {
  groupId: number;          // backend group.id
  groupName: string;
  members: GroupMember[];   // comes from /group/fetch in FriendsPage
  currentUserId: string;    // userId, e.g. "1234"
}

/* ---------- helpers ---------- */

function getAvatarProps(username: string) {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  const safeName = username || "User";
  const initials = safeName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const charCodeSum = safeName
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];

  return { initials, color };
}

function mapSocketMessage(msg: SocketGroupMessage): Message {
  const { initials, color } = getAvatarProps(msg.senderUsername);

  return {
    id: String(msg.id),
    author: msg.senderUsername,
    time: new Date(msg.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    message: msg.content,
    avatarColor: color,
    initials,
  };
}

/* ---------- single Socket.IO client for group chat ---------- */

const socket: Socket = io(API_BASE, {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("🔌 Group socket connected:", socket.id);
});
socket.on("disconnect", () => {
  console.log("❌ Group socket disconnected");
});
socket.on("connect_error", (err) => {
  console.error("⚠️ Group socket connect_error:", err.message || err);
});

/* ============================================================
   GROUP CHAT PANEL
============================================================ */

export function GroupChatPanel({
  groupId,
  groupName,
  members,
  currentUserId,
}: GroupChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  // member info
  const memberUserIds = members.map((m) => m.userId);
  const memberCount = members.length;

  // only count online users who are in this group
  const groupOnlineUsers = onlineUsers.filter((u) =>
    memberUserIds.includes(u)
  );
  const activeUsersCount = groupOnlineUsers.length;

  const typingUserAvatars = typingUsers.slice(0, 3).map((name) => {
    const { initials, color } = getAvatarProps(name);
    return { initials, color };
  });
  const typingCount = typingUsers.length;

  /* 1️⃣ Join group + SOCKET listeners only (no REST) */

  useEffect(() => {
    let isMounted = true;

    if (!groupId) return;

    // join this group room
    const join = () => {
      console.log("🧵 joinGroup:", groupId);
      socket.emit("joinGroup", groupId); // per API contract
    };

    socket.on("connect", join);
    if (socket.connected) {
      join();
    }

    const handleGroupMessages = (msgs: SocketGroupMessage[]) => {
      if (!isMounted) return;
      console.log("📚 groupMessages:", msgs);
      setMessages(msgs.map(mapSocketMessage));
    };

    const handleReceiveGroupMessage = (msg: SocketGroupMessage) => {
      if (!isMounted) return;
      if (msg.groupId && msg.groupId !== groupId) return; // ignore other groups, if server sends it
      console.log("📩 receiveGroupMessage:", msg);
      setMessages((prev) => [...prev, mapSocketMessage(msg)]);
    };

    // from registerUser / global presence
    const handleActiveUsers = (users: string[]) => {
      if (!isMounted) return;
      console.log("👥 activeUsers (group view):", users);
      setOnlineUsers(users || []);
    };

    // API example: socket.on("groupTypingUsers", (typingUsers) => { ... })
    const handleGroupTypingUsers = (typingUsers: string[]) => {
      if (!isMounted) return;
      console.log("⌨️ groupTypingUsers:", typingUsers);
      const filtered = (typingUsers || []).filter((u) => u !== currentUserId);
      setTypingUsers(filtered);
    };

    socket.on("groupMessages", handleGroupMessages);
    socket.on("receiveGroupMessage", handleReceiveGroupMessage);
    socket.on("activeUsers", handleActiveUsers);
    socket.on("groupTypingUsers", handleGroupTypingUsers);

    return () => {
      isMounted = false;
      socket.off("connect", join);
      socket.off("groupMessages", handleGroupMessages);
      socket.off("receiveGroupMessage", handleReceiveGroupMessage);
      socket.off("activeUsers", handleActiveUsers);
      socket.off("groupTypingUsers", handleGroupTypingUsers);
    };
  }, [groupId, currentUserId]);

  /* 2️⃣ Register user as online (same event as global chat) */

  useEffect(() => {
    if (!currentUserId) return;

    const register = () => {
      console.log("📝 registerUser (group socket):", currentUserId);
      socket.emit("registerUser", currentUserId); // per contract
    };

    socket.on("connect", register);
    if (socket.connected) {
      register();
    }

    return () => {
      socket.off("connect", register);
    };
  }, [currentUserId]);

  /* 3️⃣ Send group message */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    console.log("📤 sendGroupMessage:", { groupId, content: trimmed });
    socket.emit("sendGroupMessage", { groupId, content: trimmed }); // per contract

    setMessage("");
    if (isTyping) {
      socket.emit("groupTyping", { groupId, isTyping: false });
      setIsTyping(false);
    }
  };

  /* 4️⃣ Typing indicator */

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!isTyping && value.trim().length > 0) {
      setIsTyping(true);
      console.log("🟢 groupTyping TRUE emit");
      socket.emit("groupTyping", { groupId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      if (isTyping) {
        console.log("🔴 groupTyping FALSE emit (timeout)");
        setIsTyping(false);
        socket.emit("groupTyping", { groupId, isTyping: false });
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600" />
          <span>{groupName}</span>
          <span className="text-xs text-gray-500">
            ({memberCount} members)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pin className="h-4 w-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Users className="h-4 w-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex gap-3 hover:bg-gray-50 -mx-4 px-4 py-2 rounded"
              >
                <Avatar
                  className={`h-8 w-8 ${msg.avatarColor} flex-shrink-0`}
                >
                  <AvatarFallback
                    className={`${msg.avatarColor} text-white text-xs`}
                  >
                    {msg.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-900">{msg.author}</span>
                    <span className="text-gray-500 text-xs">{msg.time}</span>
                  </div>
                  <p className="text-gray-700 mt-0.5">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        {/* typing + active users */}
        <div className="mb-2 flex items-center justify-between">
          {typingUserAvatars.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {typingUserAvatars.map((user, index) => (
                  <div
                    key={index}
                    className={`${user.color} w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] border-2 border-white shadow-sm`}
                  >
                    {user.initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="flex gap-0.5">
                  <span
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
                {typingCount === 1 ? (
                  <span>1 person is typing…</span>
                ) : (
                  <span>{typingCount} people are typing…</span>
                )}
              </div>
            </div>
          )}

          <span className="text-xs text-gray-500 ml-auto">
            {activeUsersCount} of {memberCount}{" "}
            {memberCount === 1 ? "member" : "members"} active
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="border border-gray-300 rounded-lg focus-within:border-[#6264A7] focus-within:ring-1 focus-within:ring-[#6264A7]">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <List className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            {/* Textarea */}
            <Textarea
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="min-h-[80px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-t-none"
            />

            {/* Send button */}
            <div className="flex justify-end p-2">
              <Button
                type="submit"
                size="sm"
                className="bg-[#6264A7] hover:bg-[#5558A0]"
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
