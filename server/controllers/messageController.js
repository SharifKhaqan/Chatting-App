import cloudinary from "../config/cloudinary.js";
import { io, getReceiverSocketId } from "../socket/socket.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { getOrCreateBotUser } from "../utils/aiBotHelper.js";

// Get All Users Except Logged-in User
export const getUsersForSidebar = async (req, res) => {
  try {
    // Ensure AI Assistant bot exists so it appears in the sidebar
    await getOrCreateBotUser();

    // Get logged-in user's ID
    const loggedInUserId = req.user._id;

    // Find all users except the logged-in user
    let users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    // Always sort ChatApp AI to the very top of the list
    users = users.sort((a, b) => {
      const aIsBot = a.email === "ai.bot@chatapp.local" || a.name === "ChatApp AI";
      const bIsBot = b.email === "ai.bot@chatapp.local" || b.name === "ChatApp AI";
      if (aIsBot && !bIsBot) return -1;
      if (!aIsBot && bIsBot) return 1;
      return 0;
    });

    // Send users list
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Send Message Controller
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    let imageUrl = "";

    // If an image was sent (base64 string), upload it to Cloudinary
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "Chat-App", // optional, keeps uploads organized
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      // Receiver is online right now → mark delivered immediately
      newMessage.status = "delivered";
      await newMessage.save();

      // Send the new message to the receiver
      io.to(receiverSocketId).emit("newMessage", newMessage);

      // Notify the SENDER that it was delivered (so their ticks update live)
      const senderSocketId = getReceiverSocketId(senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: newMessage._id,
        });
      }
    }

    // Trigger n8n AI Bot Webhook if message contains @ai or receiver is the AI Bot
    if (process.env.N8N_AI_BOT_WEBHOOK_URL && text) {
      const isAiMention = text.toLowerCase().includes("@ai");
      User.findById(receiverId).select("email").then(async (receiverUser) => {
        const isDirectBotChat = receiverUser?.email === "ai.bot@chatapp.local";
        if (isAiMention || isDirectBotChat) {
          const cleanPrompt = isAiMention
            ? text.replace(/@ai/gi, "").trim()
            : text.trim();

          const senderSocketId = getReceiverSocketId(senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit("aiThinking", { isThinking: true, targetId: receiverId });
          }

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
                receiverId: receiverId.toString(),
                isGroup: false,
              }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`n8n responded with status ${response.status}`);
            }
          } catch (err) {
            console.error("n8n AI webhook error:", err.message);
            if (senderSocketId) {
              io.to(senderSocketId).emit("aiThinking", { isThinking: false, targetId: receiverId });
            }
            const botUser = await getOrCreateBotUser();
            const errorMsg = await Message.create({
              senderId: botUser._id,
              receiverId: senderId,
              text: "⚠️ Sorry, I could not process your request right now. Please check if your n8n workflow is active and try again.",
              status: "delivered",
            });
            if (senderSocketId) {
              io.to(senderSocketId).emit("newMessage", errorMsg);
            }
          }
        }
      }).catch((err) => console.error("AI check error:", err.message));
    }

    return res.status(201).json({
      success: true,
      message: "Message Sent Successfully",
      newMessage,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get Conversation Messages
export const getMessages = async (req, res) => {
  try {
    // Logged-in user
    const myId = req.user._id;

    // Other user's ID
    const userToChatId = req.params.id;

    // Find conversation
    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId: userToChatId,
        },
        {
          senderId: userToChatId,
          receiverId: myId,
        },
      ],
    });

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

// markMessagesAsSeen Controller
export const markMessagesAsSeen = async (req, res) => {
  try {
    const receiverId = req.user._id; 
    const senderId = req.params.senderId; 

    await Message.updateMany(
      { senderId, receiverId, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );

    // Notify the original sender their messages were seen
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { by: receiverId });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Handle incoming AI reply from n8n workflow
export const handleAiReply = async (req, res) => {
  try {
    const { reply, groupId, receiverId, senderId, isGroup } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content cannot be empty",
      });
    }

    const botUser = await getOrCreateBotUser();

    if (isGroup && groupId) {
      // AI reply to a group
      const newBotMessage = await Message.create({
        senderId: botUser._id,
        groupId,
        text: reply.trim(),
      });

      const populatedMessage = await Message.findById(newBotMessage._id).populate(
        "senderId",
        "name profilePic"
      );

      // Stop thinking indicator and broadcast new message to everyone in the group room
      io.to(groupId).emit("aiThinking", { isThinking: false, groupId });
      io.to(groupId).emit("newGroupMessage", populatedMessage);

      return res.status(201).json({
        success: true,
        message: "AI reply posted to group successfully",
        newMessage: populatedMessage,
      });
    } else {
      // 1-on-1 AI reply to the user who requested it
      const targetUserId = senderId || receiverId;
      const targetSocketId = getReceiverSocketId(targetUserId);

      const newBotMessage = await Message.create({
        senderId: botUser._id,
        receiverId: targetUserId,
        text: reply.trim(),
        status: targetSocketId ? "delivered" : "sent",
      });

      if (targetSocketId) {
        io.to(targetSocketId).emit("aiThinking", { isThinking: false, targetId: targetUserId });
        io.to(targetSocketId).emit("newMessage", newBotMessage);
      }

      return res.status(201).json({
        success: true,
        message: "AI reply sent successfully",
        newMessage: newBotMessage,
      });
    }
  } catch (error) {
    console.error("handleAiReply error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

