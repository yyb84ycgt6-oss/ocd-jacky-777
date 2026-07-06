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
  source: string;
  role: string;
};

type MobileKitItem = {
  id: string;
  name: string;
  target: string;
  mode: "on-device" | "hybrid" | "cloud-assisted";
  purpose: string;
};

type FreeAiOption = {
  id: string;
  name: string;
  type: "agent" | "model-runtime" | "ui";
  access: "free-indefinite";
  download: string;
  notes: string;
  launchCommand?: string;
};

type AddOnFeature = {
  id: string;
  name: string;
  category: "hub" | "router" | "agent" | "pipeline" | "gateway" | "workspace";
  download: string;
  requires: {
    wifi: boolean;
    bluetooth: boolean;
    cloud: boolean;
  };
  summary: string;
};

const EXAMPLES = [
  "Telegram bot that converts YouTube links to MP3 and tracks usage",
  "Discord moderation bot with auto-replies and scheduled announcements",
  "Web API that scrapes product prices from 3 stores and returns JSON",
  "Auth-guarded REST API that proxies OpenAI with per-key rate limits",
];

const AI_ASSET_INVENTORY: AiAsset[] = [
  { id: "enchanted", name: "Enchanted", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/01-enchanted.json", source: "https://github.com/gluonfield/enchanted", role: "iOS/macOS Ollama chat app" },
  { id: "llmfarm", name: "LLMFarm", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/02-llmfarm.json", source: "https://github.com/guinmoon/LLMFarm", role: "On-device LLM framework for Apple devices" },
  { id: "foundation-models-framework-lab", name: "Foundation-Models-Framework-Lab", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/03-foundation-models-framework-lab.json", source: "https://github.com/rudrankriyam/Foundation-Models-Framework-Lab", role: "Apple Foundation Models iOS lab" },
  { id: "swiftlm", name: "SwiftLM", category: "Swift/iOS", deployment: "hybrid", priority: "balanced", download: "/assets/suggestions/04-swiftlm.json", source: "https://github.com/SharpAI/SwiftLM", role: "MLX Swift LLM server + iOS app" },
  { id: "hermex", name: "hermex", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/05-hermex.json", source: "https://github.com/uzairansaruzi/hermex", role: "Native iPhone app for Hermes agent" },
  { id: "mlx-swift-chat", name: "mlx-swift-chat", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/06-mlx-swift-chat.json", source: "https://github.com/preternatural-explore/mlx-swift-chat", role: "MLX-based Swift chat client" },
  { id: "foundation-models-playgrounds", name: "Foundation-Models-Playgrounds", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/07-foundation-models-playgrounds.json", source: "https://github.com/IvanCampos/Foundation-Models-Playgrounds", role: "Apple on-device AI playgrounds" },
  { id: "spezillm", name: "SpeziLLM", category: "Swift/iOS", deployment: "hybrid", priority: "balanced", download: "/assets/suggestions/08-spezillm.json", source: "https://github.com/StanfordSpezi/SpeziLLM", role: "Stanford Spezi LLM stack for Swift/iOS" },
  { id: "localllmclient", name: "LocalLLMClient", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/09-localllmclient.json", source: "https://github.com/tattn/LocalLLMClient", role: "Swift local LLM client" },
  { id: "swiftrag", name: "Swiftrag", category: "Swift/iOS", deployment: "hybrid", priority: "balanced", download: "/assets/suggestions/10-swiftrag.json", source: "https://github.com/DonTizi/Swiftrag", role: "RAG in Swift for iOS/macOS + Ollama" },
  { id: "llama-cpp-swift", name: "llama-cpp-swift", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/11-llama-cpp-swift.json", source: "https://github.com/srgtuszy/llama-cpp-swift", role: "Swift wrapper/client for llama.cpp" },
  { id: "volocal", name: "volocal", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/12-volocal.json", source: "https://github.com/fikrikarim/volocal", role: "Local voice/LLM app tooling (Swift)" },
  { id: "openvision", name: "OpenVision", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/13-openvision.json", source: "https://github.com/rayl15/OpenVision", role: "Swift vision/AI app project" },
  { id: "chatgptswiftui", name: "ChatGPTSwiftUI", category: "Swift/iOS", deployment: "cloud", priority: "easy", download: "/assets/suggestions/14-chatgptswiftui.json", source: "https://github.com/alfianlosari/ChatGPTSwiftUI", role: "SwiftUI ChatGPT app starter" },
  { id: "chatgptui", name: "ChatGPTUI", category: "Swift/iOS", deployment: "cloud", priority: "easy", download: "/assets/suggestions/15-chatgptui.json", source: "https://github.com/alfianlosari/ChatGPTUI", role: "iOS ChatGPT UI sample" },
  { id: "aicat", name: "AICat", category: "Swift/iOS", deployment: "cloud", priority: "easy", download: "/assets/suggestions/16-aicat.json", source: "https://github.com/Panl/AICat", role: "AI chat iOS app repo" },
  { id: "chatgpt-chatbot", name: "ChatGPT_Chatbot", category: "Swift/iOS", deployment: "cloud", priority: "easy", download: "/assets/suggestions/17-chatgpt-chatbot.json", source: "https://github.com/motianjun4/ChatGPT_Chatbot", role: "iOS chatbot app in Swift" },
  { id: "gptmessage", name: "GPTMessage", category: "Swift/iOS", deployment: "cloud", priority: "easy", download: "/assets/suggestions/18-gptmessage.json", source: "https://github.com/lhuanyu/GPTMessage", role: "iOS/macOS GPT chat app" },
  { id: "gptalks", name: "GPTalks", category: "Swift/iOS", deployment: "cloud", priority: "easy", download: "/assets/suggestions/19-gptalks.json", source: "https://github.com/SilverMarcs/GPTalks", role: "Swift AI chat app" },
  { id: "swiftchat", name: "swiftchat", category: "Swift/iOS", deployment: "hybrid", priority: "balanced", download: "/assets/suggestions/20-swiftchat.json", source: "https://github.com/zahidkhawaja/swiftchat", role: "Swift chat app with LLM backend support" },
  { id: "ichi", name: "Ichi", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/21-ichi.json", source: "https://github.com/rudrankriyam/Ichi", role: "Swift iOS AI app project" },
  { id: "rllm", name: "RLLM", category: "Swift/iOS", deployment: "hybrid", priority: "balanced", download: "/assets/suggestions/22-rllm.json", source: "https://github.com/DanielZhangyc/RLLM", role: "Swift LLM app/framework repo" },
  { id: "eisonai", name: "eisonAI", category: "Swift/iOS", deployment: "local", priority: "easy", download: "/assets/suggestions/23-eisonai.json", source: "https://github.com/qoli/eisonAI", role: "Swift AI iOS tooling" },
  { id: "xybrid", name: "xybrid", category: "Mobile SDK", deployment: "hybrid", priority: "balanced", download: "/assets/suggestions/24-xybrid.json", source: "https://github.com/xybrid-ai/xybrid", role: "Mobile/on-device AI SDK (includes iOS)" },
  { id: "runanywhere-sdks", name: "Runanywhere SDKs", category: "Mobile SDK", deployment: "hybrid", priority: "balanced", download: "/assets/suggestions/25-runanywhere-sdks.json", source: "https://github.com/RunanywhereAI/runanywhere-sdks", role: "Local/mobile AI toolkit incl. Apple targets" },
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

const FREE_AI_OPTIONS: FreeAiOption[] = [
  { id: "ollama", name: "Ollama", type: "model-runtime", access: "free-indefinite", download: "https://github.com/ollama/ollama", notes: "Local LLM runtime with no subscription requirement." },
  { id: "llama-cpp", name: "llama.cpp", type: "model-runtime", access: "free-indefinite", download: "https://github.com/ggerganov/llama.cpp", notes: "Open-source inference engine for GGUF models." },
  { id: "vllm", name: "vLLM", type: "model-runtime", access: "free-indefinite", download: "https://github.com/vllm-project/vllm", notes: "High-throughput open-source model serving runtime." },
  { id: "open-webui", name: "Open WebUI", type: "ui", access: "free-indefinite", download: "https://github.com/open-webui/open-webui", notes: "Self-hosted UI for local and remote models." },
  { id: "librechat", name: "LibreChat", type: "ui", access: "free-indefinite", download: "https://github.com/danny-avila/LibreChat", notes: "Open-source multi-provider chat UI you can self-host." },
  { id: "anythingllm", name: "AnythingLLM", type: "ui", access: "free-indefinite", download: "https://github.com/Mintplex-Labs/anything-llm", notes: "Local-first AI workspace with RAG." },
  { id: "crewai", name: "CrewAI", type: "agent", access: "free-indefinite", download: "https://github.com/crewAIInc/crewAI", notes: "Agent orchestration framework (open-source core)." },
  { id: "langgraph", name: "LangGraph", type: "agent", access: "free-indefinite", download: "https://github.com/langchain-ai/langgraph", notes: "Stateful multi-agent workflows." },
  { id: "autogen", name: "AutoGen", type: "agent", access: "free-indefinite", download: "https://github.com/microsoft/autogen", notes: "Open-source agent framework from Microsoft." },
  { id: "openhands", name: "OpenHands", type: "agent", access: "free-indefinite", download: "https://github.com/All-Hands-AI/OpenHands", notes: "Open-source coding agent platform." },
  { id: "dify", name: "Dify", type: "agent", access: "free-indefinite", download: "https://github.com/langgenius/dify", notes: "Open-source LLM app/agent platform." },
  { id: "flowise", name: "Flowise", type: "agent", access: "free-indefinite", download: "https://github.com/FlowiseAI/Flowise", notes: "Visual node-based agent builder." },
  { id: "claude-code", name: "Claude Code", type: "agent", access: "free-indefinite", download: "https://ollama.com", notes: "Potential app launch target using Minimax M3 cloud.", launchCommand: "ollama launch claude --model minimax-m3:cloud" },
  { id: "codex-app", name: "Codex App", type: "ui", access: "free-indefinite", download: "https://ollama.com", notes: "Potential app launch target using Minimax M3 cloud.", launchCommand: "ollama launch codex-app --model minimax-m3:cloud" },
  { id: "openclaw", name: "OpenClaw", type: "agent", access: "free-indefinite", download: "https://ollama.com", notes: "Potential app launch target using Minimax M3 cloud.", launchCommand: "ollama launch openclaw --model minimax-m3:cloud" },
  { id: "hermes-agent", name: "Hermes Agent", type: "agent", access: "free-indefinite", download: "https://ollama.com", notes: "Potential app launch target using Minimax M3 cloud.", launchCommand: "ollama launch hermes --model minimax-m3:cloud" },
  { id: "codex", name: "Codex", type: "agent", access: "free-indefinite", download: "https://ollama.com", notes: "Potential app launch target using Minimax M3 cloud.", launchCommand: "ollama launch codex --model minimax-m3:cloud" },
  { id: "opencode", name: "OpenCode", type: "agent", access: "free-indefinite", download: "https://ollama.com", notes: "Potential app launch target using Minimax M3 cloud.", launchCommand: "ollama launch opencode --model minimax-m3:cloud" },
];

const AI_ADDONS: AddOnFeature[] = [
  { id: "cloud-multi-llm-hub", name: "Cloud Multi-LLM Hub", category: "hub", download: "/assets/addons/01-cloud-multi-llm-hub.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Unified cloud hub for multiple LLM providers with fallback support." },
  { id: "intelligent-model-router", name: "Intelligent Model Router", category: "router", download: "/assets/addons/02-intelligent-model-router.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Task-aware routing by latency, cost, and capability." },
  { id: "ios-shortcuts-agent-launcher", name: "iOS Shortcuts Agent Launcher", category: "agent", download: "/assets/addons/03-ios-shortcuts-agent-launcher.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Shortcut-triggered launch and handoff into agent workflows." },
  { id: "voice-controlled-task-agent", name: "Voice-Controlled Task Agent", category: "agent", download: "/assets/addons/04-voice-controlled-task-agent.json", requires: { wifi: true, bluetooth: true, cloud: true }, summary: "Speech-driven task execution with optional device integrations." },
  { id: "mobile-coding-workstation", name: "Mobile Coding Workstation", category: "workspace", download: "/assets/addons/05-mobile-coding-workstation.json", requires: { wifi: true, bluetooth: true, cloud: true }, summary: "Mobile coding interface with AI assistance and cloud sync." },
  { id: "research-summarization-agent-pipeline", name: "Research + Summarization Agent Pipeline", category: "pipeline", download: "/assets/addons/06-research-summarization-agent-pipeline.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Research ingestion plus multi-stage summarization automation." },
  { id: "personal-knowledge-rag-agent", name: "Personal Knowledge RAG Agent", category: "agent", download: "/assets/addons/07-personal-knowledge-rag-agent.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Private RAG agent for indexed personal knowledge." },
  { id: "email-calendar-task-triage-agent", name: "Email/Calendar/Task Triage Agent", category: "agent", download: "/assets/addons/08-email-calendar-task-triage-agent.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Priority triage over communication and scheduling streams." },
  { id: "content-production-agent-pipeline", name: "Content Production Agent Pipeline", category: "pipeline", download: "/assets/addons/09-content-production-agent-pipeline.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Draft-review-publish pipeline orchestration for content teams." },
  { id: "private-secure-ai-gateway", name: "Private Secure AI Gateway", category: "gateway", download: "/assets/addons/10-private-secure-ai-gateway.json", requires: { wifi: true, bluetooth: false, cloud: true }, summary: "Secure policy, routing, and identity gateway for AI traffic." },
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
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [bluetoothAvailable, setBluetoothAvailable] = useState(() => (
    typeof navigator !== "undefined" && "bluetooth" in navigator
  ));
  const codeRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(AI_ASSET_INVENTORY.map(a => a.category)))],
    []
  );

  const filteredAssets = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    return AI_ASSET_INVENTORY.filter((asset) => {
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

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    setBluetoothAvailable("bluetooth" in navigator);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

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
    const blob = new Blob([JSON.stringify(AI_ASSET_INVENTORY, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-assets-top-25.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAssetInventoryCSV = () => {
    const headers = ["id", "name", "category", "deployment", "priority", "role", "download", "source"];
    const rows = AI_ASSET_INVENTORY.map(a => [a.id, a.name, a.category, a.deployment, a.priority, a.role, a.download, a.source]);
    const sanitizeCsvCell = (value: unknown) => String(value).replace(/\r?\n|\r/g, " ");
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(","))
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

  const downloadFreeAiOptionsJSON = () => {
    const blob = new Blob([JSON.stringify(FREE_AI_OPTIONS, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "free-ai-options-indefinite.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAddOnsJSON = () => {
    const blob = new Blob([JSON.stringify(AI_ADDONS, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-addons-and-features.json";
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
                <h3 className="font-display text-lg font-bold">Top 25 Swift/iOS Repository Suggestions</h3>
                <p className="text-xs text-muted-foreground">Exact provided list, each item also stored as an individual app asset file.</p>
              </div>

              {/* Add-ons and feature pack */}
              <div className="rounded-xl border border-border bg-gradient-to-b from-primary/10 to-secondary/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-mono text-[10px] tracking-widest text-primary">ADD-ONS + FEATURES</div>
                    <h3 className="font-display text-lg font-bold">LLM/Agent Add-on Download Pack</h3>
                    <p className="text-xs text-muted-foreground">Includes all 10 requested add-ons and capability requirements.</p>
                  </div>
                  <button onClick={downloadAddOnsJSON} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80">
                    <Download size={12} /> Download add-ons pack
                  </button>
                  <a href="/flipper-widget" className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80">
                    Open Flipper widget
                  </a>
                </div>

                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                    <div className="font-mono text-xs font-bold">Wi-Fi / Network</div>
                    <Tag subtle>{isOnline ? "online" : "offline"}</Tag>
                    <p className="font-mono text-[11px] text-muted-foreground">Connectivity status used for cloud/system routing.</p>
                  </div>
                  <div className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                    <div className="font-mono text-xs font-bold">Bluetooth</div>
                    <Tag subtle>{bluetoothAvailable ? "available" : "not available"}</Tag>
                    <p className="font-mono text-[11px] text-muted-foreground">Browser support check for device integration flows.</p>
                  </div>
                  <div className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                    <div className="font-mono text-xs font-bold">Cloud Systems</div>
                    <Tag subtle>enabled by design</Tag>
                    <p className="font-mono text-[11px] text-muted-foreground">Add-ons include cloud-required route metadata.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  {AI_ADDONS.map((addon) => (
                    <div key={addon.id} className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                      <div className="font-mono text-xs font-bold">{addon.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        <Tag subtle>{addon.category}</Tag>
                        {addon.requires.wifi && <Tag subtle>wifi</Tag>}
                        {addon.requires.bluetooth && <Tag subtle>bluetooth</Tag>}
                        {addon.requires.cloud && <Tag subtle>cloud</Tag>}
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground">{addon.summary}</p>
                      <a
                        href={addon.download}
                        download
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                      >
                        <Download size={11} /> Download add-on file
                      </a>
                    </div>
                  ))}
                </div>
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
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={asset.download}
                      download
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                    >
                      <Download size={11} /> Download asset file
                    </a>
                    <a
                      href={asset.source}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                    >
                      <Download size={11} /> Open source repo
                    </a>
                  </div>
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

          {/* Free AI options */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-secondary/10 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-primary">FREE AI SELECTION</div>
                <h3 className="font-display text-lg font-bold">Indefinitely Free Agent + AI Options</h3>
                <p className="text-xs text-muted-foreground">Only open-source/self-hostable options with no required paid subscription.</p>
              </div>
              <button onClick={downloadFreeAiOptionsJSON} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-mono hover:bg-secondary/80">
                <Download size={12} /> Download free AI list
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {FREE_AI_OPTIONS.map((item) => (
                <div key={item.id} className="p-3 rounded-md border border-border bg-background/50 space-y-1.5">
                  <div className="font-mono text-xs font-bold">{item.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Tag subtle>{item.type}</Tag>
                    <Tag subtle>{item.access}</Tag>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">{item.notes}</p>
                  {item.launchCommand && (
                    <div className="rounded-md border border-border bg-secondary/30 px-2 py-1 space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Launch command</div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="font-mono text-[10px] text-foreground break-all">{item.launchCommand}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.launchCommand ?? "");
                            toast.success("Launch command copied");
                          }}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline shrink-0"
                        >
                          <Copy size={10} /> Copy
                        </button>
                      </div>
                    </div>
                  )}
                  <a
                    href={item.download}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                  >
                    <Download size={11} /> Open project
                  </a>
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
