import { useEffect, useState } from "react";
import { UserPlus, Search, MessageCircle, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { GroupChatPanel } from "./GroupChatPanel";
import { DirectChatPanel } from "./DirectChatPanel";
import { backend } from "../../constants";
import { io } from "socket.io-client";

const API_BASE = `http://${backend.IP}:${backend.PORT}`;

/* ---------- TYPES ---------- */

interface Friend {
  id: number; // numeric backend user id
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  status: "Online" | "Away" | "Offline";
  color: string;
  initials: string;
}

interface AvailableUser {
  id: number;          // numeric backend user id
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  color: string;
  initials: string;
}

interface GroupMember {
  userId: string;
  firstName?: string;
  lastName?: string;
}

interface GroupPreviewMessage {
  id: number;
  content: string;
  senderUserId: string;
  createdAt: string;
}

interface Group {
  id: number;
  name: string;
  members: GroupMember[];
  messages?: GroupPreviewMessage[];
  createdAt?: string;
  color: string;
}

interface FriendsPageProps {
  username: string;
}

/* ---------- HELPERS ---------- */

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
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return COLOR_CLASSES[hash % COLOR_CLASSES.length];
}

function initialsFromUsername(name: string): string {
  const s = name.trim();
  if (!s) return "??";
  const parts = s.split(" ");
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

/* ============================================================
   FRIENDS PAGE
============================================================ */

export function FriendsPage({ username }: FriendsPageProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [searchClicked, setSearchClicked] = useState(false);
  const [searchResults, setSearchResults] = useState<AvailableUser[]>([]);

  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMemberUsernames, setSelectedGroupMemberUsernames] =
    useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const [onlineUsernames, setOnlineUsernames] = useState<string[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const [rootUser, setRootUser] = useState("");
  const [selfNumericId, setSelfNumericId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("talkbox_root_user");
    if (storedUser) setRootUser(storedUser);
  }, []);

  const effectiveUserId = rootUser || username; // username string

  /* ========== SOCKET CONNECTION (ONLINE USERS) ========== */

  useEffect(() => {
    if (!effectiveUserId) return;

    const socket = io(API_BASE, { transports: ["websocket"] });

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("registerUser", effectiveUserId);
    });

    socket.on("activeUsers", (users: string[]) => {
      setOnlineUsernames(users || []);
    });

    socket.on("disconnect", () => setSocketConnected(false));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [effectiveUserId]);

  /* ========== FETCH SELF NUMERIC ID ========== */

  useEffect(() => {
    const fetchSelf = async () => {
      if (!effectiveUserId) return;
      try {
        const res = await fetch(
          `${API_BASE}/friend/search?query=${encodeURIComponent(
            effectiveUserId
          )}`
        );
        if (!res.ok) {
          console.error("Failed to fetch self user", res.status);
          return;
        }
        const data = await res.json();
        if (!data.exists || !data.user) {
          console.warn("Self user not found in friend/search", data);
          return;
        }
        setSelfNumericId(data.user.id);
        console.log(
          "[FriendsPage] Self numeric id:",
          data.user.id,
          "for username",
          effectiveUserId
        );
      } catch (err) {
        console.error("Error fetching self numeric id", err);
      }
    };

    fetchSelf();
  }, [effectiveUserId]);

  /* ========== FETCH FRIEND LIST ========== */

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const selfUserId = effectiveUserId;
        if (!selfUserId) return;

        const res = await fetch(
          `${API_BASE}/friend/list?userId=${encodeURIComponent(selfUserId)}`
        );
        const data = await res.json();

        if (!Array.isArray(data.friends)) {
          console.warn("friend/list returned unexpected payload", data);
          return;
        }

        const usernames: string[] = data.friends;

        const friendPromises = usernames.map(async (u: string) => {
          try {
            const detailRes = await fetch(
              `${API_BASE}/friend/search?query=${encodeURIComponent(u)}`
            );
            if (!detailRes.ok) {
              console.error("friend/search failed for", u, detailRes.status);
              return null;
            }
            const detailData = await detailRes.json();
            if (!detailData.exists || !detailData.user) return null;

            const user = detailData.user;

            const fullName = `${user.firstName ?? ""} ${
              user.lastName ?? ""
            }`.trim();
            const displayName = fullName || user.userId;

            const friend: Friend = {
              id: user.id, // numeric backend id
              username: user.userId,
              displayName,
              firstName: user.firstName ?? "",
              lastName: user.lastName ?? "",
              status: "Offline",
              color: colorFromUsername(user.userId),
              initials: initialsFromUsername(displayName),
            };

            return friend;
          } catch (err) {
            console.error("Error fetching friend detail for", u, err);
            return null;
          }
        });

        const fullFriends = (await Promise.all(friendPromises)).filter(
          (f): f is Friend => f !== null
        );

        setFriends(fullFriends);
      } catch (err) {
        console.error("Failed to load friends", err);
      }
    };

    if (effectiveUserId) {
      fetchFriends();
    }
  }, [effectiveUserId]);

  /* ========== FETCH GROUPS VIA /group/fetch ========== */

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const selfUserId = effectiveUserId;
        if (!selfUserId) return;

        const res = await fetch(
          `${API_BASE}/group/fetch?userId=${encodeURIComponent(selfUserId)}`
        );

        if (!res.ok) {
          console.error("Failed to fetch groups", res.status);
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          console.warn("group/fetch unexpected payload", data);
          return;
        }

        const mapped: Group[] = data.map((g: any) => {
          const members: GroupMember[] = Array.isArray(g.members)
            ? g.members.map((m: any) => ({
                userId: m.userId,
                firstName: m.firstName,
                lastName: m.lastName,
              }))
            : [];

          const messages: GroupPreviewMessage[] | undefined =
            Array.isArray(g.messages)
              ? g.messages.map((msg: any) => ({
                  id: msg.id,
                  content: msg.content,
                  senderUserId: msg.sender?.userId ?? "",
                  createdAt: msg.createdAt,
                }))
              : undefined;

          return {
            id: g.id,
            name: g.name,
            members,
            messages,
            createdAt: g.createdAt,
            color: "bg-[#6264A7]",
          };
        });

        setGroups(mapped);
      } catch (err) {
        console.error("Error loading groups", err);
      }
    };

    if (effectiveUserId) {
      fetchGroups();
    }
  }, [effectiveUserId]);

  /* ========== UPDATE FRIEND STATUS WITH ONLINE LIST ========== */

  useEffect(() => {
    setFriends((prev) =>
      prev.map((f) => ({
        ...f,
        status: onlineUsernames.includes(f.username) ? "Online" : "Offline",
      }))
    );
  }, [onlineUsernames]);

  /* ========== FRIEND SEARCH ========== */

  const handleSearch = async () => {
    setSearchClicked(true);

    const q = addSearchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/friend/search?query=${encodeURIComponent(q)}`
      );

      if (!res.ok) {
        console.error("Search error:", res.status);
        setSearchResults([]);
        return;
      }

      const data = await res.json();

      if (!data.exists || !data.user) {
        setSearchResults([]);
        return;
      }

      const u = data.user;
      const foundUsername = u.userId;

      if (foundUsername === username || foundUsername === effectiveUserId) {
        setSearchResults([]);
        return;
      }

      if (friends.some((f) => f.username === foundUsername)) {
        setSearchResults([]);
        return;
      }

      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      const displayName = fullName || foundUsername;

      const resultUser: AvailableUser = {
        id: u.id, // numeric backend id
        username: foundUsername,
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        displayName,
        color: colorFromUsername(foundUsername),
        initials: initialsFromUsername(displayName),
      };

      setSearchResults([resultUser]);
    } catch (err) {
      console.error("Error searching user:", err);
      setSearchResults([]);
    }
  };

  /* ========== ADD FRIEND ========== */

  const handleAddFriend = async (user: AvailableUser) => {
    try {
      await fetch(`${API_BASE}/friend/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,   // username for friend/add
          friendId: user.username,   // username of friend
        }),
      });

      setFriends((prev) => [
        ...prev,
        {
          id: user.id, // numeric backend id
          username: user.username,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          status: "Online",
          color: user.color,
          initials: user.initials,
        },
      ]);

      setAddSearchQuery("");
      setSearchResults([]);
      setSearchClicked(false);
      setShowAddDialog(false);
    } catch (err) {
      console.error("Error adding friend:", err);
    }
  };

  /* ========== GROUPS: SELECT MEMBERS FOR NEW GROUP ========== */

  const toggleGroupMember = (friendUsername: string) => {
    setSelectedGroupMemberUsernames((prev) =>
      prev.includes(friendUsername)
        ? prev.filter((u) => u !== friendUsername)
        : [...prev, friendUsername]
    );
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();

    if (!name) {
      alert("Please enter a group name.");
      return;
    }
    if (selectedGroupMemberUsernames.length === 0) {
      alert("Please select at least one friend for the group.");
      return;
    }

    try {
      const allUserIds = Array.from(
        new Set([effectiveUserId, ...selectedGroupMemberUsernames])
      );

      const res = await fetch(`${API_BASE}/group/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          memberUserIds: allUserIds,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to create group", res.status, errorText);
        alert(
          `Create group failed (${res.status}). Check console/Network tab for details.`
        );
        return;
      }

      const created = await res.json();

      let memberUserIds: string[];
      if (Array.isArray(created.members)) {
        if (typeof created.members[0] === "string") {
          memberUserIds = created.members;
        } else {
          memberUserIds = created.members.map((m: any) => m.userId);
        }
      } else {
        memberUserIds = allUserIds;
      }

      const newGroup: Group = {
        id: created.id,
        name: created.name,
        members: memberUserIds.map((u) => ({ userId: u })),
        color: "bg-[#6264A7]",
      };

      setGroups((prev) => [...prev, newGroup]);

      setGroupName("");
      setSelectedGroupMemberUsernames([]);
      setShowGroupDialog(false);

      setSelectedFriend(null);
      setSelectedGroup(newGroup);
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Unexpected error while creating group. See console for details.");
    }
  };

  /* ============================================================
      UI
  ============================================================ */

  return (
    <div className="flex h-full bg-[#F3F2F1]">
      {/* SIDEBAR */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-900">Friends & Groups</h2>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowGroupDialog(true)}
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowAddDialog(true)}
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-[#F3F2F1]"
            />
          </div>
        </div>

        {/* Friends + Groups list */}
        <div className="flex-1 overflow-auto">
          {/* Friends */}
          {friends
            .filter((f) =>
              f.displayName.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => {
                  setSelectedFriend(friend);
                  setSelectedGroup(null);
                }}
              >
                <Avatar className={`h-10 w-10 ${friend.color}`}>
                  <AvatarFallback className={`${friend.color} text-white`}>
                    {friend.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3>{friend.displayName}</h3>
                  <p className="text-gray-500 text-xs">{friend.status}</p>
                </div>
              </div>
            ))}

          {/* Groups section */}
          {groups.length > 0 && (
            <div className="mt-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Groups
              </div>
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedFriend(null);
                  }}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs ${group.color}`}
                  >
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">{group.name}</div>
                    <div className="text-xs text-gray-500">
                      {group.members.length} members
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex items-center justify-center bg-[#F3F2F1]">
        {!selectedFriend && !selectedGroup ? (
          <div className="text-center">
            <MessageCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h2>Select a conversation</h2>
            <p className="text-gray-500">
              Choose a friend or a group to start chatting
            </p>
          </div>
        ) : selectedFriend ? (
          selfNumericId == null ? (
            <div className="text-sm text-gray-500">
              Loading your profile for chat…
            </div>
          ) : (
            <DirectChatPanel
              currentUserId={effectiveUserId}          // username for display
              currentUserNumericId={selfNumericId}     // numeric id for backend
              friendUserId={selectedFriend.username}   // friend's username
              friendNumericId={selectedFriend.id}      // friend's numeric id
              friendDisplayName={selectedFriend.displayName}
            />
          )
        ) : selectedGroup ? (
          <GroupChatPanel
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
            members={selectedGroup.members}
            currentUserId={effectiveUserId}
          />
        ) : null}
      </div>

      {/* ADD FRIEND DIALOG */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Friends</DialogTitle>
            <DialogDescription>
              Search users by username to add as a friend
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search user by username..."
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Button
                onClick={handleSearch}
                className="bg-[#6264A7] hover:bg-[#5558A0]"
              >
                Search
              </Button>
            </div>

            <div className="max-h-[300px] overflow-auto space-y-2">
              {!searchClicked ? (
                <div className="text-center py-6 text-gray-500">
                  Type a username and click Search
                </div>
              ) : addSearchQuery.trim() === "" ? (
                <div className="text-center py-6 text-gray-500">
                  Enter something to search
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No users found
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <Avatar className={`h-10 w-10 ${user.color}`}>
                      <AvatarFallback className={`${user.color} text-white`}>
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3>{user.displayName}</h3>
                      <p className="text-gray-500 text-sm">@{user.username}</p>
                    </div>

                    <Button
                      size="sm"
                      className="bg-[#6264A7] hover:bg-[#5558A0]"
                      onClick={() => handleAddFriend(user)}
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD GROUP DIALOG */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="sm-max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Name your group and select friends to add.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                placeholder="Group name (e.g., Project Team)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="max-h-[260px] overflow-auto space-y-2 border rounded-md p-2">
              {friends.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  You have no friends added yet.
                </div>
              ) : (
                friends.map((friend) => {
                  const isSelected = selectedGroupMemberUsernames.includes(
                    friend.username
                  );
                  return (
                    <div
                      key={friend.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${
                        isSelected
                          ? "border-[#6264A7] bg-[#F3F2FF]"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                      onClick={() => toggleGroupMember(friend.username)}
                    >
                      <Avatar className={`h-8 w-8 ${friend.color}`}>
                        <AvatarFallback className={`${friend.color} text-white`}>
                          {friend.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          {friend.displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {friend.status}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-medium text-[#6264A7]">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCreateGroup}
                className="bg-[#6264A7] hover:bg-[#5558A0]"
              >
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
