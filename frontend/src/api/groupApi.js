import api from "./axios";

export const createGroup = async (groupData) => {
  return await api.post("/groups/create", groupData);
};

export const getUserGroups = async () => {
  return await api.get("/groups/my-groups");
};

export const getGroupMessages = async (groupId) => {
  return await api.get(`/groups/${groupId}/messages`);
};

export const sendGroupMessage = async (groupId, messageData) => {
  return await api.post(`/groups/${groupId}/send`, messageData);
};

export const markGroupMessagesSeen = async (groupId) => {
  return await api.put(`/groups/${groupId}/seen`);
};