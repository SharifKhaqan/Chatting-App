import { connectSocket } from "../socket/socket";
import socket from "../socket/socket";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { checkAuth } from "../api/authApi";
import { setUser } from "../redux/authSlice";
import { setOnlineUsers } from "../redux/chatSlice";

const AuthChecker = ({ children }) => {
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Register listener BEFORE connecting, so no broadcast is missed
    socket.on("getOnlineUsers", (users) => {
      dispatch(setOnlineUsers(users));
    });

    const verifyUser = async () => {
      try {
        const response = await checkAuth();

        if (response.data.success) {
          dispatch(setUser(response.data.user));
          connectSocket(response.data.user._id); // connects AFTER listener is ready
        }
      } catch (error) {
        console.log(error);
      } finally {
        setChecking(false);
      }
    };

    verifyUser();

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [dispatch]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return children;
};

export default AuthChecker;
