import { useState, useEffect } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { messageApi } from "../lib/api";
import { connectSocket } from "../lib/socket";
import Avatar from "../components/Avatar";

export default 
function ChatView({ user, chatTarget, setView, }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [otherTyping, setOtherTyping] = useState(false);

    useEffect(() => {
        if (!chatTarget?.otherUserId) return;
        setLoading(true);
        messageApi.history(chatTarget.otherUserId).then((d) => setMessages(d.messages || [])).catch(() => setMessages([])).finally(() => setLoading(false));

        const socket = connectSocket();
        function onNew(msg) {
            if (msg.sender === chatTarget.otherUserId || msg.recipient === chatTarget.otherUserId) {
                setMessages((prev) => [...prev, msg]);
            }
        }
        function onSent(msg) { setMessages((prev) => [...prev, msg]); }
        function onTypingStart({ userId }) { if (userId === chatTarget.otherUserId) setOtherTyping(true); }
        function onTypingStop({ userId }) { if (userId === chatTarget.otherUserId) setOtherTyping(false); }

        socket.on("message:new", onNew);
        socket.on("message:sent", onSent);
        socket.on("typing:start", onTypingStart);
        socket.on("typing:stop", onTypingStop);

        return () => {
            socket.off("message:new", onNew);
            socket.off("message:sent", onSent);
            socket.off("typing:start", onTypingStart);
            socket.off("typing:stop", onTypingStop);
        };
    }, [chatTarget?.otherUserId]);

    function handleSend(e) {
        e.preventDefault();
        if (!text.trim()) return;
        const socket = connectSocket();
        socket.emit("message:send", { recipientId: chatTarget.otherUserId, gigId: chatTarget.gigId, text });
        setText("");
    }

    const myId = user?.id || user?._id;

    return (<div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <button onClick={() => setView(user?.role === "client" ? "client" : "freelancer")} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={18}/>
        </button>
        <Avatar initials={(chatTarget?.otherUserName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} color="#1D4ED8" size="sm"/>
        <div>
          <p className="font-semibold text-foreground text-sm">{chatTarget?.otherUserName}</p>
          {chatTarget?.gigTitle && <p className="text-xs text-muted-foreground">Re: {chatTarget.gigTitle}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">No messages yet — say hello!</p>
        ) : (
          messages.map((m, i) => {
            const isMine = m.sender === myId || m.sender?._id === myId;
            return (<div key={m._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMine ? "bg-primary text-white" : "bg-muted text-foreground"}`}>
                  {m.text}
                </div>
              </div>);
          })
        )}
        {otherTyping && <p className="text-xs text-muted-foreground italic">{chatTarget?.otherUserName} is typing…</p>}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 mt-4 pt-4 border-t border-border">
        <input
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => {
              setText(e.target.value);
              const socket = connectSocket();
              socket.emit(e.target.value ? "typing:start" : "typing:stop", { recipientId: chatTarget?.otherUserId });
          }}
        />
        <button type="submit" className="bg-primary text-white rounded-full p-2.5 hover:bg-blue-700 transition-colors">
          <Send size={16}/>
        </button>
      </form>
    </div>);
}
