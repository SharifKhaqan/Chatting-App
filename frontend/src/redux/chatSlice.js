import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  selectedUser: null,
  messages: [],
  loading: false,
  onlineUsers: [],
  typingUserId: null,
  isAiThinking: false,

  groups: [],
  selectedGroup: null,
  groupMessages: [],
};

const chatSlice = createSlice({
  name: "chat",

  initialState,

  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },

    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
      state.selectedGroup = null;
      state.isAiThinking = false;
    },

    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload);
      state.isAiThinking = false;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },

    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const msg = state.messages.find((m) => m._id === messageId);
      if (msg) msg.status = status;
    },

    markConversationSeen: (state, action) => {
      state.messages = state.messages.map((m) =>
        m.receiverId === action.payload.userId ? { ...m, status: "seen" } : m
      );
    },

    updateMultipleMessageStatus: (state, action) => {
      const { messageIds, status } = action.payload;
      state.messages = state.messages.map((m) =>
        messageIds.includes(m._id) ? { ...m, status } : m
      );
    },

    setTypingUser: (state, action) => {
      state.typingUserId = action.payload;
    },

    clearTypingUser: (state) => {
      state.typingUserId = null;
    },

    // ---- Group Chat ----

    setGroups: (state, action) => {
      state.groups = action.payload;
    },

    addGroup: (state, action) => {
      state.groups.unshift(action.payload);
    },

    setSelectedGroup: (state, action) => {
      state.selectedGroup = action.payload;
      state.selectedUser = null;
    },

    setGroupMessages: (state, action) => {
      state.groupMessages = action.payload;
    },

    addGroupMessage: (state, action) => {
      state.groupMessages.push(action.payload);
      state.isAiThinking = false;
    },

    setAiThinking: (state, action) => {
      state.isAiThinking = action.payload;
    },

    // Adds a user into seenBy (and deliveredTo) for a batch of group messages
    updateGroupMessagesSeenBy: (state, action) => {
      const { messageIds, userId } = action.payload;

      state.groupMessages = state.groupMessages.map((m) => {
        if (!messageIds.includes(m._id)) return m;

        const seenBy = m.seenBy?.includes(userId) ? m.seenBy : [...(m.seenBy || []), userId];
        const deliveredTo = m.deliveredTo?.includes(userId)
          ? m.deliveredTo
          : [...(m.deliveredTo || []), userId];

        return { ...m, seenBy, deliveredTo };
      });
    },

    clearChat: (state) => {
      state.users = [];
      state.selectedUser = null;
      state.messages = [];
      state.onlineUsers = [];
      state.typingUserId = null;
      state.isAiThinking = false;
      state.groups = [];
      state.selectedGroup = null;
      state.groupMessages = [];
      state.loading = false;
    },

    // Deselects whatever chat is currently open (used by the mobile "back" button)
    clearSelectedChat: (state) => {
      state.selectedUser = null;
      state.selectedGroup = null;
      state.isAiThinking = false;
    },
  },
});

export const {
  setUsers,
  setSelectedUser,
  setMessages,
  addMessage,
  setLoading,
  setOnlineUsers,
  clearChat,
  updateMessageStatus,
  markConversationSeen,
  updateMultipleMessageStatus,
  setTypingUser,
  clearTypingUser,
  setAiThinking,
  setGroups,
  addGroup,
  setSelectedGroup,
  setGroupMessages,
  addGroupMessage,
  updateGroupMessagesSeenBy,
  clearSelectedChat,
} = chatSlice.actions;

export default chatSlice.reducer;