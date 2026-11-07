import { Server } from "socket.io";
import http from "http";
import express from "express";
import Group from "../models/Group.js";

const app = express();

const server = http.createServer(app);

// Frontend URLs allowed to connect (comma-separated in CLIENT_URL)
export const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Store online users
const onlineUsers = {};

// Helper function
export const getReceiverSocketId = (userId) => {
  return onlineUsers[userId];
};

// Helper — joins a specific online user's socket to a group room
export const joinUserToGroupRoom = (userId, groupId) => {
  const socketId = onlineUsers[userId];
  if (socketId) {
    const targetSocket = io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.join(groupId.toString());
    }
  }
};

io.on("connection", (socket) => {
  
  const userId = socket.handshake.query.userId;

  // Save userId -> socketId mapping
  if (userId) {
    onlineUsers[userId] = socket.id;
  }

  // Send online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(onlineUsers));

  // Group Chat: auto-join all rooms this user is a member of 
  if (userId) {
    (async () => {
      try {
        const userGroups = await Group.find({ members: userId }).select("_id");
        userGroups.forEach((group) => {
          socket.join(group._id.toString());
        });
      } catch (error) {
        console.log("Error joining group rooms:", error.message);
      }
    })();
  }
  // End Group Chat room joining 
  // Typing Indicator 

  socket.on("typing", ({ to }) => {
    const targetSocketId = onlineUsers[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("userTyping", { from: userId });
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const targetSocketId = onlineUsers[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("userStoppedTyping", { from: userId });
    }
  });

  // End Typing Indicator 

  // WebRTC Call Signaling

  
  socket.on("callUser", ({ to, offer, callType, from, fromName }) => {
    const receiverSocketId = onlineUsers[to];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", { from, fromName, offer, callType });
    } else {
      // Receiver is offline — tell caller immediately
      socket.emit("callFailed", { reason: "User is offline" });
    }
  });

  // Receiver accepts the call
  socket.on("answerCall", ({ to, answer }) => {
    const callerSocketId = onlineUsers[to];

    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", { answer });
    }
  });

  // Exchanging network connection info (ICE candidates)
  socket.on("iceCandidate", ({ to, candidate }) => {
    const targetSocketId = onlineUsers[to];

    if (targetSocketId) {
      io.to(targetSocketId).emit("iceCandidate", { candidate });
    }
  });

  // Either side ends/rejects the call
  socket.on("endCall", ({ to, reason }) => {
    const targetSocketId = onlineUsers[to];

    if (targetSocketId) {
      io.to(targetSocketId).emit("callEnded", { reason });
    }
  });

  // End WebRTC Call Signaling 

  socket.on("disconnect", () => {
    // Remove user from online users
    delete onlineUsers[userId];

    // Send updated online users
    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });
});

export { app, server, io };