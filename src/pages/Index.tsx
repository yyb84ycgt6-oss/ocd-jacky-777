import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "jackie";
  content: string;
  timestamp: Date;
  memoryTier?: 1 | 2 | 3;
  securityFlag?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "jackie",
    content: "Core foundation files saved. Identity, behavior rules, memory model, security principles, architecture, roadmap, prompts, and knowledge vault structure — all locked in.\n\nJackie has a spine now. Ready to build on it.",
    timestamp: new Date(),
    memoryTier: 3,
  },
];

const Sidebar = ({ activeFolder, onFolderClick }: { activeFolder: string; onFolderClick: (f: string) => void }) => {
  const folders = [
    { name: "chats/", path: "chats" },
    { name: "notes/", path: "notes" },
    { name: "decisions/", path: "decisions" },
    { name: "transcripts/", path: "transcripts" },
  ];

  const coreFiles = [
    "CORE_IDENTITY.md",
    "BEHAVIOR_RULES.md",
    "MEMORY_MODEL.md",
    "SECURITY_PRINCIPLES.md",
    "ARCHITECTURE.md",
    "ROADMAP.md",
  ];

  return (
    <aside className="w-[280px] min-h-screen border-r border-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-primary tracking-wider">J</span>
          <span className="font-mono text-xs uppercase tracking-widest text-sidebar-foreground">
            Knowledge Vault
          </span>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Knowledge
        </div>
        {folders.map((folder) => (
          <button
            key={folder.path}
            onClick={() => onFolderClick(folder.path)}
            className={`w-full text-left px-2 py-1.5 font-mono text-sm btn-mechanical rounded-sm transition-colors duration-150 ${
              activeFolder === folder.path
                ? "bg-secondary text-foreground"
                : "text-sidebar-foreground hover:bg-secondary/50"
            }`}
          >
            {folder.name}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-1 border-t border-border">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Core
        </div>
        {coreFiles.map((file) => (
          <div
            key={file}
            className="px-2 py-1 font-mono text-xs text-muted-foreground truncate"
          >
            {file}
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-border">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          System_Status: Grounded
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-primary mt-1">
          Memory: Active
        </div>
      </div>
    </aside>
  );
};

const MemoryDots = ({ tier }: { tier: 1 | 2 | 3 }) => (
  <div className="flex gap-1 items-center">
    {[1, 2, 3].map((i) => (
      <span
        key={i}
        className={`memory-dot ${i <= tier ? "active" : ""}`}
      />
    ))}
  </div>
);

const JackieMessage = ({ message }: { message: Message }) => (
  <div className="space-y-3 stagger-enter">
    <div className="flex items-center justify-between">
      <span className="jackie-badge">Jackie here—</span>
      {message.memoryTier && <MemoryDots tier={message.memoryTier} />}
    </div>

    {message.securityFlag && (
      <div className="jackie-security-flag">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider mb-1">
          Critical: {message.securityFlag}
        </div>
      </div>
    )}

    <div className="text-foreground leading-relaxed whitespace-pre-wrap">
      {message.content}
    </div>

    <div className="font-mono text-[10px] text-muted-foreground">
      {message.timestamp.toLocaleTimeString("en-US", { hour12: false })}
    </div>
  </div>
);

const UserMessage = ({ message }: { message: Message }) => (
  <div className="space-y-2">
    <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
      {message.content}
    </div>
    <div className="font-mono text-[10px] text-muted-foreground/50">
      {message.timestamp.toLocaleTimeString("en-US", { hour12: false })}
    </div>
  </div>
);

const Index = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [activeFolder, setActiveFolder] = useState("chats");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    // Simulate Jackie response
    setTimeout(() => {
      const hasSecurityKeyword = input.toLowerCase().includes("api key") || input.toLowerCase().includes("password") || input.toLowerCase().includes("secret");

      const jackieMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "jackie",
        content: hasSecurityKeyword
          ? "I've analyzed what you sent. There's a security concern here — hardcoded credentials should never live in source code. Use environment variables and a secrets manager. Let me show you the safer pattern."
          : "Understood. I've processed that and stored it in the appropriate memory tier. What's the next move?",
        timestamp: new Date(),
        memoryTier: hasSecurityKeyword ? 2 : 1,
        securityFlag: hasSecurityKeyword ? "Hardcoded Secret Detected" : undefined,
      };

      setMessages((prev) => [...prev, jackieMsg]);
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeFolder={activeFolder} onFolderClick={setActiveFolder} />

      <main className="flex-1 flex flex-col">
        {/* Processing bar */}
        {isProcessing && (
          <div className="h-[2px] bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{
                animation: "progressSlide 1.5s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {/* Feed */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[768px] p-4 space-y-6">
            {messages.map((msg) =>
              msg.role === "jackie" ? (
                <JackieMessage key={msg.id} message={msg} />
              ) : (
                <UserMessage key={msg.id} message={msg} />
              )
            )}
          </div>
        </div>

        {/* Command line input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="max-w-[768px]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground select-none">›</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="..."
                className="jackie-input flex-1"
                disabled={isProcessing}
              />
              <span className="font-mono text-xs text-muted-foreground select-none">⏎</span>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        @keyframes progressSlide {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Index;
