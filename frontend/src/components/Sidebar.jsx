import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Users, Plus, X, Check } from "lucide-react";
import toast from "react-hot-toast";

import { getUsers } from "../api/messageApi";
import { getUserGroups } from "../api/groupApi";
import socket from "../socket/socket";
import Avatar from "./Avatar";
import CreateGroupModal from "./CreateGroupModal";

import {
  setUsers,
  setSelectedUser,
  setOnlineUsers,
  setGroups,
  setSelectedGroup,
} from "../redux/chatSlice";

const Sidebar = () => {
  const dispatch = useDispatch();

  // Redux State
  const { users, selectedUser, onlineUsers, groups, selectedGroup } = useSelector(
    (state) => state.chat
  );

  // Loading State
  const [loading, setLoading] = useState(true);

  // Group-building select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]); // array of user IDs
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Fetch Sidebar Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const response = await getUsers();

        dispatch(setUsers(response.data.users));
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load users"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [dispatch]);

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await getUserGroups();
        dispatch(setGroups(response.data.groups));
      } catch (error) {
        console.log(error.message);
      }
    };

    fetchGroups();
  }, [dispatch]);

  // Listen for Online Users
  useEffect(() => {
    socket.on("getOnlineUsers", (onlineUsers) => {
      dispatch(setOnlineUsers(onlineUsers));
    });

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [dispatch]);

  // Enter select mode (triggered by the "+" button)
  const startSelectMode = () => {
    setSelectMode(true);
    setSelectedMembers([]);
  };

  // Cancel select mode entirely
  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedMembers([]);
  };

  // Toggle a user in/out of the selection, used only while in select mode
  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handles clicking a user row — behaves differently depending on select mode
  const handleUserClick = (user) => {
    if (selectMode) {
      toggleMember(user._id);
    } else {
      dispatch(setSelectedUser(user));
    }
  };

  // After a group is successfully created, reset selection state
  const handleGroupCreated = () => {
    setShowCreateGroup(false);
    setSelectMode(false);
    setSelectedMembers([]);
  };

  return (
    <aside
      className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col ${
        selectedUser || selectedGroup ? "hidden md:flex" : "flex"
      }`}
    >

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        {selectMode ? (
          <>
            <h2 className="text-lg font-semibold text-gray-800">
              Select Members
            </h2>
            <button
              onClick={cancelSelectMode}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              title="Cancel"
            >
              <X size={20} />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Chats</h2>
            </div>

            <button
              onClick={startSelectMode}
              className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600"
              title="Create Group"
            >
              <Plus size={20} />
            </button>
          </>
        )}
      </div>

      {/* Create Group action bar — appears once at least 1 member is selected */}
      {selectMode && selectedMembers.length > 0 && (
        <button
          onClick={() => setShowCreateGroup(true)}
          className="mx-4 mt-3 mb-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition"
        >
          Create Group ({selectedMembers.length})
        </button>
      )}

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">

        {/* Groups Section — hidden while in select mode to keep focus on picking members */}
        {!selectMode && groups.length > 0 && (
          <>
            <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
              Groups
            </p>
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => dispatch(setSelectedGroup(group))}
                className={`w-full flex items-center gap-4 px-5 py-3 border-b transition-all duration-200 ${
                  selectedGroup?._id === group._id
                    ? "bg-indigo-100"
                    : "hover:bg-gray-100"
                }`}
              >
                <img
                  src={group.groupPic || "https://placehold.co/100x100?text=Group"}
                  alt={group.name}
                  className="w-12 h-12 rounded-full object-cover border"
                />
                <div className="flex flex-col items-start overflow-hidden">
                  <h3 className="font-semibold text-gray-800 truncate">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.members.length} members</p>
                </div>
              </button>
            ))}
          </>
        )}

        {/* Direct Messages Section */}
        <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
          {selectMode ? "Tap to select" : "Direct Messages"}
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No users found.</p>
          </div>
        ) : (
          [...users]
            .sort((a, b) => {
              const aIsBot = a.email === "ai.bot@chatapp.local" || a.name?.includes("ChatApp AI");
              const bIsBot = b.email === "ai.bot@chatapp.local" || b.name?.includes("ChatApp AI");
              if (aIsBot && !bIsBot) return -1;
              if (!aIsBot && bIsBot) return 1;
              return 0;
            })
            .map((user) => {
              const isBot = user.email === "ai.bot@chatapp.local" || user.name?.includes("ChatApp AI");
              const isOnline = isBot || onlineUsers.includes(user._id);
              const isChecked = selectedMembers.includes(user._id);
              const displayName = user.name ? user.name.replace(/🤖/g, "").trim() : "";

              return (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  className={`w-full flex items-center gap-4 px-5 py-4 border-b transition-all duration-200 ${
                    selectMode
                      ? isChecked
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                      : selectedUser?._id === user._id
                      ? "bg-indigo-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar src={user.profilePic} name={displayName} />

                    {!selectMode && isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex flex-col items-start overflow-hidden flex-1">
                    <div className="flex items-center gap-1.5 w-full">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {displayName}
                      </h3>
                      {isBot && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                          AI
                        </span>
                      )}
                    </div>

                    {!selectMode && (
                      <p
                        className={`text-sm ${
                          isBot
                            ? "text-indigo-600 font-medium"
                            : isOnline
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {isBot ? "AI Assistant • Online" : isOnline ? "Online" : "Offline"}
                      </p>
                    )}
                  </div>

                {/* Selection checkbox — only shown in select mode */}
                {selectMode && (
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isChecked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                    }`}
                  >
                    {isChecked && <Check size={12} className="text-white" />}
                  </div>
                )}
              </button>
            );
          })
        )}

      </div>

      {showCreateGroup && (
        <CreateGroupModal
          members={selectedMembers}
          onClose={handleGroupCreated}
        />
      )}
    </aside>
  );
};

export default Sidebar;