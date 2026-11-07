import api from "./axios";

// Register User
export const registerUser = async (userData) => {
  return await api.post("/auth/register", userData);
};

// Login User
export const loginUser = async (userData) => {
  return await api.post("/auth/login", userData);
};

// Logout User
export const logoutUser = async () => {
  return await api.post("/auth/logout");
};

// Check Logged-in User
export const checkAuth = async () => {
  return await api.get("/auth/check");
};

// Update Profile (name, about, profilePic)
export const updateProfile = async (profileData) => {
  return await api.put("/auth/update-profile", profileData);
};

// Change Password
export const changePassword = async (passwordData) => {
  return await api.put("/auth/change-password", passwordData);
};