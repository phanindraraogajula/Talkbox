import { useEffect, useMemo, useState } from "react";
import { UserPlus, Search, MessageCircle, X, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { GroupChatPanel } from "./GroupChatPanel";
import { backend } from "../../constants";
import { io } from "socket.io-client";

const API_BASE = `http://${backend.IP}:${backend.PORT}`;

interface Friend {
  id: number;
  username: string;        // backend userId
  displayName: string;     // what we show in UI
  status: "Online" | "Away" | "Offline";
  color: string;
  initials: string;
}

interface AvailableUser {
  id: number;
  username: string;
  displayName: string;
  color: string;
  initials: string;
}

interface Group {
  id: number;
  name: string;
  members: number[];
  color: string;
}

interface FriendsPageProps {
  username: string; // currently logged in userId
}

/* ---------- helpers that accept number OR string safely ---------- */

function usernameToId(username: string | number): number {
  const s = String(username ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const COLOR_CLASSES = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-lime-500",
];

function colorFromUsername(username: string | number): string {
  const s = String(username ?? "");
  const id = usernameToId(s);
  return COLOR_CLASSES[id % COLOR_CLASSES.length];
}

function initialsFromUsername(username: string | number): string {
  const s = String(username ?? "").trim();
  if (!s) return "??";

  if (s.includes(" ")) {
    const parts = s.split(" ").filter(Boolean);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }

  return s.slice(0, 2).toUpperCase();
}

/* ---------------- FriendsPage ---------------- */

export function FriendsPage({ username }: FriendsPageProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<number[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // realtime online users from backend (Socket.IO + /chat/online-users)
  const [onlineUsernames, setOnlineUsernames] = useState<string[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);

  // ---- socket.io: track active users in real time ----
  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket"] });

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("registerUser", username);
    });

    socket.on("activeUsers", (users: string[]) => {
      setOnlineUsernames(users || []);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // REST fallback – in case socket misses something
    const fetchOnline = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/online-users`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.onlineUsers)) {
          setOnlineUsernames(data.onlineUsers);
        }
      } catch {
        // ignore
      }
    };
    fetchOnline();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [username]);

  // ---- fetch friend list from backend ----
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/friend/list?userId=${encodeURIComponent(username)}`
        );

        if (!res.ok) {
          console.warn("friend/list returned status", res.status);
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data.friends)) return;

        const mapped: Friend[] = data.friends.map((raw: any) => {
          const friendUsername = String(raw); // handles string/number
          const id = usernameToId(friendUsername);
          return {
            id,
            username: friendUsername,
            displayName: friendUsername,
            status: "Offline",
            color: colorFromUsername(friendUsername),
            initials: initialsFromUsername(friendUsername),
          };
        });

        setFriends(mapped);
      } catch (err) {
        console.error("Failed to load friends", err);
      }
    };

    fetchFriends();
  }, [username]);

  // update friend statuses whenever online list changes
  useEffect(() => {
    setFriends((prev) =>
      prev.map((f) => ({
        ...f,
        status: onlineUsernames.includes(f.username) ? "Online" : "Offline",
      }))
    );
  }, [onlineUsernames]);

  // ---- available users for Add dialog (online but not already friends, and not you) ----
  const availableUsers: AvailableUser[] = useMemo(() => {
    const friendUsernames = new Set(friends.map((f) => f.username));

    return onlineUsernames
      .filter((u) => u && u !== username)
      .filter((u) => !friendUsernames.has(u))
      .map((u) => {
        const id = usernameToId(u);
        return {
          id,
          username: u,
          displayName: u,
          color: colorFromUsername(u),
          initials: initialsFromUsername(u),
        };
      });
  }, [onlineUsernames, friends, username]);

  const filteredFriends = friends.filter((friend) =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableUsers = availableUsers.filter((user) => {
    const q = addSearchQuery.trim().toLowerCase();
    if (!q) return false; // 👈 important: don't show anything when empty
    return (
      user.displayName.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q)
    );
  });

  const filteredFriendsForGroup = friends.filter((friend) =>
    friend.displayName.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  // ---- add friend via backend ----
  const handleAddFriend = async (user: AvailableUser) => {
    try {
      const res = await fetch(`${API_BASE}/friend/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: username,
          friendId: user.username,
        }),
      });

      if (!res.ok) {
        console.error("Failed to add friend", await res.text());
        return;
      }

      setFriends((prev) => {
        if (prev.some((f) => f.username === user.username)) {
          return prev;
        }
        const newFriend: Friend = {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          status: "Online",
          color: user.color,
          initials: user.initials,
        };
        return [...prev, newFriend];
      });

      setAddSearchQuery("");
      setShowAddDialog(false);
    } catch (err) {
      console.error("Error adding friend", err);
    }
  };

  const toggleGroupMember = (friendId: number) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedGroupMembers.length > 0) {
      const newGroup: Group = {
        id: Date.now(),
        name: groupName,
        members: selectedGroupMembers,
        color: "bg-[#6264A7]",
      };
      setGroups((prev) => [...prev, newGroup]);
      setShowGroupDialog(false);
      setGroupName("");
      setSelectedGroupMembers([]);
      setGroupSearchQuery("");
    }
  };

  return (
    <div className="flex h-full bg-[#F3F2F1]">
      {/* Friends List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-900">Friends</h2>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setShowGroupDialog(true)}
                title="Create Group"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setShowAddDialog(true)}
                title="Add Friend"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-[#F3F2F1]"
            />
          </div>

          {!socketConnected && (
            <p className="mt-2 text-xs text-red-500">
              Not connected to realtime server – showing last known state.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-3 py-2 bg-gray-50">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  Groups
                </span>
              </div>
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedGroup?.id === group.id
                      ? "bg-[#6264A7]/10 border-l-4 border-l-[#6264A7]"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar className={`h-10 w-10 ${group.color}`}>
                      <AvatarFallback
                        className={`${group.color} text-white text-xs`}
                      >
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px] border border-gray-200">
                      {group.members.length}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 truncate">{group.name}</h3>
                    <p className="text-gray-500 text-xs truncate">
                      {group.members.length} member
                      {group.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends Section */}
          {filteredFriends.length > 0 && (
            <>
              {filteredGroups.length > 0 && (
                <div className="px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Direct Messages
                  </span>
                </div>
              )}
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                >
                  <div className="relative">
                    <Avatar className={`h-10 w-10 ${friend.color}`}>
                      <AvatarFallback
                        className={`${friend.color} text-white text-xs`}
                      >
                        {friend.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        friend.status === "Online"
                          ? "bg-green-500"
                          : friend.status === "Away"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 truncate">
                      {friend.displayName}
                    </h3>
                    <p className="text-gray-500 truncate">{friend.status}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {filteredFriends.length === 0 && filteredGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No friends or groups found
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex items-center justify-center bg-[#F3F2F1]">
        {selectedGroup ? (
          <div className="w-full h-full">
            <GroupChatPanel
              groupName={selectedGroup.name}
              memberCount={selectedGroup.members.length}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-gray-900 mb-2">Select a conversation</h2>
            <p className="text-gray-500">
              Choose a friend from the list to start chatting
            </p>
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Friends</DialogTitle>
            <DialogDescription>
              Search for a user and add them to your friends list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or username..."
                value={addSearchQuery}
                onChange={(e) => setAddSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[300px] overflow-auto space-y-2">
              {addSearchQuery.trim() === "" ? (
                <div className="text-center py-8 text-gray-500">
                  Start typing to search for users
                </div>
              ) : filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users match this search
                </div>
              ) : (
                filteredAvailableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <Avatar className={`h-10 w-10 ${user.color}`}>
                      <AvatarFallback className={`${user.color} text-white`}>
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 truncate">
                        {user.displayName}
                      </h3>
                      <p className="text-gray-500 text-xs truncate">
                        @{user.username}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddFriend(user)}
                      className="bg-[#6264A7] hover:bg-[#5558A0]"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group and add friends to it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            {selectedGroupMembers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Members ({selectedGroupMembers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedGroupMembers.map((memberId) => {
                    const member = friends.find((f) => f.id === memberId);
                    return member ? (
                      <Badge
                        key={memberId}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 gap-1"
                      >
                        <span>{member.displayName}</span>
                        <button
                          onClick={() => toggleGroupMember(memberId)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Add Friends</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search friends..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="max-h-[250px] overflow-auto space-y-2">
              {filteredFriendsForGroup.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {groupSearchQuery ? "No friends found" : "No friends available"}
                </div>
              ) : (
                filteredFriendsForGroup.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => toggleGroupMember(friend.id)}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroupMembers.includes(friend.id)
                        ? "border-[#6264A7] bg-[#6264A7]/5"
                        : "border-gray-100"
                    }`}
                  >
                    <Avatar className={`h-10 w-10 ${friend.color}`}>
                      <AvatarFallback className={`${friend.color} text-white`}>
                        {friend.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 truncate">
                        {friend.displayName}
                      </h3>
                      <p className="text-gray-500 text-xs">{friend.status}</p>
                    </div>

                    {selectedGroupMembers.includes(friend.id) && (
                      <div className="w-5 h-5 rounded-full bg-[#6264A7] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowGroupDialog(false);
                  setGroupName("");
                  setSelectedGroupMembers([]);
                  setGroupSearchQuery("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#6264A7] hover:bg-[#5558A0]"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedGroupMembers.length === 0}
              >
                <Users className="h-4 w-4 mr-1" />
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
