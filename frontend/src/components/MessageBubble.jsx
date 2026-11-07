import React from "react";
import { useSelector } from "react-redux";
import { Check, CheckCheck } from "lucide-react";
import FormattedText from "./FormattedText";

const MessageBubble = ({ message, isGroup, totalOtherMembers = 0 }) => {
  const { user } = useSelector((state) => state.auth);

  // In group messages, senderId is a populated object ({ _id, name, profilePic }).
  // In 1-on-1 messages, senderId is just a plain ID string. Handle both.
  const senderId =
    typeof message.senderId === "object" ? message.senderId._id : message.senderId;

  const senderName =
    typeof message.senderId === "object" ? message.senderId.name : null;

  const isSender = senderId === user?._id;

  const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Compute an aggregate status for group messages, mirroring the single "status"
  // field used by 1-on-1 messages — based on how many other members have received/seen it
  let tickStatus = message.status; // used as-is for 1-on-1

  if (isGroup) {
    const seenCount = message.seenBy?.length || 0;
    const deliveredCount = message.deliveredTo?.length || 0;

    if (totalOtherMembers > 0 && seenCount >= totalOtherMembers) {
      tickStatus = "seen";
    } else if (totalOtherMembers > 0 && deliveredCount >= totalOtherMembers) {
      tickStatus = "delivered";
    } else {
      tickStatus = "sent";
    }
  }

  return (
    <div className={`flex mb-4 ${isSender ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm bg-gray-200 text-gray-800 ${
          isSender ? "rounded-br-md" : "rounded-bl-md"
        }`}
      >
        {/* Sender name — only shown in group chats, only on messages from others */}
        {isGroup && !isSender && senderName && (
          <p className="text-xs font-semibold text-indigo-600 mb-1">
            {senderName.replace(/🤖/g, "").trim()}
          </p>
        )}

        {message.image && (
          <img
            src={message.image}
            alt="Sent"
            className="max-w-full rounded-lg mb-2"
          />
        )}

        {message.text && <FormattedText text={message.text} />}

        <p className="mt-2 text-xs text-right flex items-center justify-end gap-1 text-gray-500">
          {messageTime}

          {isSender && (
            <span className="ml-1">
              {tickStatus === "seen" && (
                <CheckCheck size={16} className="text-blue-500" />
              )}
              {tickStatus === "delivered" && (
                <CheckCheck size={16} className="text-gray-400" />
              )}
              {tickStatus === "sent" && (
                <Check size={16} className="text-gray-400" />
              )}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;