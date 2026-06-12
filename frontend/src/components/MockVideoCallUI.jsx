import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Send,
  MessageSquare,
  Users,
  X,
  Sparkles,
  Laptop
} from "lucide-react";
import toast from "react-hot-toast";

function MockVideoCallUI({ session, user }) {
  const navigate = useNavigate();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [inputText, setInputText] = useState("");
  
  // Chat messages state
  const [messages, setMessages] = useState([
    {
      id: "initial_1",
      text: `Hey! Thanks for joining. Let's work together on: ${session?.problem || "this problem"}.`,
      senderName: "Sarah Chen (Collaborator)",
      senderImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
      createdAt: new Date(Date.now() - 60000)
    }
  ]);

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Access user's local webcam stream
  useEffect(() => {
    const startCamera = async () => {
      if (isVideoOn && !isScreenSharing) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 480, height: 360 },
            audio: false // prevent feedback
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.warn("Camera access denied or unavailable:", error.message);
          setIsVideoOn(false);
        }
      } else {
        stopCamera();
      }
    };

    startCamera();

    return () => stopCamera();
  }, [isVideoOn, isScreenSharing]);

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  // Handle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        toast.success("Screen sharing started");

        // Listen for screen share termination from browser UI
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } catch (error) {
        console.warn("Screen share cancelled:", error.message);
        setIsScreenSharing(false);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    toast.success("Screen sharing stopped");
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle sending message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      text: inputText.trim(),
      senderName: user?.fullName || "You",
      senderImage: user?.imageUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=You",
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentText = inputText.trim().toLowerCase();
    setInputText("");

    // Simulate collaborator response
    setTimeout(() => {
      let replyText = "I agree! Let's continue working on this solution.";
      
      if (currentText.includes("hello") || currentText.includes("hi") || currentText.includes("hey")) {
        replyText = "Hello! Ready to dive into the starter code?";
      } else if (currentText.includes("code") || currentText.includes("function") || currentText.includes("starter")) {
        replyText = "The starter code structure looks good. Let's handle the edge cases first.";
      } else if (currentText.includes("run") || currentText.includes("test") || currentText.includes("execute")) {
        replyText = "Let's click 'Run Code' on the editor to see if our tests pass!";
      } else if (currentText.includes("optimize") || currentText.includes("time") || currentText.includes("complexity")) {
        replyText = "Good idea. We should try to aim for O(N) time complexity to pass all hidden cases.";
      } else if (currentText.includes("error") || currentText.includes("fail") || currentText.includes("bug")) {
        replyText = "Ah, let's debug that. Let's print the intermediate variables in the output panel.";
      } else if (currentText.includes("success") || currentText.includes("pass") || currentText.includes("solve")) {
        replyText = "Awesome! The tests passed successfully! Let's wrap up this session.";
      }

      const botMessage = {
        id: `bot_${Date.now()}`,
        text: replyText,
        senderName: "Sarah Chen (Collaborator)",
        senderImage: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
        createdAt: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1500);
  };

  return (
    <div className="h-full flex gap-3 relative">
      {/* Video Call Column */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Top Status Panel */}
        <div className="flex items-center justify-between gap-2 bg-base-100 p-3 rounded-xl shadow border border-primary/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-semibold text-sm">
              Collaboration Link Active (Mock Mode) • 2 Participants
            </span>
          </div>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`btn btn-sm gap-2 rounded-lg ${
              isChatOpen ? "btn-primary" : "btn-ghost border border-primary/20"
            }`}
          >
            <MessageSquare className="size-4" />
            <span>Chat</span>
          </button>
        </div>

        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-base-200 p-3 rounded-xl overflow-hidden min-h-[350px]">
          {/* Panel 1: Main User or Screen Share */}
          <div className="bg-neutral-900 rounded-lg overflow-hidden relative border border-white/5 flex flex-col items-center justify-center min-h-[160px]">
            {isScreenSharing ? (
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center p-4">
                <div className="w-20 h-20 bg-primary/15 border-2 border-primary rounded-full mx-auto flex items-center justify-center mb-2 shadow-lg animate-pulse">
                  <span className="text-2xl font-black text-primary">
                    {user?.firstName?.slice(0, 1) || "U"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{user?.fullName || "You"}</p>
                <p className="text-xs text-white/50">Camera Muted</p>
              </div>
            )}
            
            {/* Overlay label */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-2">
              <div className="size-2 bg-primary rounded-full" />
              <span className="text-xs font-semibold text-white">
                {isScreenSharing ? "Sharing Screen" : `${user?.fullName || "You"} (You)`}
              </span>
              {!isMicOn && <MicOff className="size-3 text-error ml-1" />}
            </div>
          </div>

          {/* Panel 2: Teammate (Sarah Chen) */}
          <div className="bg-neutral-900 rounded-lg overflow-hidden relative border border-white/5 flex flex-col items-center justify-center min-h-[160px]">
            <div className="text-center p-4">
              <div className="w-20 h-20 bg-secondary/15 border-2 border-secondary rounded-full mx-auto flex items-center justify-center mb-2 shadow-lg">
                <img
                  src="https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah"
                  alt="Sarah Chen"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <p className="text-sm font-semibold text-white">Sarah Chen</p>
              <p className="text-xs text-secondary font-medium flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-ping" />
                Active Speaker
              </p>
            </div>

            {/* Teammate screen-share simulation helper */}
            <div className="absolute top-3 right-3">
              <span className="badge badge-success gap-1 font-semibold text-xs border-0 text-white shadow-md">
                <Sparkles className="size-3" /> Partner
              </span>
            </div>

            {/* Overlay label */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-2">
              <div className="size-2 bg-success rounded-full" />
              <span className="text-xs font-semibold text-white">Sarah Chen</span>
            </div>
          </div>
        </div>

        {/* Video Control Bar */}
        <div className="bg-base-100 p-3 rounded-xl shadow border border-primary/10 flex items-center justify-center gap-3">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`btn btn-circle ${
              isMicOn
                ? "bg-primary text-white border-primary hover:bg-primary/90"
                : "bg-neutral text-neutral-content border-neutral hover:bg-neutral/80"
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>

          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            disabled={isScreenSharing}
            className={`btn btn-circle ${
              isVideoOn && !isScreenSharing
                ? "bg-primary text-white border-primary hover:bg-primary/90"
                : "bg-neutral text-neutral-content border-neutral hover:bg-neutral/80"
            }`}
            title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isVideoOn && !isScreenSharing ? (
              <VideoIcon className="size-5" />
            ) : (
              <VideoOff className="size-5" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`btn btn-circle ${
              isScreenSharing
                ? "bg-secondary text-white border-secondary hover:bg-secondary/90"
                : "bg-neutral text-neutral-content border-neutral hover:bg-neutral/80"
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
          >
            <ScreenShare className="size-5" />
          </button>

          <div className="w-px h-8 bg-base-300 mx-2" />

          <button
            onClick={() => {
              toast.success("Disconnected from call");
              navigate("/dashboard");
            }}
            className="btn btn-circle bg-error hover:bg-error/90 text-white border-error"
            title="Leave Session"
          >
            <PhoneOff className="size-5" />
          </button>
        </div>
      </div>

      {/* Chat Column */}
      <div
        className={`flex flex-col rounded-xl border border-white/10 shadow-xl overflow-hidden bg-neutral-900 transition-all duration-300 ease-in-out ${
          isChatOpen ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        {isChatOpen && (
          <>
            {/* Chat Header */}
            <div className="bg-neutral-950 p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <h3 className="font-bold text-sm text-white">Session Chat</h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
                title="Hide Chat"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderName !== "Sarah Chen (Collaborator)";
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <img
                      src={msg.senderImage}
                      alt={msg.senderName}
                      className="size-8 rounded-full border border-white/10 bg-neutral-800"
                    />
                    <div className="max-w-[75%]">
                      <div className="flex items-center gap-1.5 mb-1 justify-start">
                        <span className={`text-[11px] font-bold ${isMe ? "text-primary" : "text-secondary"}`}>
                          {msg.senderName}
                        </span>
                        <span className="text-[9px] text-white/40">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed break-words ${
                          isMe
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-[#2d3036] text-white rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-neutral-950 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-neutral-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
              />
              <button
                type="submit"
                className="btn btn-square btn-primary btn-sm rounded-xl text-white"
                title="Send Message"
              >
                <Send className="size-3.5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default MockVideoCallUI;
