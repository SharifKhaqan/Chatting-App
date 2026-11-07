import React from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { LogOut, UserCircle2 } from "lucide-react";
import { disconnectSocket } from "../socket/socket";

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate(); 

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link
          to="/home"
          className="text-2xl font-bold text-indigo-600 tracking-wide"
        >
          ChatApp
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          
          {/* Profile Button */}
          <button
            onClick={() => navigate("/profile")}   
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            <UserCircle2 size={20} />
            <span className="hidden sm:block">
              Profile
            </span>
          </button>

          {/* Logout Button — unchanged */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} />
            <span className="hidden sm:block">
              Logout
            </span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Navbar;