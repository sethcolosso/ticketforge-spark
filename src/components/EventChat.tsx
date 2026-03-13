import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_email?: string;
}

const EventChat = ({ eventId, hasTicket }: { eventId: string; hasTicket: boolean }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !hasTicket) return;

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_messages", filter: `event_id=eq.${eventId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, open, hasTicket]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user) return;
    setSending(true);
    await (supabase as any).from("event_messages").insert({
      event_id: eventId,
      user_id: user.id,
      message: newMsg.trim(),
    });
    setNewMsg("");
    setSending(false);
  };

  if (!hasTicket) return null;

  return (
    <div className="border-t border-border pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-heading font-semibold hover:text-primary transition-colors"
      >
        <MessageCircle className="h-5 w-5 text-primary" />
        Event Community Chat
        {messages.length > 0 && (
          <span className="text-xs text-muted-foreground">({messages.length})</span>
        )}
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-border bg-background">
          <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Be the first to say hello! 👋
              </p>
            )}
            {messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {!isMe && (
                      <p className="text-xs font-medium opacity-70 mb-0.5">
                        {msg.user_id.slice(0, 6)}
                      </p>
                    )}
                    <p>{msg.message}</p>
                    <p className="text-[10px] opacity-60 mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={sending}
            />
            <Button size="icon" onClick={handleSend} disabled={sending || !newMsg.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChat;
