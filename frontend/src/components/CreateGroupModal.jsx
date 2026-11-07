import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { X, Camera, Users } from "lucide-react";
import toast from "react-hot-toast";

import { createGroup } from "../api/groupApi";
import { addGroup, setSelectedGroup } from "../redux/chatSlice";

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// members: array of selected user IDs, already chosen in the Sidebar before this modal opens
const CreateGroupModal = ({ members, onClose }) => {
  const dispatch = useDispatch();

  const [groupName, setGroupName] = useState("");
  const [groupPic, setGroupPic] = useState(null);
  const [groupPicPreview, setGroupPicPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupPic(file);
      setGroupPicPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      return toast.error("Please enter a group name");
    }

    if (members.length < 2) {
      return toast.error("Select at least 2 members");
    }

    try {
      setLoading(true);

      let base64Pic = "";
      if (groupPic) {
        base64Pic = await fileToBase64(groupPic);
      }

      const response = await createGroup({
        name: groupName.trim(),
        members,
        groupPic: base64Pic,
      });

      dispatch(addGroup(response.data.group));
      dispatch(setSelectedGroup(response.data.group));

      toast.success("Group created successfully");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            Name Your Group
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">

          {/* Group Picture */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <img
                src={groupPicPreview || "https://placehold.co/100x100?text=Group"}
                alt="Group"
                className="w-20 h-20 rounded-full object-cover border"
              />
              <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full cursor-pointer">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePicChange}
                />
              </label>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mb-4">
            Adding {members.length} member{members.length !== 1 ? "s" : ""}
          </p>

          {/* Group Name */}
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateGroupModal;