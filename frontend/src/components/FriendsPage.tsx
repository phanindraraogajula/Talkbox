import { useState } from "react";
import { UserPlus, Search, MessageCircle, X, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { GroupChatPanel } from "./GroupChatPanel";

const initialFriends = [
  { id: 1, name: "Sarah Johnson", status: "Online", color: "bg-blue-500", initials: "SJ" },
  { id: 2, name: "Michael Chen", status: "Away", color: "bg-green-500", initials: "MC" },
  { id: 3, name: "Emily Rodriguez", status: "Online", color: "bg-orange-500", initials: "ER" },
  { id: 4, name: "David Kim", status: "Offline", color: "bg-purple-500", initials: "DK" },
  { id: 5, name: "Lisa Anderson", status: "Online", color: "bg-pink-500", initials: "LA" },
  { id: 6, name: "James Wilson", status: "Away", color: "bg-indigo-500", initials: "JW" },
];

const availableUsers = [
  { id: 7, name: "Robert Taylor", color: "bg-teal-500", initials: "RT" },
  { id: 8, name: "Jennifer Lee", color: "bg-cyan-500", initials: "JL" },
  { id: 9, name: "Thomas Brown", color: "bg-amber-500", initials: "TB" },
  { id: 10, name: "Amanda White", color: "bg-rose-500", initials: "AW" },
  { id: 11, name: "Christopher Davis", color: "bg-violet-500", initials: "CD" },
  { id: 12, name: "Michelle Martin", color: "bg-lime-500", initials: "MM" },
];

interface Group {
  id: number;
  name: string;
  members: number[];
  color: string;
}

export function FriendsPage() {
  const [friends, setFriends] = useState(initialFriends);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<number[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(addSearchQuery.toLowerCase()) &&
    !friends.some(friend => friend.id === user.id)
  );

  const filteredFriendsForGroup = friends.filter(friend =>
    friend.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  const handleAddFriend = (user: typeof availableUsers[0]) => {
    setFriends([...friends, { ...user, status: "Online" }]);
    setAddSearchQuery("");
  };

  const toggleGroupMember = (friendId: number) => {
    setSelectedGroupMembers(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedGroupMembers.length > 0) {
      const newGroup: Group = {
        id: Date.now(),
        name: groupName,
        members: selectedGroupMembers,
        color: "bg-[#6264A7]"
      };
      setGroups([...groups, newGroup]);
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
        </div>

        <div className="flex-1 overflow-auto">
          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-3 py-2 bg-gray-50">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Groups</span>
              </div>
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedGroup?.id === group.id ? 'bg-[#6264A7]/10 border-l-4 border-l-[#6264A7]' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className={`h-10 w-10 ${group.color}`}>
                      <AvatarFallback className={`${group.color} text-white text-xs`}>
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
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
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
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Direct Messages</span>
                </div>
              )}
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                >
                  <div className="relative">
                    <Avatar className={`h-10 w-10 ${friend.color}`}>
                      <AvatarFallback className={`${friend.color} text-white text-xs`}>
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
                    <h3 className="text-gray-900 truncate">{friend.name}</h3>
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
            <p className="text-gray-500">Choose a friend from the list to start chatting</p>
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Friends</DialogTitle>
            <DialogDescription>
              Search for users and add them to your friends list
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={addSearchQuery}
                onChange={(e) => setAddSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[300px] overflow-auto space-y-2">
              {filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {addSearchQuery ? "No users found" : "Start typing to search for users"}
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
                      <h3 className="text-gray-900 truncate">{user.name}</h3>
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
                  {selectedGroupMembers.map(memberId => {
                    const member = friends.find(f => f.id === memberId);
                    return member ? (
                      <Badge
                        key={memberId}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 gap-1"
                      >
                        <span>{member.name}</span>
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
                        ? 'border-[#6264A7] bg-[#6264A7]/5'
                        : 'border-gray-100'
                    }`}
                  >
                    <Avatar className={`h-10 w-10 ${friend.color}`}>
                      <AvatarFallback className={`${friend.color} text-white`}>
                        {friend.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 truncate">{friend.name}</h3>
                      <p className="text-gray-500 text-xs">{friend.status}</p>
                    </div>

                    {selectedGroupMembers.includes(friend.id) && (
                      <div className="w-5 h-5 rounded-full bg-[#6264A7] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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