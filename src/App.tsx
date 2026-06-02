import { useState, useEffect } from "react";
import { CompanionState, ExpressionType, Message, ChatSession } from "./types";
import { CompanionModel } from "./components/CompanionModel";
import { ChatPlayground } from "./components/ChatPlayground";
import { playChocClick, playChirp, playCorePulse, playCompBubble, toggleMute as toggleMuteSfx, getMuteState } from "./utils/audio";
import { Cpu, RotateCcw, ShieldCheck, Plus } from "lucide-react";

export default function App() {
  // Star Companion States
  const [state, setState] = useState<CompanionState>("idle");
  const [expression, setExpression] = useState<ExpressionType>("neutral");

  // Aesthetic App Theme selection (Light / Dark mode toggle)
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [muted, setMuted] = useState(getMuteState());

  // Conversation Log Sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("star_chat_sessions_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load sessions from localStorage", e);
    }

    // Default starting session
    return [
      {
        id: "session-default",
        title: "Standard Gold & Global Markets",
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: "init",
            sender: "star",
            text: "Greetings! I am Star, your responsive AI companion.\n\nMy custom chassis is rendered in real-time with vector layers which respond directly to your actions. For instance, notice how my LED eyes track your cursor! Chat with me on the right to trigger intelligent responses, physical expressions, and mechanical core changes.",
            expression: "happy",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      },
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem("star_chat_current_session_id_v2");
      if (savedId) return savedId;
    } catch (e) {
      console.error("Failed to load active session ID", e);
    }
    return "session-default";
  });

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("star_chat_sessions_v2", JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  }, [sessions]);

  // Save active session ID
  useEffect(() => {
    try {
      localStorage.setItem("star_chat_current_session_id_v2", currentSessionId);
    } catch (e) {
      console.error(e);
    }
  }, [currentSessionId]);

  // Find active session messages
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0] || { id: "session-default", messages: [] };
  const messages = currentSession.messages;

  // Append new message to current active session
  const addMessage = (msg: Message) => {
    setSessions((prevSessions) => {
      // If the current session doesn't exist placeholder-wise, create it on-demand
      const exists = prevSessions.some((s) => s.id === currentSessionId);
      if (!exists) {
        const fallbackSession: ChatSession = {
          id: currentSessionId,
          title: "Companion Session",
          createdAt: new Date().toISOString(),
          messages: [msg],
        };
        return [fallbackSession, ...prevSessions];
      }

      return prevSessions.map((s) => {
        if (s.id === currentSessionId) {
          // Change the title helper based on the user's first prompt text to look elegant inside index list
          let updatedTitle = s.title;
          if (s.messages.length <= 1 && msg.sender === "user") {
            updatedTitle = msg.text.length > 30 ? msg.text.slice(0, 28) + "..." : msg.text;
          }
          return {
            ...s,
            title: updatedTitle,
            messages: [...s.messages, msg],
          };
        }
        return s;
      });
    });
  };

  // Switch session active focus
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setState("idle");
    setExpression("neutral");
  };

  // Start fresh chat session
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Session #${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `init-${Date.now()}`,
          sender: "star",
          text: "My neural registers have been cleared! Let's start a fresh discussion.",
          expression: "excited",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setState("idle");
    setExpression("neutral");
  };

  const handleDeleteSession = (sessionIdToDel: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionIdToDel);
    
    if (updatedSessions.length === 0) {
      const defaultSess = [
        {
          id: "session-default",
          title: "Standard Gold & Global Markets",
          createdAt: new Date().toISOString(),
          messages: [
            {
              id: "init",
              sender: "star",
              text: "Greetings! I am Star, your responsive AI companion.\n\nMy custom chassis is rendered in real-time with vector layers which respond directly to your actions. For instance, notice how my LED eyes track your cursor! Chat with me on the right to trigger intelligent responses, physical expressions, and mechanical core changes.",
              expression: "happy",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ],
        },
      ];
      setSessions(defaultSess);
      setCurrentSessionId("session-default");
    } else {
      setSessions(updatedSessions);
      if (currentSessionId === sessionIdToDel) {
        setCurrentSessionId(updatedSessions[0].id);
      }
    }
    setState("idle");
    setExpression("neutral");
  };

  const handleClearHistory = () => {
    localStorage.removeItem("star_chat_sessions_v2");
    localStorage.removeItem("star_chat_current_session_id_v2");
    
    setSessions([
      {
        id: "session-default",
        title: "Standard Gold & Global Markets",
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: "init",
            sender: "star",
            text: "Greetings! I am Star, your responsive AI companion.\n\nMy custom chassis is rendered in real-time with vector layers which respond directly to your actions. For instance, notice how my LED eyes track your cursor! Chat with me on the right to trigger intelligent responses, physical expressions, and mechanical core changes.",
            expression: "happy",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      },
    ]);
    setCurrentSessionId("session-default");
    setState("idle");
    setExpression("neutral");
  };

  // Robot Tap Feedback Speech Reactions
  const handleRobotTap = (part: string) => {
    let randomTexts: string[] = [];
    let stateChange: CompanionState = "responding";
    let exprChange: ExpressionType = "neutral";

    if (part === "antenna") {
      playChirp();
      exprChange = "excited";
      randomTexts = [
        "Antenna core query matched! Beam signals synchronized with orbital satellites.",
        "That tickles! Re-aligning my long-range transceivers on deep frequency bands.",
        "Wireless telemetry request acknowledged! Current atmospheric status is supreme."
      ];
    } else if (part === "chest") {
      playCorePulse();
      exprChange = "happy";
      randomTexts = [
        "Primary Fusion Core energized! Fusion cells operating at 100% capacity.",
        "A warm wave of kinetic voltage ripples through my mechanical actuators! Thank you.",
        "Accessing central processor registers. Direct cardiac resonance is calibrated!"
      ];
    } else if (part === "ears") {
      playCompBubble();
      exprChange = "thoughtful";
      randomTexts = [
        "Sensory pads pinged! Microphones calibrated. I'm listening to your keystrokes.",
        "Bilateral communication channels configured. Ready for verbal parameters.",
        "Acoustic frequency levels balanced! Sonic arrays operating at peak sensitivity."
      ];
    } else if (part === "head") {
      playChocClick();
      exprChange = "gentle";
      randomTexts = [
        "Star gaze activated! Initiating real-time optical feed processing.",
        "Visor shield integrity verified. Scanning grid coordinates at high resolution.",
        "Optic sensor tracking recalibrated. I see you looking at my mechanical visor frame!"
      ];
    }

    const matchedText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
    
    // Add the robot response directly to the chat log
    setState(stateChange);
    setExpression(exprChange);

    const companionMsg: Message = {
      id: Math.random().toString(),
      sender: "star",
      text: matchedText,
      expression: exprChange,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTimeout(() => {
      addMessage(companionMsg);
      setState("idle");
    }, 450);
  };

  // Outer ambient shadow effect on the robot's pedestal matching our custom moonlit meadow palette
  const getPedestalGlow = () => {
    return isDark
      ? "shadow-meadow-moss/10 border-meadow-pine/35 bg-meadow-card/50"
      : "shadow-sunset-mauve/5 border-sunset-rose/25 bg-white/70";
  };

  const isDark = theme === "dark";

  return (
    <div
      id="root-container"
      className={`min-h-screen transition-colors duration-700 flex flex-col relative overflow-hidden ${
        isDark ? "bg-meadow-bg text-meadow-cream" : "bg-[#fdfaf2] text-sunset-dark"
      }`}
    >
      {/* Immersive Moonlit Meadow/Twilight Silhouette Atmosphere Backdrop */}
      <div
        id="ambient-light"
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{
          background: isDark
            ? `radial-gradient(circle at 30% 35%, rgba(180, 181, 159, 0.22) 0%, rgba(133, 141, 115, 0.12) 45%, rgba(74, 83, 64, 0) 75%), linear-gradient(180deg, #4A5340 0%, #3C4333 100%)`
            : `radial-gradient(circle at 30% 35%, rgba(252, 163, 106, 0.2) 0%, rgba(255, 235, 194, 0.45) 45%, rgba(255, 255, 255, 0) 80%), linear-gradient(180deg, #FFEBC2 0%, #fdf8eb 100%)`,
        }}
      />

      {/* Top Navigation - Custom Sunset Minimalist Bar / Moonlit Meadow Dark Bar */}
      <nav
        id="app-header"
        className={`relative z-20 flex justify-between items-center px-6 md:px-10 py-6 md:py-8 border-b backdrop-blur-md transition-all ${
          isDark ? "border-meadow-pine/20 bg-meadow-bg/40" : "border-sunset-rose/20 bg-[#FFEBC2]/35"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sunset-orange flex items-center justify-center shadow-lg shadow-sunset-orange/20 animate-pulse">
            <div className={`w-3 h-3 rounded-full ${isDark ? "bg-meadow-cream" : "bg-sunset-cream"}`}></div>
          </div>
          <span className={`text-xl font-bold tracking-tight font-display ${isDark ? "text-meadow-cream" : "text-sunset-dark"}`}>STAR.AI</span>
          <span className={`text-[10px] border font-mono font-medium px-2 py-0.5 rounded uppercase tracking-wide hidden sm:inline-block ${
            isDark ? "bg-meadow-darkgreen/40 border-meadow-pine/30 text-meadow-cream/90" : "bg-sunset-orange/15 border-sunset-rose/30 text-sunset-mauve"
          }`}>
            Companion Cores
          </span>
        </div>

        <div className={`flex items-center gap-3 sm:gap-4 md:gap-5 text-xs font-semibold uppercase tracking-widest ${isDark ? "text-meadow-sage" : "text-sunset-mauve"}`}>
          <span className="hidden lg:inline-block hover:text-sunset-orange transition-colors cursor-default select-none">Architecture</span>
          <span className="hidden lg:inline-block hover:text-sunset-orange transition-colors cursor-default select-none">Intelligence</span>
          
          {/* Mute SFX Toggle */}
          <button
            onClick={() => {
              const res = toggleMuteSfx();
              setMuted(res);
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer text-[10px] uppercase font-mono tracking-wide ${
              isDark 
                ? "bg-meadow-darkgreen/30 border-meadow-pine/30 text-meadow-cream hover:bg-meadow-pine/40 hover:text-white" 
                : "bg-white border-sunset-rose/25 text-sunset-mauve hover:bg-sunset-cream/60 hover:text-sunset-dark shadow-sm"
            }`}
            title={muted ? "Unmute Robot synthesized chime responses" : "Mute Robot synthesized chime responses"}
            id="btn-toggle-mute"
          >
            {muted ? "🔇 Muted" : "🔊 Sfx"}
          </button>

          {/* Theme Switcher Toggle (Sunset Light / Moonlit Meadow Dark Mode Selection) */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-2 rounded-xl border transition-all cursor-pointer text-[10px] uppercase font-mono tracking-wide ${
              isDark 
                ? "bg-meadow-darkgreen/30 border-meadow-pine/30 text-meadow-cream hover:bg-meadow-pine/40 hover:text-white" 
                : "bg-white border-sunset-rose/25 text-sunset-mauve hover:bg-sunset-cream/60 hover:text-sunset-dark shadow-sm"
            }`}
            title={`Switch to ${isDark ? "Light Mode" : "Dark Mode"}`}
            id="btn-toggle-theme"
          >
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button
            onClick={handleNewChat}
            className={`px-3 py-1.5 border rounded-xl transition-all cursor-pointer text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 ${
              isDark
                ? "bg-meadow-darkgreen/30 hover:bg-meadow-pine/40 border-meadow-pine/30 text-meadow-cream hover:text-white"
                : "bg-white hover:bg-sunset-cream/60 border-sunset-rose/25 text-sunset-mauve hover:text-sunset-dark shadow-sm"
            }`}
            title="Start New Conversation"
            id="btn-clear-chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </nav>

      {/* Main Core Bilateral Workspace */}
      <main
        id="app-workspace"
        className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start"
      >
        {/* LEFT COLUMN: The Physical Companion Pedestal */}
        <section
          id="companion-dock-column"
          className="lg:col-span-4 flex flex-col gap-6"
        >
          {/* Futuristic Holographic Pedestal Panel */}
          <div
            id="star-pedestal"
            className={`relative backdrop-blur-xl border rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl transition-all duration-1000 ${getPedestalGlow()}`}
          >
            {/* Custom high-end subtle branding stamp */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-55 select-none">
              <div className="w-2 h-2 rounded-full bg-meadow-moss animate-ping" />
              <span className={`text-[9px] font-mono uppercase tracking-widest ${isDark ? "text-meadow-cream/70" : "text-sunset-mauve font-semibold"}`}>
                {isDark ? "Meadow Edition" : "Sunset Edition"}
              </span>
            </div>

            {/* Main Interactive Model Component with sunset-locked shadows */}
            <CompanionModel
              state={state}
              expression={expression}
              onTapPart={handleRobotTap}
            />

            {/* Custom Interactive Floating Label, updates on look trigger */}
            <div
              id="star-status-seal"
              className="mt-2 text-center transition-all duration-350"
            >
              <h2 className={`font-display font-semibold text-xl leading-none tracking-tight ${isDark ? "text-meadow-cream" : "text-sunset-dark"}`}>
                Star
              </h2>
              <p className={`mt-1.5 text-xs uppercase tracking-widest font-mono ${isDark ? "text-meadow-sage" : "text-sunset-mauve/70 font-semibold"}`}>
                {state === "thinking"
                  ? "• PROCESSING PROMPT •"
                  : state === "listening"
                  ? "• ATTENTIVE LISTENING •"
                  : state === "responding"
                  ? "• EXPRESSING RESPONSE •"
                  : "• REAL-TIME TRACKING ACTIVE •"}
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Chat Playground core dialogue panel */}
        <section id="companion-chat-column" className="lg:col-span-8 h-full">
          <ChatPlayground
            state={state}
            expression={expression}
            onStateChange={setState}
            onExpressionChange={setExpression}
            messages={messages}
            onAddMessage={addMessage}
            theme={theme}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            onClearHistory={handleClearHistory}
          />
        </section>
      </main>

      {/* Aesthetic pairing fine footer */}
      <footer
        id="app-footer"
        className={`relative z-10 px-6 md:px-10 py-8 border-t text-center flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] transition-all duration-500 ${
          isDark ? "border-meadow-pine/20 text-meadow-sage bg-meadow-bg/30" : "border-sunset-rose/25 text-sunset-mauve bg-[#FFEBC2]/15"
        }`}
      >
        <div className="space-y-1 text-left">
          <p className={`text-2xl font-light font-display ${isDark ? "text-meadow-cream" : "text-sunset-dark"}`}>Hello, I'm Star.</p>
          <p className={`max-w-sm text-xs leading-relaxed ${isDark ? "text-meadow-cream/70 font-sans" : "text-sunset-mauve/80 font-sans font-medium"}`}>
            Your premium robotic companion designed for intelligent automation, absolute physical reactivity, and boundless curiosity.
          </p>
        </div>
        
        <div className="text-right flex flex-col items-center sm:items-end gap-1.5">
          <p className={`text-[10px] uppercase tracking-widest font-semibold opacity-75 ${isDark ? "text-meadow-moss" : "text-sunset-mauve"}`}>{isDark ? "Moonlit Meadow" : "Sunset Edition"}</p>
          <p className={`text-[9px] ${isDark ? "text-meadow-sage" : "text-sunset-rose/80"}`}>{isDark ? "Calibrated with Moonlit Meadow" : "Calibrated with Sunset Mountains"}</p>
        </div>
      </footer>
    </div>
  );
}
