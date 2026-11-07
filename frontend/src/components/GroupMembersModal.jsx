import React from "react";
import { X, Users } from "lucide-react";
import Avatar from "./Avatar";

const GroupMembersModal = ({ group, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{group.name}</h2>
            <p className="text-sm text-gray-500">{group.members.length} members</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Members List */}
        <div className="p-3 overflow-y-auto flex-1">
          {group.members.map((member) => (
            <div
              key={member._id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <Avatar src={member.profilePic} name={member.name} sizeClass="w-10 h-10" textSizeClass="text-sm" />
              <span className="text-gray-800 text-sm">{member.name}</span>
              {member._id === group.createdBy && (
                <span className="ml-auto text-xs text-indigo-600 font-medium">Admin</span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default GroupMembersModal;