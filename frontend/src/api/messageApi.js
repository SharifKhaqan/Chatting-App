import api from "./axios";

// Get Sidebar Users
export const getUsers = async () => {
  return await api.get("/messages/users");
};

// Get Conversation Messages
export const getMessages = async (receiverId) => {
  return await api.get(`/messages/${receiverId}`);
};

// Send Message
export const sendMessage = async (receiverId, messageData) => {
  return await api.post(`/messages/send/${receiverId}`, messageData);
};

// Mark as Seen
export const markAsSeen = async (senderId) => {
  return await api.put(`/messages/seen/${senderId}`);
};