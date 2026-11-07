import React from "react";
import { Phone, PhoneOff } from "lucide-react";

// Formats seconds into mm:ss, e.g. 125 -> "02:05"
const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const CallModal = ({
  callStatus,
  incomingCall,
  callType,
  failReason,
  callDuration,
  isReceiverOnline,
  localVideoRef,
  remoteVideoRef,
  acceptCall,
  rejectCall,
  endCall,
}) => {
  if (callStatus === "idle") return null;

  // Full-screen layout only for an active/ongoing VIDEO call — audio calls and
  // the ringing/failed states stay as a small centered card, since there's no
  // video content to show room for yet.
  const isFullScreenVideo =
    callType === "video" && (callStatus === "calling" || callStatus === "connected");

  if (isFullScreenVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">

        {/* Remote video fills the entire screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Your own camera — small preview overlay, responsive sizing */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute top-4 right-4 w-24 h-32 sm:w-32 sm:h-44 md:w-40 md:h-56 rounded-xl object-cover border-2 border-white shadow-lg z-10 bg-gray-800"
        />

        {/* Status pill — top left */}
        <div className="absolute top-4 left-4 z-10">
          <p className="text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
            {callStatus === "calling"
              ? isReceiverOnline
                ? "Ringing..."
                : "Calling..."
              : formatDuration(callDuration)}
          </p>
        </div>

        {/* Hangup control — bottom center, safe distance from screen edge on mobile */}
        <div className="absolute bottom-8 sm:bottom-10 left-0 right-0 flex justify-center z-10">
          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white p-5 rounded-full shadow-lg transition"
            title="End Call"
          >
            <PhoneOff size={26} />
          </button>
        </div>

      </div>
    );
  }

  // ---- Compact card layout — used for audio calls, incoming/ringing, and failed states ----
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col items-center">

        {/* Incoming Call Screen */}
        {callStatus === "ringing" && incomingCall && (
          <>
            <h2 className="text-xl font-semibold mb-1 text-gray-800">
              {incomingCall.fromName || "Someone"} is calling...
            </h2>
            <p className="text-sm text-gray-500 mb-6 capitalize">
              {incomingCall.callType} call
            </p>

            <div className="flex gap-6">
              <button
                onClick={acceptCall}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition"
                title="Accept"
              >
                <Phone size={24} />
              </button>

              <button
                onClick={rejectCall}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition"
                title="Decline"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </>
        )}

        {/* Audio Calling / Connected Screen */}
        {(callStatus === "calling" || callStatus === "connected") && (
          <>
            <h2 className="text-lg font-medium mb-1 text-gray-700">
              {callStatus === "calling"
                ? isReceiverOnline
                  ? "Ringing..."
                  : "Calling..."
                : "In Call"}
            </h2>

            {callStatus === "connected" && (
              <p className="text-sm text-gray-500 mb-4">
                {formatDuration(callDuration)}
              </p>
            )}

            {/* Hidden video element still needed to actually play the remote audio */}
            <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />

            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition mt-2"
              title="End Call"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}

        {/* Call Failed Screen (offline / declined / ended) */}
        {callStatus === "failed" && (
          <>
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <PhoneOff size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-800">
              {failReason || "Call could not be connected"}
            </h2>
          </>
        )}

      </div>
    </div>
  );
};

export default CallModal;