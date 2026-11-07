import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import toast from "react-hot-toast";

import { updateProfile } from "../api/authApi";
import { setUser } from "../redux/authSlice";
import EditableField from "../components/EditableField";
import ChangePasswordForm from "../components/ChangePasswordForm";

// Convert a selected file to base64, same pattern used for chat images
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const [uploadingPic, setUploadingPic] = useState(false);

  // Generic save helper — used by both Name and About fields
  const handleFieldSave = async (field, value) => {
    const response = await updateProfile({ [field]: value });
    dispatch(setUser(response.data.user));
    toast.success(`${field === "name" ? "Name" : "About"} updated`);
  };

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingPic(true);
      const base64Image = await fileToBase64(file);
      const response = await updateProfile({ profilePic: base64Image });
      dispatch(setUser(response.data.user));
      toast.success("Profile picture updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update picture");
    } finally {
      setUploadingPic(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-indigo-600 px-5 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/home")}
          className="text-white hover:bg-indigo-700 p-2 rounded-full transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white text-lg font-semibold">Profile</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">

        {/* Profile Picture */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <img
              src={user?.profilePic || "https://placehold.co/200x200?text=User"}
              alt={user?.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
            <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-md transition">
              <Camera size={18} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePicChange}
                disabled={uploadingPic}
              />
            </label>
          </div>
        </div>

        {uploadingPic && (
          <p className="text-center text-sm text-gray-500 mb-6">Uploading...</p>
        )}

        <div className={uploadingPic ? "" : "mt-6"}>
          <EditableField
            label="Your Name"
            value={user?.name}
            onSave={(value) => handleFieldSave("name", value)}
          />

          <EditableField
            label="About"
            value={user?.about}
            onSave={(value) => handleFieldSave("about", value)}
          />

          {/* Email (read-only) */}
          <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-xs text-indigo-600 font-medium mb-1">Email</p>
            <p className="text-gray-500">{user?.email}</p>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-xs text-indigo-600 font-medium mb-1">Member Since</p>
            <p className="text-gray-500">{memberSince}</p>
          </div>

          <ChangePasswordForm />
        </div>

      </div>
    </div>
  );
};

export default Profile;