import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Bot, Sparkles, Code, Download, Copy, ArrowLeft, Check, Loader2,
  Save, Wand2, RefreshCw, ChevronDown,
} from "lucide-react";

type Plan = {
  name: string;
  purpose: string;
  platform: string;
  behaviorStyle: string;
  language: string;
  logicModules: string[];
  rationale?: string;
};

type AiAsset = {
  id: string;
  name: string;
  category: string;
  deployment: "local" | "cloud" | "hybrid";
  priority: "easy" | "balanced" | "power";
  download: string;
  role: string;
};

type MobileKitItem = {
  id: string;
  name: string;
  target: string;
  mode: "on-device" | "hybrid" | "cloud-assisted";
  purpose: string;
};

const EXAMPLES = [
  "Telegram bot that converts YouTube links to MP3 and tracks usage",
  "Discord moderation bot with auto-replies and scheduled announcements",
  "Web API that scrapes product prices from 3 stores and returns JSON",
  "Auth-guarded REST API that proxies OpenAI with per-key rate limits",
];

const AI_ASSETS_25: AiAsset[] = [
  { id: "ollama-llama31-8b", name: "Ollama + Llama 3.1 8B", category: "LLM", deployment: "local", priority: "easy", download: "https://ollama.com/library/llama3.1", role: "Fast local default assistant" },
  { id: "ollama-qwen25-7b", name: "Ollama + Qwen2.5 7B", category: "LLM", deployment: "local", priority: "easy", download: "https://ollama.com/library/qwen2.5", role: "Low-cost multilingual reasoning" },
  { id: "ollama-mistral-7b", name: "Ollama + Mistral 7B", category: "LLM", deployment: "local", priority: "easy", download: "https://ollama.com/library/mistral", role: "Reliable small instruct model" },
  { id: "ollama-gemma2-9b", name: "Ollama + Gemma 2 9B", category: "LLM", deployment: "local", priority: "easy", download: "https://ollama.com/library/gemma2", role: "Efficient local quality model" },
  { id: "ollama-phi3-mini", name: "Ollama + Phi-3 Mini", category: "LLM", deployment: "local", priority: "easy", download: "https://ollama.com/library/phi3", role: "Ultra-light local fallback" },
  { id: "ollama-qwen-coder", name: "Ollama + Qwen2.5-Coder 7B", category: "Code", deployment: "local", priority: "easy", download: "https://ollama.com/library/qwen2.5-coder", role: "Primary local coding assistant" },
  { id: "ollama-deepseek-coder", name: "Ollama + DeepSeek Coder 6.7B", category: "Code", deployment: "local", priority: "easy", download: "https://ollama.com/library/deepseek-coder", role: "Code generation and refactor" },
  { id: "ollama-llama32-3b", name: "Ollama + Llama 3.2 3B", category: "LLM", deployment: "local", priority: "easy", download: "https://ollama.com/library/llama3.2", role: "Fast CPU-friendly chat" },
  { id: "ollama-nomic-embed", name: "Ollama + Nomic Embed Text", category: "Embedding", deployment: "local", priority: "easy", download: "https://ollama.com/library/nomic-embed-text", role: "RAG embedding baseline" },
  { id: "ollama-bge-m3", name: "Ollama + BGE-M3", category: "Embedding", deployment: "local", priority: "easy", download: "https://ollama.com/library/bge-m3", role: "Multilingual retrieval embedding" },
  { id: "llamacpp-qwen14b", name: "llama.cpp + GGUF Qwen2.5 14B", category: "Runtime", deployment: "local", priority: "balanced", download: "https://github.com/ggerganov/llama.cpp", role: "Higher quality local inference" },
  { id: "llamacpp-llama70b", name: "llama.cpp + GGUF Llama 3.1 70B", category: "Runtime", deployment: "hybrid", priority: "power", download: "https://github.com/ggerganov/llama.cpp", role: "Server-grade high quality model" },
  { id: "vllm-qwen32b", name: "vLLM + Qwen2.5 32B", category: "Runtime", deployment: "cloud", priority: "power", download: "https://github.com/vllm-project/vllm", role: "High throughput API serving" },
  { id: "vllm-mixtral", name: "vLLM + Mixtral 8x7B", category: "Runtime", deployment: "cloud", priority: "power", download: "https://github.com/vllm-project/vllm", role: "Balanced MoE cloud serving" },
  { id: "faster-whisper", name: "Faster-Whisper", category: "Audio", deployment: "local", priority: "easy", download: "https://github.com/SYSTRAN/faster-whisper", role: "Speech-to-text pipeline" },
  { id: "piper-tts", name: "Piper TTS", category: "Audio", deployment: "local", priority: "easy", download: "https://github.com/rhasspy/piper", role: "Fast local text-to-speech" },
  { id: "open-webui", name: "Open WebUI", category: "UI", deployment: "local", priority: "easy", download: "https://github.com/open-webui/open-webui", role: "Unified local model interface" },
  { id: "flowise", name: "Flowise", category: "Orchestration", deployment: "local", priority: "easy", download: "https://github.com/FlowiseAI/Flowise", role: "Visual agent-flow builder" },
  { id: "langgraph", name: "LangGraph", category: "Orchestration", deployment: "hybrid", priority: "balanced", download: "https://github.com/langchain-ai/langgraph", role: "Stateful multi-agent graphs" },
  { id: "crewai", name: "CrewAI", category: "Orchestration", deployment: "hybrid", priority: "balanced", download: "https://github.com/crewAIInc/crewAI", role: "Role-based agent teams" },
  { id: "qdrant", name: "Qdrant", category: "VectorDB", deployment: "hybrid", priority: "balanced", download: "https://github.com/qdrant/qdrant", role: "Scalable vector search" },
  { id: "chroma", name: "Chroma", category: "VectorDB", deployment: "local", priority: "easy", download: "https://github.com/chroma-core/chroma", role: "Simple local RAG store" },
  { id: "pgvector", name: "pgvector", category: "VectorDB", deployment: "hybrid", priority: "balanced", download: "https://github.com/pgvector/pgvector", role: "Postgres-native embeddings" },
  { id: "gemini-flash", name: "Gemini 2.5 Flash (fallback)", category: "Cloud API", deployment: "cloud", priority: "easy", download: "https://ai.google.dev", role: "Cheapest fast cloud fallback" },
  { id: "openrouter-lowcost", name: "OpenRouter low-cost route", category: "Cloud API", deployment: "cloud", priority: "easy", download: "https://openrouter.ai", role: "Multi-provider budget fallback" },
];

const MOBILE_KIT: MobileKitItem[] = [
  { id: "ios-pwa", name: "PWA install profile", target: "iPhone 11/12+ Safari", mode: "hybrid", purpose: "Home-screen install, offline shell, app-like UX" },
  { id: "webgpu-fallback", name: "WebGPU/WebAssembly runtime fallback", target: "Modern mobile browsers", mode: "on-device", purpose: "Best-effort local inference with safe fallback" },
  { id: "stt-mobile", name: "Streaming speech-to-text route", target: "iOS + Android", mode: "cloud-assisted", purpose: "Low-latency voice input for mobile agents" },
  { id: "tts-mobile", name: "Adaptive TTS voice route", target: "iOS + Android", mode: "cloud-assisted", purpose: "Agent voice responses tuned for network quality" },
  { id: "rag-mobile", name: "Mobile RAG profile", target: "iPhone/Android", mode: "hybrid", purpose: "Small local cache + cloud vector retrieval" },
  { id: "battery-policy", name: "Battery/thermal policy", target: "iPhone 11/12+ and older devices", mode: "on-device", purpose: "Auto-downgrade models under heat/battery pressure" },
  { id: "network-policy", name: "Network-aware model routing", target: "Any mobile", mode: "hybrid", purpose: "Prefer local on poor signal, cloud on strong network" },
  { id: "secure-keyflow", name: "Secure API key/session flow", target: "All mobile devices", mode: "cloud-assisted", purpose: "No long-lived secrets in client storage" },
];

export default function BotFoundry() {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(true);
  const [assetQuery, setAssetQuery] = useState("");
  const [deploymentFilter, setDeploymentFilter] = useState<"all" | AiAsset["deployment"]>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const codeRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(AI_ASSETS_25.map(a => a.category)))],
    []
  );

  const filteredAssets = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    return AI_ASSETS_25.filter((asset) => {
      if (deploymentFilter !== "all" && asset.deployment !== deploymentFilter) return false;
      if (categoryFilter !== "all" && asset.category !== categoryFilter) return false;
      if (!q) return true;
      return `${asset.name} ${asset.category} ${asset.role}`.toLowerCase().includes(q);
    });
  }, [assetQuery, deploymentFilter, categoryFilter]);

  const generate = useCallback(async () => {
    if (!description.trim()) { toast.error("Describe your bot first"); return; }
    if (!user) { toast.error("Sign in required"); return; }
    setGenerating(true);
    setCode("");
    setPlan(null);
    setSavedId(null);
    try {
      const { data, error } = await supabase.functions.invoke("bot-generate", {
        body: { description: description.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlan(data.plan);
      setCode(data.code || "");
      toast.success("Bot generated");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [description, user]);

  // Auto-save on successful generation
  useEffect(() => {
    if (!code || !plan || !user || savedId) return;
    (async () => {
      setSaving(true);
      try {
        const { data, error } = await supabase.from("user_bots" as any).insert({
          user_id: user.id,
          name: plan.name,
          purpose: plan.purpose,
          platform: plan.platform,
          behavior_style: plan.behaviorStyle,
          language: plan.language,
          logic_modules: plan.logicModules,
          generated_code: code,
          status: "generated",
        } as any).select("id").single();
        if (error) throw error;
        setSavedId((data as any)?.id ?? "saved");
      } catch (e: any) {
        console.error("auto-save failed", e);
      } finally {
        setSaving(false);
      }
    })();
  }, [code, plan, user, savedId]);

  // Scroll to result when code arrives
  useEffect(() => {
    if (code && codeRef.current) {
      codeRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied");
    } catch { toast.error("Copy failed"); }
  };

  const download = () => {
    if (!plan) return;
    const ext = plan.language === "nodejs" ? "ts" : "py";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.name.replace(/\s+/g, "-").toLowerCase()}-bot.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAssetInventoryJSON = () => {
    const blob = new Blob([JSON.stringify(AI_ASSETS_25, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-assets-top-25.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAssetInventoryCSV = () => {
    const headers = ["id", "name", "category", "deployment", "priority", "role", "download"];
    const rows = AI_ASSETS_25.map(a => [a.id, a.name, a.category, a.deployment, a.priority, a.role, a.download]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-assets-top-25.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMobileKitJSON = () => {
    const blob = new Blob([JSON.stringify(MOBILE_KIT, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mobile-ai-kit.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <a href="/" className="p-2 rounded-md hover:bg-secondary transition-colors">
          <ArrowLeft size={16} className="text-muted-foreground" />
        </a>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot size={20} className="text-primary" />
            <Sparkles size={10} className="absolute -top-1 -right-1 text-primary animate-pulse" />
          </div>
          <h1 className="font-mono text-sm font-bold tracking-wide">Bot Foundry</h1>
          <span className="px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary font-mono text-[9px] tracking-widest">
            AUTO
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

          {/* Hero */}
          <div className="text-center space-y-2 pt-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Describe a bot. <span className="text-primary">Get a bot.</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              One prompt. AI infers the platform, language, and modules — and ships production-ready code.
            </p>
          </div>

          {/* AI asset inventory */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-secondary/10 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-primary">ASSET INVENTORY</div>
                <h3 className="font-display text-lg font-bold">Top 25 Stack Assets</h3>
                <p className="text-xs text-muted-foreground">Prioritized: easy local first, then low-cost cloud fallback.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadAssetInventoryJSON} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80">
                  <Download size={12} /> JSON
                </button>
                <button onClick={downloadAssetInventoryCSV} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80">
                  <Download size={12} /> CSV
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-2">
              <input
                value={assetQuery}
                onChange={(e) => setAssetQuery(e.target.value)}
                placeholder="Search assets..."
                className="px-3 py-2 rounded-md bg-background/60 border border-border font-mono text-xs focus:outline-none focus:border-primary/60"
              />
              <select
                value={deploymentFilter}
                onChange={(e) => setDeploymentFilter(e.target.value as "all" | AiAsset["deployment"])}
                className="px-3 py-2 rounded-md bg-background/60 border border-border font-mono text-xs focus:outline-none focus:border-primary/60"
              >
                <option value="all">All deployments</option>
                <option value="local">Local</option>
                <option value="cloud">Cloud</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-md bg-background/60 border border-border font-mono text-xs focus:outline-none focus:border-primary/60"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All categories" : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                  <div className="font-mono text-xs font-bold">{asset.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Tag subtle>{asset.category}</Tag>
                    <Tag subtle>{asset.deployment}</Tag>
                    <Tag subtle>{asset.priority}</Tag>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">{asset.role}</p>
                  <a
                    href={asset.download}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                  >
                    <Download size={11} /> Download source
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile integration pack */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-primary/10 to-secondary/10 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-primary">MOBILE INTEGRATION KIT</div>
                <h3 className="font-display text-lg font-bold">iPhone 11/12+ & Cross-Mobile AI Ready</h3>
                <p className="text-xs text-muted-foreground">Prepared routes and policies for iOS and other mobile devices.</p>
              </div>
              <button onClick={downloadMobileKitJSON} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80">
                <Download size={12} /> Download mobile kit
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {MOBILE_KIT.map((item) => (
                <div key={item.id} className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                  <div className="font-mono text-xs font-bold">{item.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Tag subtle>{item.target}</Tag>
                    <Tag subtle>{item.mode}</Tag>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">{item.purpose}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt card */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-secondary/10 p-1 shadow-lg shadow-primary/5">
            <div className="rounded-[10px] bg-background/60 backdrop-blur-sm">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A Telegram bot that converts YouTube links to MP3 and remembers user history..."
                rows={4}
                maxLength={1000}
                disabled={generating}
                className="w-full px-4 py-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none rounded-t-[10px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
                }}
              />
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/50">
                <span className="font-mono text-[10px] text-muted-foreground">
                  ⌘/Ctrl + Enter
                </span>
                <button
                  onClick={generate}
                  disabled={generating || !description.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold hover:bg-primary/90 disabled:opacity-40 transition-all hover:shadow-md hover:shadow-primary/30"
                >
                  {generating ? (
                    <><Loader2 size={14} className="animate-spin" /> Building...</>
                  ) : (
                    <><Wand2 size={14} /> Generate</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick examples */}
          {!code && !generating && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">TRY ONE</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setDescription(ex)}
                    className="text-left p-3 rounded-md border border-border bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generating skeleton */}
          {generating && (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 rounded-md bg-secondary/40" />
              <div className="h-64 rounded-md bg-secondary/30" />
            </div>
          )}

          {/* Plan card */}
          {plan && (
            <div ref={codeRef} className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-primary">AI BLUEPRINT</div>
                  <h3 className="font-display text-lg font-bold mt-0.5">{plan.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {savedId ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-sm bg-primary/15 text-primary">
                      <Check size={10} /> Saved
                    </span>
                  ) : saving ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-sm bg-secondary text-muted-foreground">
                      <Loader2 size={10} className="animate-spin" /> Saving
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{plan.purpose}</p>
              <div className="flex flex-wrap gap-1.5">
                <Tag>{plan.platform}</Tag>
                <Tag>{plan.language === "nodejs" ? "Node.js / TS" : "Python"}</Tag>
                <Tag>{plan.behaviorStyle}</Tag>
                {plan.logicModules.map((m) => (
                  <Tag key={m} subtle>{m}</Tag>
                ))}
              </div>
              {plan.rationale && (
                <p className="font-mono text-[11px] text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                  {plan.rationale}
                </p>
              )}
            </div>
          )}

          {/* Code output */}
          {code && (
            <div className="space-y-3 animate-in fade-in duration-500">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-primary" />
                <span className="font-mono text-xs font-bold flex-1">Generated Project</span>
                <button onClick={() => setShowCode((s) => !s)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80 transition-colors">
                  <ChevronDown size={12} className={`transition-transform ${showCode ? "" : "-rotate-90"}`} /> {showCode ? "Hide" : "Show"}
                </button>
                <button onClick={copy} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80 transition-colors">
                  <Copy size={12} /> Copy
                </button>
                <button onClick={download} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80 transition-colors">
                  <Download size={12} /> Download
                </button>
                <button onClick={generate} className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary text-xs font-mono hover:bg-primary/25 transition-colors">
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>
              {showCode && (
                <div className="max-h-[60vh] overflow-auto rounded-md border border-border bg-secondary/20">
                  <div className="p-4">
                    <MarkdownRenderer content={"```\n" + code + "\n```"} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Tag({ children, subtle = false }: { children: React.ReactNode; subtle?: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] tracking-wide ${
      subtle
        ? "bg-secondary text-muted-foreground border border-border"
        : "bg-primary/15 text-primary border border-primary/30"
    }`}>
      {children}
    </span>
  );
}
