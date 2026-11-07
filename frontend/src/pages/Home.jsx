import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageContainer from "../components/MessageContainer";
import MessageInput from "../components/MessageInput";

import { logoutUser as logoutUserApi } from "../api/authApi";
import { logoutUser as logoutUserAction } from "../redux/authSlice";
import { clearChat } from "../redux/chatSlice";
import { disconnectSocket } from "../socket/socket";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedUser, selectedGroup } = useSelector((state) => state.chat);

  const hasActiveChat = !!(selectedUser || selectedGroup);

  const handleLogout = async () => {
    try {
      const response = await logoutUserApi();
      disconnectSocket();
      dispatch(logoutUserAction());
      dispatch(clearChat());
      toast.success(response.data.message);
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  return (
    // h-screen (fixed) instead of min-h-screen — gives every nested flex-1
    // child a real, reliable height to fill, regardless of how much content exists
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar onLogout={handleLogout} />

      <div className="flex-1 min-h-0 flex md:items-center md:justify-center md:p-6 overflow-hidden">
        <div className="w-full h-full md:h-[80vh] md:max-w-6xl bg-white md:rounded-2xl md:shadow-2xl overflow-hidden flex min-h-0">

          <Sidebar />

          <div
            className={`flex-1 min-h-0 flex-col ${
              hasActiveChat ? "flex" : "hidden md:flex"
            }`}
          >
            {!hasActiveChat ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-6">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                  <MessageCircle size={40} className="text-indigo-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  No Chat Selected
                </h2>

                <p className="text-gray-500 text-center max-w-sm">
                  Select a user or group from the sidebar to start your conversation.
                </p>
              </div>
            ) : (
              <>
                <ChatHeader />
                <MessageContainer />
                <MessageInput />
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;