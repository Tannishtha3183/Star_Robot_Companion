import React, { useState, useRef, useEffect } from "react";
import { Message, CompanionState, ExpressionType, ChatSession } from "../types";
import { Send, Sparkles, User, Cpu, AlertCircle, RefreshCw, FolderOpen, History, Plus, Trash, Trash2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatPlaygroundProps {
  state: CompanionState;
  expression: ExpressionType;
  onStateChange: (newState: CompanionState) => void;
  onExpressionChange: (newExpression: ExpressionType) => void;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
  theme?: "dark" | "light";
  sessions?: ChatSession[];
  currentSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onClearHistory?: () => void;
}

export const ChatPlayground: React.FC<ChatPlaygroundProps> = ({
  state,
  expression,
  onStateChange,
  onExpressionChange,
  messages,
  onAddMessage,
  theme = "dark",
  sessions = [],
  currentSessionId = "session-default",
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearHistory,
}) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggestion card prompts
  const suggestions = [
    { text: "Can you list country cost comparison metrics in a clear markdown table?", action: "table_query" },
    { text: "Can you show me your happy expression?", action: "set_happy" },
    { text: "Tell me a short, futuristic story about you", action: "story" },
    { text: "What materials are you constructed of?", action: "specs" },
  ];

  // Auto-scroll to lowest message on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, state]);

  // Handle sending message
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || state === "thinking") return;

    setError(null);
    const userText = textToSend;
    setInput("");

    // 1. Add User Message to screen with stable and unique ID tag
    const userMsg: Message = {
      id: `msg-user-${Date.now()}-${Math.random()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    onAddMessage(userMsg);

    // 2. Set State to THINKING (Triggers Star's scanning eyes, tilted head, and glowing particles)
    onStateChange("thinking");

    // Dynamic state adjustment based on suggestions
    const lowerText = userText.toLowerCase();
    if (lowerText.includes("midnight") || lowerText.includes("theme") || lowerText.includes("sunrise") || lowerText.includes("dawn") || lowerText.includes("noon")) {
      // Custom reactive theme switching triggers!
      setTimeout(() => {
        const triggerBtn = document.getElementById("btn-toggle-theme");
        if (triggerBtn) triggerBtn.click();
      }, 500);
    } else if (lowerText.includes("happy") || lowerText.includes("smile")) {
      onExpressionChange("happy");
    }

    try {
      // 3. Request Gemini Response via server endpoint with history context
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: messages }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const data = await response.json();

      // 4. Set state to RESPONDING (Star nods and eyes brighten)
      onStateChange("responding");
      
      if (data.expression) {
        onExpressionChange(data.expression as ExpressionType);
      }

      // Add Star's message to dashboard with stable unique ID
      const starMsg: Message = {
        id: `msg-star-${Date.now()}-${Math.random()}`,
        sender: "star",
        text: data.text || "I was unable to formulate a response.",
        expression: data.expression || "neutral",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      // Slight natural pause for "response" gesture before showing content
      setTimeout(() => {
        onAddMessage(starMsg);
        onStateChange("idle");
      }, 900);

    } catch (err: any) {
      console.error(err);
      setError("Unable to reach Star. Check if server endpoint is running.");
      onStateChange("idle");
    }
  };

  // Quick prompt selection handler
  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  const isDark = theme === "dark";
  const [showSessions, setShowSessions] = useState(true);

  return (
    <div
      id="chat-playground"
      className={`flex flex-col h-full min-h-[500px] backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border transition-all duration-350 ${
        isDark
          ? "bg-meadow-card border-meadow-pine/30 text-meadow-cream shadow-meadow-moss/5"
          : "bg-white border-slate-200 text-slate-800 shadow-slate-200/50"
      }`}
    >
      {/* Companion Status Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between transition-all ${isDark ? "border-meadow-pine/20 bg-meadow-bg/45" : "border-slate-150 bg-slate-50/50"}`}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            {/* Pulsing indicator matching current companion state */}
            <span
              className={`absolute inline-flex h-2.5 w-2.5 rounded-full ${
                state === "thinking"
                  ? "bg-amber-400 animate-ping"
                  : state === "listening"
                  ? "bg-rose-400 animate-pulse"
                  : state === "responding"
                  ? "bg-blue-400 animate-ping"
                  : "bg-blue-500"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                state === "thinking"
                  ? "bg-amber-400"
                  : state === "listening"
                  ? "bg-rose-400"
                  : state === "responding"
                  ? "bg-blue-400"
                  : "bg-blue-500"
              }`}
            />
          </div>
          <div>
            <h4 className={`text-xs font-display font-semibold uppercase tracking-wider ${isDark ? "text-meadow-cream" : "text-slate-900"}`}>
              Star v4.0 Prime
            </h4>
            <p className={`text-[10px] font-mono tracking-tight uppercase ${isDark ? "text-meadow-sage" : "text-slate-500"}`}>
              {state === "thinking"
                ? "thinking state (processing)"
                : state === "listening"
                ? "listening state"
                : state === "responding"
                ? "responding gesture"
                : `idle state — expression: ${expression}`}
            </p>
          </div>
        </div>

        {/* Action Display Badge and Archive control group */}
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <div className="flex items-center gap-1.5 mr-1">
              <button
                type="button"
                onClick={() => setShowSessions(!showSessions)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-mono transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? showSessions 
                      ? "bg-meadow-moss/30 border-meadow-moss/50 text-meadow-cream"
                      : "bg-meadow-bg/60 border-meadow-pine/30 text-meadow-sage hover:text-white"
                    : showSessions 
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800"
                }`}
                title="Toggle Conversation Archive"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden md:inline font-semibold">History ({sessions.length})</span>
              </button>

              <button
                type="button"
                onClick={onNewChat}
                className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1 font-sans transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? "bg-meadow-moss hover:bg-meadow-pine border-transparent text-slate-900 font-bold"
                    : "bg-blue-600 hover:bg-blue-500 border-transparent text-white font-semibold"
                }`}
                title="Initialize Fresh Discussion Thread"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New Chat</span>
              </button>
            </div>
          )}

          <div className={`hidden sm:flex items-center gap-1 border px-2 py-1 rounded-md transition-all ${
            isDark ? "bg-meadow-bg/60 border-meadow-pine/30 text-meadow-cream/90" : "bg-slate-100/80 border-slate-200 text-slate-600"
          }`}>
            <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
            <span className="text-[9.5px] font-mono font-medium uppercase tracking-wider">REAL TIME INTELLIGENCE</span>
          </div>
        </div>
      </div>

      {/* Split main body layout: Sessions Sidebar on Left, Active Chat on Right */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Sessions Sidebar Pane */}
        {showSessions && sessions && sessions.length > 0 && (
          <aside className={`w-full md:w-56 md:border-r border-b md:border-b-0 shrink-0 flex flex-col transition-all h-[180px] md:h-auto overflow-hidden ${
            isDark ? "bg-meadow-card/75 border-meadow-pine/20" : "bg-slate-50/70 border-slate-200"
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? "border-meadow-pine/20 bg-meadow-bg/30 text-meadow-cream" : "border-slate-200 bg-slate-100/80 text-slate-800"
            }`}>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[9px] font-mono tracking-wider uppercase font-semibold">Saved Chats</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
              {sessions.map((s) => {
                const isActive = currentSessionId === s.id;
                return (
                  <div
                    key={`sidebar-${s.id}`}
                    className={`group relative w-full flex items-center transition-all rounded-xl border ${
                      isActive 
                        ? isDark 
                          ? "bg-meadow-bg border-meadow-moss text-meadow-cream font-medium shadow-inner"
                          : "bg-blue-50 border-blue-200 text-blue-800 font-medium shadow-inner"
                        : isDark
                          ? "hover:bg-meadow-bg/35 border-transparent text-meadow-sage"
                          : "hover:bg-slate-100 border-transparent text-slate-600"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSession?.(s.id)}
                      className="flex-1 text-left p-2 pr-7 text-xs transition-all flex flex-col gap-0.5 cursor-pointer min-w-0"
                    >
                      <span className="truncate block w-full font-sans text-[11px] tracking-wide font-medium">
                        {s.title || "Untitled Chat"}
                      </span>
                      <span className="text-[8.5px] opacity-70 font-mono">
                        {new Date(s.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </button>
                    {/* Trash Delete Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession?.(s.id);
                      }}
                      className={`absolute right-1 text-slate-400 hover:text-red-500 rounded-lg p-1.5 transition-colors cursor-pointer ${
                        isActive 
                          ? isDark 
                            ? "hover:bg-meadow-card/80 text-meadow-cream/85" 
                            : "hover:bg-slate-200/80 text-slate-700" 
                          : isDark 
                            ? "hover:bg-meadow-bg text-meadow-sage" 
                            : "hover:bg-slate-200 text-slate-600"
                      }`}
                      title="Delete Individual Chat"
                      id={`btn-delete-session-${s.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clear All History Panel */}
            <div className={`p-2 border-t transition-all ${
              isDark ? "border-meadow-pine/15 bg-meadow-bg/25" : "border-slate-200 bg-slate-50"
            }`}>
              <button
                type="button"
                onClick={onClearHistory}
                className={`w-full py-1.5 px-2.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? "bg-red-950/20 hover:bg-red-900/40 border-red-900/30 text-rose-300"
                    : "bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                }`}
                title="Wipe Local Storage & Delete All History"
                id="btn-clear-history"
              >
                <Trash className="w-3.5 h-3.5" />
                Clear All History
              </button>
            </div>
          </aside>
        )}

        {/* Active Conversation Pane */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent">
          {/* Messages Canvas */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px] min-h-0">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={`msg-box-${msg.id}`}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Profile Orb */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      isUser
                        ? isDark
                          ? "bg-meadow-darkgreen border-meadow-pine/30 text-meadow-cream"
                          : "bg-slate-200 border-slate-300 text-slate-700"
                        : "bg-gradient-to-tr from-meadow-moss to-meadow-pine text-white border-transparent shadow-sm"
                    }`}
                  >
                    {isUser ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Cpu className="w-3.5 h-3.5" />
                    )}
                  </div>
      
                  {/* Message Bubble container */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed transition-all ${
                        isUser
                          ? isDark
                            ? "bg-meadow-moss/30 border border-meadow-moss/60 text-meadow-cream rounded-tr-none"
                            : "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10 border border-blue-500"
                          : isDark
                            ? "bg-meadow-bg/50 text-meadow-cream rounded-tl-none border border-meadow-pine/30"
                            : "bg-slate-100/90 text-slate-800 rounded-tl-none border border-slate-150/80"
                      }`}
                    >
                      {/* Spoken Text */}
                      {isUser ? (
                        <p className="whitespace-pre-line tracking-wide">{msg.text}</p>
                      ) : (
                        <MarkdownRenderer text={msg.text} isDark={isDark} />
                      )}
                    </div>
                    
                    {/* Timestamp and Expressions */}
                    <div
                      className={`flex items-center gap-2 text-[9.5px] font-mono text-slate-500 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && msg.expression && (
                        <>
                          <span>•</span>
                          <span className={`uppercase text-[9px] font-medium px-1 py-0.5 rounded border transition-all ${
                            isDark
                              ? "bg-meadow-bg/80 border-meadow-pine/20 text-meadow-sage"
                              : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                            mood: {msg.expression}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      
            {/* Real-Time Thinking Indicator Bubble */}
            {state === "thinking" && (
              <div className="flex items-start gap-2.5 mr-auto max-w-[85%] animate-fade-in">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border bg-amber-500 text-white border-transparent animate-pulse shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className={`px-4 py-3 rounded-2xl text-xs rounded-tl-none flex items-center gap-2 border border-dashed transition-all ${
                    isDark ? "bg-meadow-bg/70 text-meadow-sage border-meadow-darkgreen/40" : "bg-slate-50 text-slate-600 border-slate-200/80"
                  }`}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    </span>
                    <span className="animate-pulse tracking-wide font-mono text-[10px] uppercase">Star is compiling thought coordinates...</span>
                  </div>
                </div>
              </div>
            )}
      
            <div ref={scrollRef} />
          </div>
      
          {/* Suggestion Chips Panel */}
          {messages.length < 3 && state === "idle" && (
            <div className={`px-5 py-2.5 border-t transition-all ${isDark ? "bg-meadow-bg/40 border-meadow-pine/20" : "bg-slate-50 border-slate-200/50"}`}>
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block mb-2">
                Ask Star To:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={`suggest-${idx}`}
                    id={`suggestion-${idx}`}
                    onClick={() => handleSuggestionClick(s.text)}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-full font-sans transition-all cursor-pointer border ${
                      isDark
                        ? "bg-meadow-darkgreen/35 border-meadow-pine/40 text-meadow-cream hover:bg-meadow-pine/60 hover:text-white"
                        : "bg-white border-slate-200 text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}
      
          {/* Prompt Error Alert */}
          {error && (
            <div className="mx-5 my-2 px-3 py-2 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-[10.5px] leading-snug">{error}</span>
            </div>
          )}
      
          {/* Interactive Form Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            id="prompt-field-form"
            className={`p-4 border-t flex transition-all ${
              isDark ? "border-meadow-pine/20 bg-meadow-bg/45" : "border-slate-200/60 bg-slate-55/40"
            }`}
          >
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                id="prompt-input-box"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  // Trigger ATTENTIVE state on star when prompt focuses!
                  if (state === "idle") {
                    onStateChange("listening");
                  }
                }}
                onBlur={() => {
                  // Revert state back on blur
                  if (state === "listening") {
                    onStateChange("idle");
                  }
                }}
                disabled={state === "thinking"}
                placeholder={
                  state === "thinking"
                    ? "Star is analyzing response..."
                    : "Ask Star something..."
                }
                className={`w-full pr-12 pl-4 py-3 text-xs bg-transparent border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50 ${
                  isDark
                    ? "border-meadow-pine/35 focus:border-meadow-moss/65 placeholder:text-meadow-sage text-meadow-cream bg-meadow-bg/45 animate-fade-in"
                    : "border-slate-300 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 bg-white shadow-xs"
                }`}
              />
              <button
                type="submit"
                id="btn-prompt-submit"
                disabled={!input.trim() || state === "thinking"}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-35 disabled:scale-100 cursor-pointer shadow-sm ${
                  isDark 
                    ? "bg-meadow-moss hover:bg-meadow-pine text-slate-950 font-bold" 
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
