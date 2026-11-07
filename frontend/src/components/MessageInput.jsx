import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ImagePlus, SendHorizonal, X } from "lucide-react";
import toast from "react-hot-toast";

import { sendMessage } from "../api/messageApi";
import { sendGroupMessage } from "../api/groupApi";
import { addMessage, setAiThinking } from "../redux/chatSlice";
import socket from "../socket/socket";

const TYPING_STOP_DELAY = 2000;

const MessageInput = () => {
  const dispatch = useDispatch();

  const { selectedUser, selectedGroup } = useSelector((state) => state.chat);

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Typing indicator only applies to 1-on-1 chats (selectedUser will be null during a group chat anyway)
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!selectedUser) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", { to: selectedUser._id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("stopTyping", { to: selectedUser._id });
    }, TYPING_STOP_DELAY);
  };

  const stopTypingNow = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current && selectedUser) {
      isTypingRef.current = false;
      socket.emit("stopTyping", { to: selectedUser._id });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      toast.success("Image selected successfully");
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSendMessage = async () => {
    if (!selectedUser && !selectedGroup) return;

    if (!text.trim() && !image) {
      return toast.error("Please enter a message");
    }

    try {
      setLoading(true);

      let base64Image = "";
      if (image) {
        base64Image = await fileToBase64(image);
      }

      const messageData = {
        text: text.trim(),
        image: base64Image,
      };

      const isAskingAi = text.toLowerCase().includes("@ai") || selectedUser?.email === "ai.bot@chatapp.local" || selectedUser?.name?.includes("ChatApp AI");
      if (isAskingAi) {
        dispatch(setAiThinking(true));
      }

      if (selectedGroup) {
        // Group messages: don't dispatch here — the sender's own socket is also
        // a member of the room, so "newGroupMessage" will deliver it back to us too.
        // Dispatching here AND on the socket event would show the message twice.
        await sendGroupMessage(selectedGroup._id, messageData);
      } else {
        const response = await sendMessage(selectedUser._id, messageData);
        dispatch(addMessage(response.data.newMessage));
        stopTypingNow();
      }

      setText("");
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send message"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3 sm:p-4 shrink-0">

      {imagePreview && (
        <div className="relative inline-block mb-3">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <label className="cursor-pointer p-3 rounded-full hover:bg-gray-100 transition">
          <ImagePlus size={24} className="text-indigo-600" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>

        <input
          type="text"
          placeholder="Type your message..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="flex-1 px-5 py-3 rounded-full border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full transition disabled:opacity-50"
        >
          <SendHorizonal size={22} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;