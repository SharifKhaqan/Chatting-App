import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

// Debug logs
socket.on("connect", () => {
  console.log("Socket Connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket Disconnected");
});

// Connect Socket
export const connectSocket = (userId) => {
  if (!userId) return;

  // Prevent multiple connections
  if (socket.connected) return;

  socket.io.opts.query = {
    userId,
  };

  socket.connect();
};

// Disconnect Socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Export Socket
export default socket;