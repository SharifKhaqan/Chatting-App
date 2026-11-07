import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Phone, Video, Users, ArrowLeft } from "lucide-react";
import { useWebRTC } from "../hooks/useWebRTC";
import CallModal from "./CallModal";
import Avatar from "./Avatar";
import GroupMembersModal from "./GroupMembersModal";
import { clearSelectedChat } from "../redux/chatSlice";

const ChatHeader = () => {
  const dispatch = useDispatch();
  const { selectedUser, selectedGroup, onlineUsers, typingUserId, isAiThinking } = useSelector(
    (state) => state.chat
  );
  const { user } = useSelector((state) => state.auth);

  const [showMembers, setShowMembers] = useState(false);

  const {
    callStatus,
    incomingCall,
    callType,
    failReason,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    registerListeners,
    removeListeners,
  } = useWebRTC(user?._id, user?.name);

  useEffect(() => {
    registerListeners();
    return () => removeListeners();
  }, [registerListeners]);

  // Nothing selected at all
  if (!selectedUser && !selectedGroup) {
    return (
      <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-center">
        <p className="text-gray-500 text-lg font-medium">
          Select a user to start chatting
        </p>
      </div>
    );
  }

  // ---- Group Chat Header ----
  if (selectedGroup) {
    return (
      <div className="h-20 shrink-0 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Back button — only shown on mobile, returns to the sidebar list */}
          <button
            onClick={() => dispatch(clearSelectedChat())}
            className="md:hidden p-2 -ml-1 rounded-full hover:bg-gray-100 text-gray-600 shrink-0"
          >
            <ArrowLeft size={22} />
          </button>

          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:opacity-80 transition min-w-0"
          >
            {selectedGroup.groupPic ? (
              <img
                src={selectedGroup.groupPic}
                alt={selectedGroup.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-600 flex items-center justify-center border shrink-0">
                <Users size={18} className="text-white" />
              </div>
            )}

            <div className="text-left min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                {selectedGroup.name}
              </h2>
              {isAiThinking ? (
                <p className="text-xs sm:text-sm text-indigo-600 font-medium animate-pulse truncate">
                  ChatApp AI is thinking...
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {selectedGroup.members.length} members
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Call buttons intentionally omitted — group calls need different technology (see earlier discussion) */}

        {showMembers && (
          <GroupMembersModal group={selectedGroup} onClose={() => setShowMembers(false)} />
        )}
      </div>
    );
  }

  // ---- 1-on-1 Chat Header ----
  const isBot = selectedUser?.email === "ai.bot@chatapp.local" || selectedUser?.name?.includes("ChatApp AI");
  const isOnline = isBot || onlineUsers.includes(selectedUser._id);
  const displayName = selectedUser?.name ? selectedUser.name.replace(/🤖/g, "").trim() : "";

  return (
    <>
      <div className="h-20 shrink-0 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Back button — only shown on mobile, returns to the sidebar list */}
          <button
            onClick={() => dispatch(clearSelectedChat())}
            className="md:hidden p-2 -ml-1 rounded-full hover:bg-gray-100 text-gray-600 shrink-0"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="shrink-0">
            <Avatar src={selectedUser.profilePic} name={displayName} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                {displayName}
              </h2>
              {isBot && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  AI
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {isBot ? (
                isAiThinking ? (
                  <span className="text-indigo-600 font-medium animate-pulse">thinking...</span>
                ) : (
                  <span className="text-indigo-600 font-medium">AI Assistant • Online</span>
                )
              ) : isAiThinking ? (
                <span className="text-indigo-600 font-medium animate-pulse">ChatApp AI is typing...</span>
              ) : typingUserId === selectedUser._id ? (
                <span className="text-indigo-600 font-medium">typing...</span>
              ) : (
                selectedUser.about
              )}
            </p>
          </div>
        </div>

        {!isBot && (
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              onClick={() => startCall(selectedUser._id, "audio")}
              className="p-2 sm:p-3 rounded-full hover:bg-indigo-100 transition duration-200"
              title="Audio Call"
            >
              <Phone size={20} className="text-indigo-600" />
            </button>

            <button
              onClick={() => startCall(selectedUser._id, "video")}
              className="p-2 sm:p-3 rounded-full hover:bg-indigo-100 transition duration-200"
              title="Video Call"
            >
              <Video size={20} className="text-indigo-600" />
            </button>
          </div>
        )}
      </div>

      <CallModal
        callStatus={callStatus}
        incomingCall={incomingCall}
        callType={callType}
        failReason={failReason}
        callDuration={callDuration}
        isReceiverOnline={isOnline}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
        endCall={endCall}
      />
    </>
  );
};

export default ChatHeader;