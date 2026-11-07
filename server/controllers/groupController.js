import Group from "../models/Group.js";
import Message from "../models/Message.js";
import cloudinary from "../config/cloudinary.js";
import { io, joinUserToGroupRoom, getReceiverSocketId } from "../socket/socket.js";
import { getOrCreateBotUser } from "../utils/aiBotHelper.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { name, members, groupPic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    if (!members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({
        success: false,
        message: "A group needs at least 2 other members",
      });
    }

    const allMembers = [...new Set([creatorId.toString(), ...members])];

    let groupPicUrl = "";

    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic, {
        folder: "Chat-App/group-pics",
      });
      groupPicUrl = uploadResponse.secure_url;
    }

    const group = await Group.create({
      name: name.trim(),
      members: allMembers,
      createdBy: creatorId,
      groupPic: groupPicUrl,
    });

    allMembers.forEach((memberId) => {
      joinUserToGroupRoom(memberId, group._id);
    });

    const populatedGroup = await Group.findById(group._id).populate(
      "members",
      "name profilePic"
    );

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: populatedGroup,
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get all groups the logged-in user is a member of
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "name profilePic")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      groups,
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get all messages in a specific group
export const getGroupMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const messages = await Message.find({ groupId })
      .populate("senderId", "name profilePic")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { groupId } = req.params;
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!group.members.some((m) => m.toString() === senderId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    let imageUrl = "";

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "Chat-App/group-images",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Figure out which OTHER members are online right now —
    // they'll receive this message instantly via the room broadcast, so mark them delivered
    const onlineMemberIds = group.members
      .map((m) => m.toString())
      .filter((id) => id !== senderId.toString() && getReceiverSocketId(id));

    const newMessage = await Message.create({
      senderId,
      groupId,
      text,
      image: imageUrl,
      deliveredTo: onlineMemberIds,
    });

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "name profilePic"
    );

    // Broadcast to everyone currently in this group's room, instantly
    io.to(groupId).emit("newGroupMessage", populatedMessage);

    // Trigger n8n AI Bot Webhook if group message mentions @ai
    if (process.env.N8N_AI_BOT_WEBHOOK_URL && text && text.toLowerCase().includes("@ai")) {
      const cleanPrompt = text.replace(/@ai/gi, "").trim();

      // Emit AI thinking indicator to everyone in the group
      io.to(groupId).emit("aiThinking", { isThinking: true, groupId });

      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const response = await fetch(process.env.N8N_AI_BOT_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: cleanPrompt,
              rawText: text,
              senderName: req.user.name,
              senderId: senderId.toString(),
              groupId: groupId.toString(),
              isGroup: true,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`n8n responded with status ${response.status}`);
          }
        } catch (err) {
          console.error("n8n AI group webhook error:", err.message);
          io.to(groupId).emit("aiThinking", { isThinking: false, groupId });

          // Send automatic error message from the bot into the group
          const botUser = await getOrCreateBotUser();
          const errorMsg = await Message.create({
            senderId: botUser._id,
            groupId,
            text: "⚠️ Sorry, I could not process that request right now. Please check if your n8n workflow is active.",
          });
          const populated = await Message.findById(errorMsg._id).populate("senderId", "name profilePic");
          io.to(groupId).emit("newGroupMessage", populated);
        }
      })();
    }

    return res.status(201).json({
      success: true,
      message: "Message Sent Successfully",
      newMessage: populatedMessage,
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Mark all messages in a group as seen by the current user
export const markGroupMessagesSeen = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId } = req.params;

    // Find messages in this group not sent by us, that we haven't already marked seen
    const messages = await Message.find({
      groupId,
      senderId: { $ne: userId },
      seenBy: { $ne: userId },
    });

    if (messages.length === 0) {
      return res.status(200).json({ success: true, message: "Nothing to update" });
    }

    const messageIds = messages.map((m) => m._id);

    // Add us to both seenBy and deliveredTo (seeing it implies it was delivered)
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { seenBy: userId, deliveredTo: userId } }
    );

    // Notify everyone else in the group so their ticks can update live
    io.to(groupId).emit("groupMessagesSeen", { messageIds, userId });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};