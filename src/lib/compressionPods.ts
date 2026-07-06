export type CompressionAction = {
  type: "route";
  path: string;
};

export type CompressionSeed = {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  children?: CompressionSeed[];
  action?: CompressionAction;
};

export const COMPRESSION_PODS: CompressionSeed[] = [
  {
    id: "command-core",
    label: "Command Core",
    icon: "⌘",
    keywords: ["jackie", "chat", "command", "control", "tasks", "memory", "home"],
    children: [
      { id: "jackie-chat", label: "Jackie Chat", icon: "💬", keywords: ["chat", "assistant", "messages", "home"], action: { type: "route", path: "/" } },
      { id: "jackie-control", label: "Jackie Control", icon: "🎛️", keywords: ["control", "orchestrator", "audit", "commands"], action: { type: "route", path: "/control" } },
      { id: "vault", label: "Vault", icon: "🗂️", keywords: ["vault", "files", "library", "storage"], action: { type: "route", path: "/vault" } },
      { id: "sphere", label: "Sphere Command", icon: "🛰️", keywords: ["sphere", "command", "operations"], action: { type: "route", path: "/sphere" } },
    ],
  },
  {
    id: "game-realm",
    label: "Game Realm",
    icon: "🐉",
    keywords: ["play", "game", "wallet", "guild", "arena", "market", "quests"],
    children: [
      { id: "game-dashboard", label: "Dashboard", icon: "📊", keywords: ["dashboard", "overview", "realm"], action: { type: "route", path: "/play?tab=dashboard" } },
      { id: "game-arena", label: "Arena", icon: "🃏", keywords: ["arena", "cards", "battle", "duel"], action: { type: "route", path: "/hub?room=cards" } },
      { id: "game-guild", label: "Guild Bank", icon: "🏦", keywords: ["guild", "bank", "clan", "alliance"], action: { type: "route", path: "/play?tab=guildbank" } },
      { id: "game-wallet", label: "Diamond Exchange", icon: "💠", keywords: ["wallet", "diamonds", "exchange", "balance"], action: { type: "route", path: "/play?tab=diamonds" } },
      { id: "game-market", label: "Marketplace", icon: "🏬", keywords: ["market", "marketplace", "trade", "shop"], action: { type: "route", path: "/play?tab=marketplace" } },
      { id: "game-quests", label: "Quests", icon: "📋", keywords: ["quests", "missions", "tasks"], action: { type: "route", path: "/play?tab=quests" } },
      { id: "game-botforge", label: "Bot Forge", icon: "🤖", keywords: ["forge", "bot", "automation"], action: { type: "route", path: "/play?tab=botforge" } },
      { id: "game-jade", label: "Jade Vault", icon: "🏛️", keywords: ["jade", "vault", "store"], action: { type: "route", path: "/play?tab=jadestore" } },
    ],
  },
  {
    id: "telegram-mobile",
    label: "Telegram Mobile",
    icon: "📱",
    keywords: ["telegram", "hub", "security", "music", "creatures", "mobile"],
    children: [
      { id: "tg-hub", label: "Room Hub", icon: "🏠", keywords: ["hub", "rooms", "telegram"], action: { type: "route", path: "/hub?room=hub" } },
      { id: "tg-security", label: "Security Center", icon: "🛡️", keywords: ["security", "protect", "shield"], action: { type: "route", path: "/hub?room=security" } },
      { id: "tg-music", label: "Music Lab", icon: "🎵", keywords: ["music", "audio", "tracks"], action: { type: "route", path: "/hub?room=music" } },
      { id: "tg-creatures", label: "Creature Lab", icon: "��", keywords: ["creatures", "lab", "evolution"], action: { type: "route", path: "/hub?room=creatures" } },
    ],
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    icon: "🤖",
    keywords: ["ai", "bots", "swarm", "keys", "gunit", "flipper", "addons"],
    children: [
      { id: "ai-botfoundry", label: "Bot Foundry", icon: "🏭", keywords: ["bots", "foundry", "assets", "models"], action: { type: "route", path: "/bots" } },
      { id: "ai-swarm", label: "Bot Swarm", icon: "🐝", keywords: ["swarm", "agents", "team"], action: { type: "route", path: "/swarm" } },
      { id: "ai-keys", label: "API Keys", icon: "🔐", keywords: ["keys", "api", "credentials"], action: { type: "route", path: "/keys" } },
      { id: "ai-gunit", label: "Gunit", icon: "🧪", keywords: ["gunit", "bots", "factory", "agents"], action: { type: "route", path: "/gunit" } },
      { id: "ai-flipper", label: "Flipper Widget", icon: "🧿", keywords: ["flipper", "bluetooth", "tools", "compression"], action: { type: "route", path: "/flipper-widget" } },
    ],
  },
];

export function flattenCompressionSeeds(tree: CompressionSeed[] = COMPRESSION_PODS): CompressionSeed[] {
  const out: CompressionSeed[] = [];
  const walk = (nodes: CompressionSeed[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return out;
}

export function findSeedById(id: string, tree: CompressionSeed[] = COMPRESSION_PODS): CompressionSeed | null {
  for (const seed of tree) {
    if (seed.id === id) return seed;
    if (seed.children?.length) {
      const found = findSeedById(id, seed.children);
      if (found) return found;
    }
  }
  return null;
}

export function findSeedPathById(id: string, tree: CompressionSeed[] = COMPRESSION_PODS): CompressionSeed[] {
  const dfs = (nodes: CompressionSeed[], path: CompressionSeed[]): CompressionSeed[] | null => {
    for (const seed of nodes) {
      const next = [...path, seed];
      if (seed.id === id) return next;
      if (seed.children?.length) {
        const child = dfs(seed.children, next);
        if (child) return child;
      }
    }
    return null;
  };
  return dfs(tree, []) ?? [];
}
