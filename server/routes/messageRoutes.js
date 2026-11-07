import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { getMessages, getUsersForSidebar, markMessagesAsSeen, sendMessage, handleAiReply } from "../controllers/messageController.js";

// Create Router
const messageRoute = express.Router();

// AI Bot Reply endpoint (called by n8n workflow)
messageRoute.post("/ai-reply", handleAiReply);

// Get All Users
messageRoute.get("/users", protectRoute, getUsersForSidebar);

// Send Message Route
messageRoute.post("/send/:id", protectRoute, sendMessage);

// Get Conversation
messageRoute.get("/:id", protectRoute, getMessages);

//mark Messages As seen
messageRoute.put("/seen/:senderId", protectRoute, markMessagesAsSeen);

export default messageRoute;