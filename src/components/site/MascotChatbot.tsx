import { useState, useEffect, useRef, type FormEvent } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageSquare, X, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { chatWithMascotFn } from "@/server/chat";
import { getPublishedEvents, type DatabaseEvent } from "@/lib/supabase";
import yepeebotImg from "@/assets/Yepeebot.png";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "What programs does YEP offer?",
  "Are there any upcoming events?",
  "How can I join the community?",
  "What is the Bachelor's Pathway?",
];

export function MascotChatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventsCache, setEventsCache] = useState<DatabaseEvent[]>([]);
  const [hasPrompted, setHasPrompted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! 👋 I'm Yepee, your YEP Pathway Guide. How can I assist you today with our educational pathways, mentorship, or upcoming events?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Preload published events context once
  useEffect(() => {
    let isMounted = true;
    getPublishedEvents()
      .then((data) => {
        if (isMounted) setEventsCache(data);
      })
      .catch(() => {
        // Ignore fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Do not display chatbot on the admin dashboard to avoid obstructing admin controls
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const handleSend = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setHasPrompted(true);

    try {
      const response = await chatWithMascotFn({
        data: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          publishedEvents: eventsCache,
        },
      });

      const replyContent =
        response?.reply ||
        "I'm sorry, I couldn't process your request right now. Please try again or visit our Contact page.";

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: replyContent,
        },
      ]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "I encountered a temporary connection issue. Please feel free to reach out to our team directly via our [Contact](/contact) page or Telegram (@yaeleducationalpathway).",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <aside aria-label="YEP Mascot Assistant" className="fixed bottom-5 right-5 z-40">
      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="surface-card mb-4 flex h-[520px] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden shadow-lift border border-border animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-card flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 overflow-hidden">
                <img
                  src={yepeebotImg}
                  alt="YepeeBot Mascot"
                  className="size-7 object-contain"
                />
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">YepeeBot</h3>
                <p className="text-[11px] text-muted-foreground">Official YEP Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: "welcome",
                      role: "assistant",
                      content:
                        "Hello! 👋 I'm Yepee, your YEP Pathway Guide. How can I assist you today with our educational pathways, mentorship, or upcoming events?",
                    },
                  ])
                }
                title="Restart chat"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mt-0.5 overflow-hidden">
                    <img src={yepeebotImg} alt="YepeeBot" className="size-5 object-contain" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 leading-relaxed text-xs sm:text-sm ${m.role === "user"
                    ? "bg-gradient-brand text-primary-foreground font-medium rounded-br-xs"
                    : "bg-muted/70 text-foreground border border-border/60 rounded-bl-xs whitespace-pre-line"
                    }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs pl-9">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>YEP Guide is thinking...</span>
              </div>
            )}

            {/* Prompt suggestions if early in conversation */}
            {!hasPrompted && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Suggested Questions:
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="text-left rounded-xl border border-border bg-card/70 px-3 py-2 text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer input form */}
          <form
            onSubmit={onSubmit}
            className="border-t border-border bg-card p-3 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              maxLength={1000}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-gradient-brand flex size-9 items-center justify-center rounded-full text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Mascot Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex size-14 items-center justify-center rounded-full bg-card border-2 border-primary shadow-lift transition-all duration-300 hover:scale-105 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open YEP Pathway Guide chat"
        >
          {/* Subtle glowing ring */}
          <span className="absolute -inset-1 rounded-full bg-primary/20 blur-sm group-hover:bg-primary/30 transition-all" />

          {/* Mascot icon */}
          <img
            src={yepeebotImg}
            alt="YepeeBot Mascot"
            className="relative size-10 object-contain transition-transform duration-300 group-hover:scale-110"
          />

          {/* Indicator badge */}
          <span className="absolute top-0 right-0 flex size-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-3.5 rounded-full bg-primary" />
          </span>

          {/* Hover tooltip label */}
          <span className="pointer-events-none absolute right-16 hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-foreground shadow-soft group-hover:block">
            Chat with Yepee
          </span>
        </button>
      )}
    </aside>
  );
}

