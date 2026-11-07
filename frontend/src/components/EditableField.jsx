import React, { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

// Reusable inline-editable field — used for Name, About, or any similar "label + value + edit" block
const EditableField = ({ label, value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!input.trim()) return;

    try {
      setSaving(true);
      await onSave(input.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setInput(value || "");
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
      <p className="text-xs text-indigo-600 font-medium mb-1">{label}</p>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border-b border-indigo-300 outline-none py-1 text-gray-800"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-green-600 hover:bg-green-50 p-2 rounded-full disabled:opacity-50"
          >
            <Check size={18} />
          </button>
          <button
            onClick={handleCancel}
            className="text-red-500 hover:bg-red-50 p-2 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-gray-800">{value}</p>
          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-indigo-600 p-2 rounded-full"
          >
            <Pencil size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableField;