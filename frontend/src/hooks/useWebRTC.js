import { useRef, useState, useCallback, useEffect } from "react";
import socket from "../socket/socket";

// Free public STUN server — helps browsers discover their public network address
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export const useWebRTC = (myUserId, myName) => {
  // Holds the actual WebRTC connection object (not React state, doesn't need re-renders)
  const peerConnection = useRef(null);

  // Holds our own camera/mic stream
  const localStream = useRef(null);

  // Call state — drives what the UI shows
  // idle | calling | ringing | connected | failed
  const [callStatus, setCallStatus] = useState("idle");
  const [incomingCall, setIncomingCall] = useState(null); // { from, fromName, offer, callType }
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [callType, setCallType] = useState("audio"); // audio | video
  const [failReason, setFailReason] = useState("");

  // Call duration timer (seconds elapsed since "connected")
  const [callDuration, setCallDuration] = useState(0);
  const durationInterval = useRef(null);

  // Refs pointing to the actual <video> elements in the UI
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Start/stop the duration counter whenever call status changes
  useEffect(() => {
    if (callStatus === "connected") {
      durationInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationInterval.current);
      setCallDuration(0);
    }

    return () => clearInterval(durationInterval.current);
  }, [callStatus]);

  // Builds a fresh RTCPeerConnection and wires up its event handlers
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Whenever this browser discovers a possible network path, send it to the other side
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", { to: targetUserId, candidate: event.candidate });
      }
    };

    // Whenever the other side's audio/video stream arrives, attach it to our remote <video>
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  // Stops camera/mic and closes the peer connection, WITHOUT resetting UI state
  const stopMediaAndConnection = () => {
    peerConnection.current?.close();
    peerConnection.current = null;

    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;
  };

  // Full cleanup — stops media AND resets everything back to idle
  const cleanup = () => {
    stopMediaAndConnection();
    setCallStatus("idle");
    setRemoteUserId(null);
    setIncomingCall(null);
    setFailReason("");
  };

  // ---- Caller side: start a call ----
  const startCall = useCallback(async (targetUserId, type = "audio") => {
    try {
      setCallType(type);
      setRemoteUserId(targetUserId);
      setCallStatus("calling");

      // Ask the browser for mic (and camera if video call)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(targetUserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      peerConnection.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        to: targetUserId,
        from: myUserId,
        fromName: myName,
        offer,
        callType: type,
      });
    } catch (error) {
      console.log("Error starting call:", error.message);
      cleanup();
    }
  }, [myUserId, myName]);

  // ---- Receiver side: accept an incoming call ----
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const { from, offer, callType: type } = incomingCall;
      setCallType(type);
      setRemoteUserId(from);
      setCallStatus("connected");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(from);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      peerConnection.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", { to: from, answer });
      setIncomingCall(null);
    } catch (error) {
      console.log("Error accepting call:", error.message);
      cleanup();
    }
  }, [incomingCall]);

  // ---- Reject an incoming call without answering ----
  const rejectCall = useCallback(() => {
    if (incomingCall) {
      socket.emit("endCall", { to: incomingCall.from, reason: "declined" });
    }
    setIncomingCall(null);
    setCallStatus("idle");
  }, [incomingCall]);

  // ---- End a call that's ongoing or being placed ----
  const endCall = useCallback(() => {
    if (remoteUserId) {
      socket.emit("endCall", { to: remoteUserId, reason: "ended" });
    }
    cleanup();
  }, [remoteUserId]);

  // ---- Socket listeners — call registerListeners() once when the component mounts ----
  const registerListeners = useCallback(() => {
    socket.on("incomingCall", ({ from, fromName, offer, callType: type }) => {
      setIncomingCall({ from, fromName, offer, callType: type });
      setCallStatus("ringing");
    });

    socket.on("callAccepted", async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("connected");
      }
    });

    socket.on("iceCandidate", async ({ candidate }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.log("Error adding ICE candidate:", err.message);
        }
      }
    });

    socket.on("callEnded", ({ reason } = {}) => {
      if (reason === "declined") {
        // Call was declined before it connected
        stopMediaAndConnection();
        setFailReason("Call Declined");
        setCallStatus("failed");

        setTimeout(() => {
          setCallStatus("idle");
          setRemoteUserId(null);
          setIncomingCall(null);
          setFailReason("");
        }, 3000);
      } else if (reason === "ended") {
        // Call was hung up, either while ringing or after connecting
        stopMediaAndConnection();
        setFailReason("Call Ended");
        setCallStatus("failed");

        setTimeout(() => {
          setCallStatus("idle");
          setRemoteUserId(null);
          setIncomingCall(null);
          setFailReason("");
        }, 3000);
      } else {
        cleanup();
      }
    });

    socket.on("callFailed", ({ reason }) => {
      // Stop our own camera/mic and connection immediately,
      // but keep the "failed" message visible for a few seconds
      stopMediaAndConnection();
      setFailReason(reason || "Call could not be connected");
      setCallStatus("failed");

      setTimeout(() => {
        setCallStatus("idle");
        setRemoteUserId(null);
        setIncomingCall(null);
        setFailReason("");
      }, 3000);
    });
  }, []);

  const removeListeners = () => {
    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("iceCandidate");
    socket.off("callEnded");
    socket.off("callFailed");
  };

  return {
    callStatus,
    incomingCall,
    callType,
    remoteUserId,
    failReason,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    registerListeners,
    removeListeners,
  };
};