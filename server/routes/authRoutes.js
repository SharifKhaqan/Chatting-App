import express from "express";
import {
  checkAuth,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

//Create a new Router
const authRoute = express.Router();

//Register Route
authRoute.post("/register", registerUser);

//Login Route
authRoute.post("/login", loginUser);

//LogOut Route
authRoute.post("/logout", logoutUser);

// Check Authentication Route
authRoute.get("/check", protectRoute, checkAuth);

// Update Profile Route (name, about, profile picture)
authRoute.put("/update-profile", protectRoute, updateProfile);

// Change Password Route
authRoute.put("/change-password", protectRoute, changePassword);

export default authRoute;