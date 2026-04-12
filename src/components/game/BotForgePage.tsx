import { useState } from 'react';
import { useGame } from '@/game/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface BotConfig {
  name: string;
  purpose: 'scout' | 'trader' | 'diplomat' | 'warlord' | 'spy';
  personality: 'aggressive' | 'defensive' | 'balanced' | 'cunning';
  modules: string[];
}

interface CreatedBot {
  id: string;
  name: string;
  purpose: string;
  personality: string;
  status: string;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
  scopes: string[];
}

const PURPOSES = [
  { id: 'scout', icon: '🔭', label: 'Scout Bot', desc: 'Monitors map zones & alerts on threats' },
  { id: 'trader', icon: '💰', label: 'Trade Bot', desc: 'Auto-trades resources at optimal rates' },
  { id: 'diplomat', icon: '🤝', label: 'Diplomat Bot', desc: 'Manages faction relations & treaties' },
  { id: 'warlord', icon: '⚔️', label: 'Warlord Bot', desc: 'Optimizes army composition & tactics' },
  { id: 'spy', icon: '🕵️', label: 'Spy Bot', desc: 'Gathers intel on rival kingdoms' },
] as const;

const PERSONALITIES = [
  { id: 'aggressive', icon: '🔥', label: 'Aggressive' },
  { id: 'defensive', icon: '🛡️', label: 'Defensive' },
  { id: 'balanced', icon: '⚖️', label: 'Balanced' },
  { id: 'cunning', icon: '🦊', label: 'Cunning' },
] as const;

const MODULES = [
  { id: 'resource_monitor', label: '📦 Resource Monitor' },
  { id: 'threat_alert', label: '🚨 Threat Alerts' },
  { id: 'auto_dispatch', label: '🚀 Auto Dispatch' },
  { id: 'market_analysis', label: '📈 Market Analysis' },
  { id: 'alliance_comms', label: '📡 Alliance Comms' },
  { id: 'battle_advisor', label: '⚔️ Battle Advisor' },
];

export default function BotForgePage() {
  const { state } = useGame();
  const { user } = useAuth();
  const [view, setView] = useState<'forge' | 'bots' | 'keys'>('forge');
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<BotConfig>({ name: '', purpose: 'scout', personality: 'balanced', modules: [] });
  const [bots, setBots] = useState<CreatedBot[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const toggleModule = (id: string) => {
    setConfig(c => ({
      ...c,
      modules: c.modules.includes(id) ? c.modules.filter(m => m !== id) : [...c.modules, id],
    }));
  };

  const loadBots = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_bots').select('id, name, purpose, behavior_style, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setBots(data.map(b => ({ ...b, personality: b.behavior_style })));
  };

  const loadKeys = async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke('api-keys/list', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.data?.keys) setKeys(res.data.keys);
    } catch { /* ignore */ }
  };

  const handleViewChange = (v: 'forge' | 'bots' | 'keys') => {
    setView(v);
    if (v === 'bots') loadBots();
    if (v === 'keys') loadKeys();
  };

  const createBot = async () => {
    if (!user || !config.name.trim()) { toast.error('Name your bot, commander!'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('user_bots').insert({
        user_id: user.id,
        name: config.name.trim(),
        purpose: config.purpose,
        platform: 'game',
        behavior_style: config.personality,
        language: 'typescript',
        logic_modules: config.modules,
        api_keys: {},
        status: 'active',
      });
      if (error) throw error;
      toast.success(`🤖 ${config.name} has been forged!`);
      setConfig({ name: '', purpose: 'scout', personality: 'balanced', modules: [] });
      setStep(0);
      handleViewChange('bots');
    } catch (e: any) {
      toast.error(e.message || 'Failed to forge bot');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!user || !newKeyName.trim()) { toast.error('Name your key'); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const res = await supabase.functions.invoke('api-keys/create', {
        body: { name: newKeyName.trim(), scopes: ['bot:create', 'bot:read', 'game:read'] },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.data?.raw_key) {
        setRevealedKey(res.data.raw_key);
        setNewKeyName('');
        toast.success('🔑 API Key forged! Copy it now — it won\'t be shown again.');
        loadKeys();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to create key');
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.functions.invoke('api-keys/revoke', {
        body: { key_id: keyId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      toast.success('Key revoked');
      loadKeys();
    } catch { toast.error('Failed to revoke'); }
  };

  const steps = ['Purpose', 'Personality', 'Modules', 'Name & Deploy'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground flex items-center gap-2">🤖 Bot Forge</h2>
          <p className="text-xs text-muted-foreground">Create AI allies to automate your kingdom</p>
        </div>
        <div className="flex gap-1">
          {(['forge', 'bots', 'keys'] as const).map(v => (
            <button key={v} onClick={() => handleViewChange(v)} className={`px-3 py-1.5 rounded-lg text-xs font-display capitalize transition-colors ${view === v ? 'bg-primary/20 text-primary ring-1 ring-primary/40' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {v === 'forge' ? '⚒️ Forge' : v === 'bots' ? '🤖 My Bots' : '🔑 API Keys'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── FORGE VIEW ── */}
        {view === 'forge' && (
          <motion.div key="forge" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <button key={s} onClick={() => setStep(i)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display transition-colors ${step === i ? 'bg-primary/20 text-primary' : step > i ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground'}`}>
                  <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[9px]">{i + 1}</span>
                  {s}
                </button>
              ))}
            </div>

            {/* Step 0: Purpose */}
            {step === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PURPOSES.map(p => (
                  <button key={p.id} onClick={() => { setConfig(c => ({ ...c, purpose: p.id })); setStep(1); }} className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all ${config.purpose === p.id ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border bg-card hover:border-primary/30'}`}>
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-xs font-display text-foreground">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center">{p.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Personality */}
            {step === 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PERSONALITIES.map(p => (
                  <button key={p.id} onClick={() => { setConfig(c => ({ ...c, personality: p.id })); setStep(2); }} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${config.personality === p.id ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border bg-card hover:border-primary/30'}`}>
                    <span className="text-3xl">{p.icon}</span>
                    <span className="text-xs font-display text-foreground">{p.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Modules */}
            {step === 2 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Select capabilities for your bot:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MODULES.map(m => (
                    <button key={m.id} onClick={() => toggleModule(m.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${config.modules.includes(m.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30'}`}>
                      <span className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] ${config.modules.includes(m.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        {config.modules.includes(m.id) && '✓'}
                      </span>
                      {m.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(3)} className="mt-2 px-4 py-2 bg-primary/20 text-primary rounded-lg text-xs font-display hover:bg-primary/30 transition-colors">
                  Next →
                </button>
              </div>
            )}

            {/* Step 3: Name & Deploy */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Bot Name</label>
                    <input
                      value={config.name}
                      onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                      placeholder="e.g. Shadow Scout Alpha"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      maxLength={50}
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Build Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Purpose:</span> <span className="text-foreground">{PURPOSES.find(p => p.id === config.purpose)?.label}</span></div>
                      <div><span className="text-muted-foreground">Style:</span> <span className="text-foreground capitalize">{config.personality}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Modules:</span> <span className="text-foreground">{config.modules.length > 0 ? config.modules.map(m => MODULES.find(mod => mod.id === m)?.label).join(', ') : 'None'}</span></div>
                    </div>
                  </div>

                  <button onClick={createBot} disabled={loading || !config.name.trim()} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {loading ? '⚙️ Forging...' : '🔨 Forge Bot'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── MY BOTS VIEW ── */}
        {view === 'bots' && (
          <motion.div key="bots" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
            {bots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🤖</p>
                <p className="text-sm text-muted-foreground">No bots forged yet. Head to the Forge!</p>
              </div>
            ) : (
              bots.map(bot => (
                <div key={bot.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{PURPOSES.find(p => p.id === bot.purpose)?.icon || '🤖'}</span>
                    <div>
                      <p className="text-sm font-display text-foreground">{bot.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{bot.purpose} • {bot.personality} • {bot.status}</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${bot.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── API KEYS VIEW ── */}
        {view === 'keys' && (
          <motion.div key="keys" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Create key */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <p className="text-xs font-display text-foreground">🔑 Create API Key</p>
              <p className="text-[10px] text-muted-foreground">Keys allow your bots to securely access game systems</p>
              <div className="flex gap-2">
                <input
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Scout Bot Key)"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={100}
                />
                <button onClick={createApiKey} disabled={loading || !newKeyName.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display hover:brightness-110 disabled:opacity-50">
                  {loading ? '...' : 'Create'}
                </button>
              </div>

              {/* Revealed key */}
              {revealedKey && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-accent font-display">⚠️ Copy this key now — it won't be shown again!</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] text-foreground bg-background rounded px-2 py-1 break-all font-mono">{revealedKey}</code>
                    <button onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success('Copied!'); }} className="text-xs text-primary hover:underline">📋</button>
                  </div>
                  <button onClick={() => setRevealedKey(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Dismiss</button>
                </div>
              )}
            </div>

            {/* Key list */}
            {keys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🔑</p>
                <p className="text-xs text-muted-foreground">No API keys yet</p>
              </div>
            ) : (
              keys.map(k => (
                <div key={k.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-display text-foreground">{k.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{k.prefix}••••••••</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${k.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                    {k.is_active && (
                      <button onClick={() => revokeKey(k.id)} className="text-[10px] text-red-400 hover:text-red-300 hover:underline">Revoke</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
