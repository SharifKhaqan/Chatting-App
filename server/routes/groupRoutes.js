import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  sendGroupMessage,
  markGroupMessagesSeen,
} from "../controllers/groupController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const groupRoute = express.Router();

groupRoute.post("/create", protectRoute, createGroup);
groupRoute.get("/my-groups", protectRoute, getUserGroups);
groupRoute.get("/:groupId/messages", protectRoute, getGroupMessages);
groupRoute.post("/:groupId/send", protectRoute, sendGroupMessage);
groupRoute.put("/:groupId/seen", protectRoute, markGroupMessagesSeen);

export default groupRoute;