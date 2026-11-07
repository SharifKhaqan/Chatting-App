import {
  setMessages,
  addMessage,
  updateMessageStatus,
  markConversationSeen,
  updateMultipleMessageStatus,
  setTypingUser,
  clearTypingUser,
  setGroupMessages,
  addGroupMessage,
  updateGroupMessagesSeenBy,
  setAiThinking,
} from "../redux/chatSlice";
import socket from "../socket/socket";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { getMessages, markAsSeen } from "../api/messageApi";
import { getGroupMessages, markGroupMessagesSeen } from "../api/groupApi";
import MessageBubble from "./MessageBubble";

const MessageContainer = () => {
  const dispatch = useDispatch();

  const { selectedUser, selectedGroup, messages, groupMessages, isAiThinking } = useSelector(
    (state) => state.chat
  );

  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  const isGroup = !!selectedGroup;
  const activeMessages = isGroup ? groupMessages : messages;

  // How many OTHER people (besides the sender) need to receive/see a group message
  // for it to count as fully delivered/seen — used by MessageBubble to compute ticks
  const totalOtherMembers = isGroup ? selectedGroup.members.length - 1 : 0;

  // Fetch conversation messages (1-on-1)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        setLoading(true);
        const response = await getMessages(selectedUser._id);
        dispatch(setMessages(response.data.messages));
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load messages"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, dispatch]);

  // Fetch group messages
  useEffect(() => {
    const fetchGroupMessages = async () => {
      if (!selectedGroup) return;

      try {
        setLoading(true);
        const response = await getGroupMessages(selectedGroup._id);
        dispatch(setGroupMessages(response.data.messages));
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load group messages"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroupMessages();
  }, [selectedGroup, dispatch]);

  // Mark messages as seen when a 1-on-1 conversation is opened
  useEffect(() => {
    const markSeen = async () => {
      if (!selectedUser) return;

      try {
        await markAsSeen(selectedUser._id);
      } catch (error) {
        console.log(error.message);
      }
    };

    markSeen();
  }, [selectedUser]);

  // Mark group messages as seen when a group conversation is opened
  useEffect(() => {
    const markGroupSeen = async () => {
      if (!selectedGroup) return;

      try {
        await markGroupMessagesSeen(selectedGroup._id);
      } catch (error) {
        console.log(error.message);
      }
    };

    markGroupSeen();
  }, [selectedGroup]);

  // Listen for new incoming 1-on-1 messages
  useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      if (
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id)
      ) {
        dispatch(addMessage(newMessage));
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [dispatch, selectedUser]);

  // Listen for new incoming group messages
  useEffect(() => {
    socket.on("newGroupMessage", (newMessage) => {
      if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        dispatch(addGroupMessage(newMessage));
      }
    });

    return () => {
      socket.off("newGroupMessage");
    };
  }, [dispatch, selectedGroup]);

  // Listen for message status updates (delivered / seen) — 1-on-1 only
  useEffect(() => {
    socket.on("messageDelivered", ({ messageId }) => {
      dispatch(updateMessageStatus({ messageId, status: "delivered" }));
    });

    socket.on("messagesSeen", ({ by }) => {
      dispatch(markConversationSeen({ userId: by }));
    });

    socket.on("messagesDeliveredBulk", ({ messageIds }) => {
      dispatch(updateMultipleMessageStatus({ messageIds, status: "delivered" }));
    });

    return () => {
      socket.off("messageDelivered");
      socket.off("messagesSeen");
      socket.off("messagesDeliveredBulk");
    };
  }, [dispatch]);

  // Listen for group messages being seen by other members
  useEffect(() => {
    socket.on("groupMessagesSeen", ({ messageIds, userId }) => {
      dispatch(updateGroupMessagesSeenBy({ messageIds, userId }));
    });

    return () => {
      socket.off("groupMessagesSeen");
    };
  }, [dispatch]);

  // Listen for typing indicator events — 1-on-1 only
  useEffect(() => {
    socket.on("userTyping", ({ from }) => {
      dispatch(setTypingUser(from));
    });

    socket.on("userStoppedTyping", () => {
      dispatch(clearTypingUser());
    });

    return () => {
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [dispatch]);

  // Listen for AI thinking indicator events
  useEffect(() => {
    socket.on("aiThinking", ({ isThinking, targetId, groupId }) => {
      if (groupId) {
        if (selectedGroup?._id === groupId) {
          dispatch(setAiThinking(isThinking));
        }
      } else {
        if (selectedUser) {
          dispatch(setAiThinking(isThinking));
        }
      }
    });

    return () => {
      socket.off("aiThinking");
    };
  }, [dispatch, selectedGroup, selectedUser]);

  // Auto scroll to latest message or thinking bubble
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [activeMessages, isAiThinking]);

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <h2 className="text-gray-500 text-lg">
          Select a user to start chatting
        </h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <h2 className="text-gray-500">
          Loading messages...
        </h2>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-3 sm:p-5">

      {activeMessages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">
            No messages yet. Start the conversation 
          </p>
        </div>
      ) : (
        activeMessages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isGroup={isGroup}
            totalOtherMembers={totalOtherMembers}
          />
        ))
      )}

      {/* AI Thinking / Typing Bubble */}
      {isAiThinking && (
        <div className="flex mb-4 justify-start items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm shrink-0">
            AI
          </div>
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-gray-200 shadow-sm flex items-center gap-2 text-gray-600 text-sm">
            <span className="font-semibold text-indigo-600">ChatApp AI</span>
            <span className="text-gray-400">is thinking</span>
            <span className="inline-flex gap-1 items-center ml-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />

    </div>
  );
};

export default MessageContainer;