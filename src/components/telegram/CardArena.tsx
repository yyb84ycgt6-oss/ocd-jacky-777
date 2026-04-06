import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { haptic } from '@/lib/telegram';
import {
  ArrowLeft, Layers, Swords, Trophy, Star, Sparkles, Crown,
  Shield, Zap, Heart, Plus, Minus, RotateCcw, Play, Pause,
  ChevronRight, Target, Flame, Droplets, Wind, Mountain, Sun, Moon
} from 'lucide-react';
import {
  type CardDef, type CardRarity, type CardElement, type Lane, type BattleUnit, type BattleState, type BoardState,
  BALANCE_CONSTANT, RARITY_BONUS,
  cardBudget, unitValue, manaEfficiency, comboMultiplier, comboEffect,
  boardScore, lanePower, createBattleState, applyDamage, resolveClash,
  tickStatuses, drawCards, hasShield, rollCrit, critChance, critDamage,
  roundWinner, ELEMENT_ADVANTAGE,
} from '@/game/cardEngine';
import { STARTER_CARDS, buildFactionDeck, FACTIONS, FACTION_ICONS } from '@/game/cardData';

// ── UI Constants ──
type ArenaTab = 'collection' | 'deck' | 'battle' | 'open';

const RARITY_CONFIG: Record<CardRarity, { label: string; color: string; glow: string; bg: string }> = {
  common:    { label: 'Common',    color: 'hsl(0,0%,65%)',      glow: 'none',                                    bg: 'hsl(0,0%,20%)' },
  uncommon:  { label: 'Uncommon',  color: 'hsl(140,60%,50%)',   glow: '0 0 8px hsl(140,60%,50%,0.3)',            bg: 'hsl(140,30%,15%)' },
  rare:      { label: 'Rare',      color: 'hsl(210,80%,60%)',   glow: '0 0 12px hsl(210,80%,60%,0.4)',           bg: 'hsl(210,40%,15%)' },
  epic:      { label: 'Epic',      color: 'hsl(280,70%,60%)',   glow: '0 0 16px hsl(280,70%,60%,0.5)',           bg: 'hsl(280,35%,15%)' },
  legendary: { label: 'Legendary', color: 'hsl(45,90%,55%)',    glow: '0 0 20px hsl(45,90%,55%,0.5)',            bg: 'hsl(45,50%,12%)' },
  mythic:    { label: 'Mythic',    color: 'hsl(330,80%,60%)',   glow: '0 0 24px hsl(330,80%,60%,0.6)',           bg: 'hsl(330,40%,12%)' },
};

const ELEMENT_ICONS: Record<CardElement, string> = {
  fire: '🔥', water: '💧', earth: '🪨', air: '💨', shadow: '🌑', light: '✨',
};

const TYPE_ICONS: Record<string, string> = { unit: '⚔', spell: '✦', relic: '◆' };

// ── Card Display ──
function MiniCard({ card, compact, onTap, selected, showBudget }: {
  card: CardDef; compact?: boolean; onTap?: () => void; selected?: boolean; showBudget?: boolean;
}) {
  const rc = RARITY_CONFIG[card.rarity];
  const budget = cardBudget(card.cost, card.rarity);
  const value = unitValue(card);
  const eff = manaEfficiency(card);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={() => { haptic.light(); onTap?.(); }}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${selected ? 'ring-2 ring-primary' : ''}`}
      style={{ background: rc.bg, boxShadow: selected ? rc.glow : 'none' }}
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: rc.color }}>{rc.label}</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground">{TYPE_ICONS[card.type]}</span>
            <span className="text-xs">{ELEMENT_ICONS[card.element]}</span>
          </div>
        </div>
        {/* Cost orb */}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center">
          <span className="text-[10px] font-black text-primary-foreground">{card.cost}</span>
        </div>
        <div className="text-center text-3xl my-2">{card.art}</div>
        <p className="text-xs font-bold text-foreground truncate text-center">{card.name}</p>
        {!compact && (
          <>
            {card.faction && <p className="text-[9px] text-muted-foreground text-center">{FACTION_ICONS[card.faction] || ''} {card.faction}</p>}
            {card.type === 'unit' && (
              <div className="flex justify-between mt-2 text-[10px]">
                <span className="flex items-center gap-0.5"><Swords size={10} className="text-red-400" />{card.power}</span>
                <span className="flex items-center gap-0.5"><Shield size={10} className="text-blue-400" />{card.guard}</span>
                {card.lane && <span className="text-muted-foreground">{card.lane}</span>}
              </div>
            )}
            <div className="mt-2 p-1.5 rounded bg-black/30 border border-white/5">
              <p className="text-[10px] font-semibold text-foreground flex items-center gap-1"><Zap size={9} />{card.ability}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{card.abilityDesc}</p>
            </div>
            {showBudget && (
              <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
                <span>Budget: {budget.toFixed(1)}</span>
                <span>Value: {value.toFixed(1)}</span>
                <span>Eff: {eff.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Battle Unit on Board ──
function BoardUnit({ unit, isEnemy, onTap, selected }: { unit: BattleUnit; isEnemy?: boolean; onTap?: () => void; selected?: boolean }) {
  const rc = RARITY_CONFIG[unit.def.rarity];
  const statusIcons = unit.statuses.map(s => {
    switch (s.type) {
      case 'burn': return '🔥';
      case 'frost': return '❄️';
      case 'poison': return '☠️';
      case 'shield': return '🛡️';
      case 'bleed': return '🩸';
      default: return '';
    }
  }).join('');

  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      onClick={() => { haptic.light(); onTap?.(); }}
      className={`p-1.5 rounded-lg cursor-pointer transition-all min-w-[60px] text-center ${selected ? 'ring-2 ring-yellow-400' : ''} ${isEnemy ? 'border border-red-500/30' : 'border border-green-500/30'}`}
      style={{ background: rc.bg }}
    >
      <span className="text-lg">{unit.def.art}</span>
      <div className="flex items-center justify-center gap-1 text-[9px] mt-0.5">
        <span className="text-red-400 font-bold">{unit.currentPower}</span>
        <span className="text-blue-400 font-bold">{unit.currentGuard}</span>
      </div>
      {statusIcons && <p className="text-[8px]">{statusIcons}</p>}
    </motion.div>
  );
}

// ── Lane Row ──
function LaneRow({ label, playerUnits, enemyUnits, onPlayerUnitTap, onEnemyUnitTap, selectedPlayer, selectedEnemy }: {
  label: string;
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  onPlayerUnitTap?: (idx: number) => void;
  onEnemyUnitTap?: (idx: number) => void;
  selectedPlayer?: number;
  selectedEnemy?: number;
}) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="text-[8px] text-muted-foreground w-8 text-right shrink-0">{label}</span>
      {/* Enemy side */}
      <div className="flex-1 flex gap-1 justify-end min-h-[48px] items-center">
        {enemyUnits.map((u, i) => (
          <BoardUnit key={u.instanceId} unit={u} isEnemy selected={selectedEnemy === i} onTap={() => onEnemyUnitTap?.(i)} />
        ))}
        {enemyUnits.length === 0 && <div className="w-12 h-12 rounded border border-dashed border-red-500/10" />}
      </div>
      <div className="w-px h-10 bg-border mx-1" />
      {/* Player side */}
      <div className="flex-1 flex gap-1 min-h-[48px] items-center">
        {playerUnits.map((u, i) => (
          <BoardUnit key={u.instanceId} unit={u} selected={selectedPlayer === i} onTap={() => onPlayerUnitTap?.(i)} />
        ))}
        {playerUnits.length === 0 && <div className="w-12 h-12 rounded border border-dashed border-green-500/10" />}
      </div>
    </div>
  );
}

// ── Battle Screen ──
function BattleScreen({ playerFaction, onExit }: { playerFaction: string; onExit: () => void }) {
  const enemyFaction = useMemo(() => {
    const others = FACTIONS.filter(f => f !== playerFaction);
    return others[Math.floor(Math.random() * others.length)];
  }, [playerFaction]);

  const [battle, setBattle] = useState<BattleState>(() =>
    createBattleState(buildFactionDeck(playerFaction), buildFactionDeck(enemyFaction))
  );
  const [selectedHandIdx, setSelectedHandIdx] = useState<number | null>(null);
  const [targetLane, setTargetLane] = useState<Lane | null>(null);
  const [selectedPlayerUnit, setSelectedPlayerUnit] = useState<{ lane: Lane; idx: number } | null>(null);
  const [selectedEnemyUnit, setSelectedEnemyUnit] = useState<{ lane: Lane; idx: number } | null>(null);
  const [roundScores, setRoundScores] = useState<{ player: number; enemy: number }>({ player: 0, enemy: 0 });
  const [battleLog, setBattleLog] = useState<string[]>(['⚔ Battle begins!']);

  const addLog = (msg: string) => setBattleLog(prev => [...prev.slice(-20), msg]);

  const playerScore = boardScore(battle.player.board);
  const enemyScore = boardScore(battle.enemy.board);

  // Play card from hand
  const playCard = useCallback((handIdx: number, lane: Lane) => {
    setBattle(prev => {
      const card = prev.player.hand[handIdx];
      if (!card || card.cost > prev.player.energy) return prev;

      const newHand = [...prev.player.hand];
      newHand.splice(handIdx, 1);
      const newEnergy = prev.player.energy - card.cost;
      const cardsPlayed = prev.player.cardsPlayedThisTurn + 1;

      if (card.type === 'unit') {
        const unit: BattleUnit = {
          instanceId: `p_${Date.now()}_${Math.random()}`,
          def: card,
          currentPower: card.power,
          currentGuard: card.guard,
          statuses: [],
          comboCount: cardsPlayed - 1,
          lane,
        };
        // Apply combo bonus
        if (cardsPlayed > 1) {
          const mult = comboMultiplier(cardsPlayed - 1);
          unit.currentPower = Math.round(card.power * mult);
          addLog(`${card.name} combo ×${mult.toFixed(2)} → ${unit.currentPower}P`);
        } else {
          addLog(`${card.name} deployed to ${lane}`);
        }
        const newBoard = { ...prev.player.board };
        newBoard[lane] = [...newBoard[lane], unit];
        return { ...prev, player: { ...prev.player, hand: newHand, energy: newEnergy, board: newBoard, cardsPlayedThisTurn: cardsPlayed } };
      }

      if (card.type === 'spell') {
        addLog(`${card.name} cast! ${card.abilityDesc}`);
        // Simple spell: deal abilityValue as damage to strongest enemy
        const allEnemyUnits = [...prev.enemy.board.front, ...prev.enemy.board.mid, ...prev.enemy.board.back];
        if (allEnemyUnits.length > 0) {
          const target = allEnemyUnits.reduce((best, u) => u.currentPower > best.currentPower ? u : best);
          const dmg = Math.round(card.abilityValue * 0.6);
          applyDamage(target, dmg);
          addLog(`→ ${target.def.name} takes ${dmg} damage`);
          // Clean destroyed
          const cleanBoard = (board: BoardState): BoardState => ({
            front: board.front.filter(u => u.currentPower > 0),
            mid: board.mid.filter(u => u.currentPower > 0),
            back: board.back.filter(u => u.currentPower > 0),
          });
          return { ...prev, player: { ...prev.player, hand: newHand, energy: newEnergy, cardsPlayedThisTurn: cardsPlayed }, enemy: { ...prev.enemy, board: cleanBoard(prev.enemy.board) } };
        }
        return { ...prev, player: { ...prev.player, hand: newHand, energy: newEnergy, cardsPlayedThisTurn: cardsPlayed } };
      }

      if (card.type === 'relic') {
        addLog(`${card.name} activated! ${card.abilityDesc}`);
        // Relic: buff all frontline allies
        const newBoard = { ...prev.player.board };
        newBoard.front = newBoard.front.map(u => ({ ...u, currentPower: u.currentPower + 1 }));
        return { ...prev, player: { ...prev.player, hand: newHand, energy: newEnergy, board: newBoard, cardsPlayedThisTurn: cardsPlayed } };
      }

      return prev;
    });
    setSelectedHandIdx(null);
    setTargetLane(null);
    haptic.medium();
  }, []);

  // Clash: player unit vs enemy unit
  const initiateClash = useCallback(() => {
    if (!selectedPlayerUnit || !selectedEnemyUnit) return;
    setBattle(prev => {
      const pLane = prev.player.board[selectedPlayerUnit.lane];
      const eLane = prev.enemy.board[selectedEnemyUnit.lane];
      const attacker = pLane[selectedPlayerUnit.idx];
      const defender = eLane[selectedEnemyUnit.idx];
      if (!attacker || !defender) return prev;

      const result = resolveClash(attacker, defender);
      result.log.forEach(l => addLog(l));

      const cleanLane = (units: BattleUnit[]) => units.filter(u => u.currentPower > 0);
      const newPlayerBoard = { ...prev.player.board };
      const newEnemyBoard = { ...prev.enemy.board };
      newPlayerBoard[selectedPlayerUnit.lane] = cleanLane(newPlayerBoard[selectedPlayerUnit.lane]);
      newEnemyBoard[selectedEnemyUnit.lane] = cleanLane(newEnemyBoard[selectedEnemyUnit.lane]);

      return { ...prev, player: { ...prev.player, board: newPlayerBoard }, enemy: { ...prev.enemy, board: newEnemyBoard } };
    });
    setSelectedPlayerUnit(null);
    setSelectedEnemyUnit(null);
    haptic.heavy();
  }, [selectedPlayerUnit, selectedEnemyUnit]);

  // End turn: AI plays, resolve statuses, new turn
  const endTurn = useCallback(() => {
    setBattle(prev => {
      let newState = { ...prev };
      addLog('── Your turn ends ──');

      // Tick player statuses
      const tickBoard = (board: BoardState): BoardState => {
        const tick = (units: BattleUnit[]) => units.map(u => {
          const res = tickStatuses(u);
          if (res.damage > 0) applyDamage(u, res.damage);
          res.log.forEach(l => addLog(l));
          return u;
        }).filter(u => u.currentPower > 0);
        return { front: tick(board.front), mid: tick(board.mid), back: tick(board.back) };
      };

      newState.player = { ...newState.player, board: tickBoard(newState.player.board) };

      // AI turn: play cards
      addLog('── Enemy turn ──');
      let aiEnergy = newState.enemy.energy;
      const aiHand = [...newState.enemy.hand];
      const aiBoard = { ...newState.enemy.board };
      let aiPlayed = 0;
      const playable = aiHand.filter(c => c.cost <= aiEnergy && c.type === 'unit').sort((a, b) => b.cost - a.cost);

      for (const card of playable) {
        if (card.cost > aiEnergy) continue;
        const lane = card.lane || (['front', 'mid', 'back'] as Lane[])[Math.floor(Math.random() * 3)];
        aiPlayed++;
        const unit: BattleUnit = {
          instanceId: `e_${Date.now()}_${Math.random()}`,
          def: card,
          currentPower: Math.round(card.power * comboMultiplier(aiPlayed - 1)),
          currentGuard: card.guard,
          statuses: [],
          comboCount: aiPlayed - 1,
          lane,
        };
        aiBoard[lane] = [...aiBoard[lane], unit];
        aiEnergy -= card.cost;
        const idx = aiHand.findIndex(c => c.id === card.id);
        if (idx !== -1) aiHand.splice(idx, 1);
        addLog(`Enemy plays ${card.name} → ${lane}`);
        if (aiEnergy <= 0) break;
      }

      // AI spells: deal damage to strongest player unit
      const aiSpells = aiHand.filter(c => c.cost <= aiEnergy && c.type === 'spell');
      for (const spell of aiSpells) {
        if (spell.cost > aiEnergy) continue;
        const allPlayerUnits = [...newState.player.board.front, ...newState.player.board.mid, ...newState.player.board.back];
        if (allPlayerUnits.length > 0) {
          const target = allPlayerUnits.reduce((best, u) => u.currentPower > best.currentPower ? u : best);
          const dmg = Math.round(spell.abilityValue * 0.6);
          applyDamage(target, dmg);
          addLog(`Enemy casts ${spell.name} → ${target.def.name} for ${dmg}`);
          const idx = aiHand.findIndex(c => c.id === spell.id);
          if (idx !== -1) aiHand.splice(idx, 1);
          aiEnergy -= spell.cost;
        }
      }

      newState.enemy = { ...newState.enemy, hand: aiHand, energy: aiEnergy, board: aiBoard };

      // Clean destroyed from player board
      newState.player = { ...newState.player, board: tickBoard(newState.player.board) };
      newState.enemy = { ...newState.enemy, board: tickBoard(newState.enemy.board) };

      // Next turn
      const nextTurn = prev.turn + 1;
      const newMaxEnergy = Math.min(10, Math.floor(nextTurn / 2) + 1);

      // Check if round ends (every 5 turns)
      if (nextTurn % 6 === 0 || nextTurn > 15) {
        const winner = roundWinner(newState.player.board, newState.enemy.board);
        addLog(`── Round ${prev.round} → ${winner === 'draw' ? 'Draw!' : winner === 'player' ? 'You win!' : 'Enemy wins!'} ──`);
        const newScores = { ...roundScores };
        if (winner === 'player') newScores.player++;
        else if (winner === 'enemy') newScores.enemy++;
        setRoundScores(newScores);

        if (prev.round >= prev.maxRounds || newScores.player >= 2 || newScores.enemy >= 2) {
          const gameWinner = newScores.player > newScores.enemy ? 'player' : newScores.enemy > newScores.player ? 'enemy' : null;
          addLog(`═══ GAME OVER: ${gameWinner === 'player' ? 'VICTORY!' : gameWinner === 'enemy' ? 'DEFEAT' : 'DRAW'} ═══`);
          return { ...newState, turn: nextTurn, phase: 'game_over' as const, winner: gameWinner, round: prev.round };
        }

        // Reset board for next round
        return {
          ...newState,
          turn: nextTurn,
          round: prev.round + 1,
          player: { ...newState.player, board: { front: [], mid: [], back: [] }, energy: newMaxEnergy, maxEnergy: newMaxEnergy, cardsPlayedThisTurn: 0 },
          enemy: { ...newState.enemy, board: { front: [], mid: [], back: [] }, energy: newMaxEnergy, maxEnergy: newMaxEnergy },
        };
      }

      // Draw card each turn
      const pDraw = drawCards(newState.player, 1);
      const eDraw = drawCards(newState.enemy, 1);
      if (pDraw.drawn.length) addLog(`You draw ${pDraw.drawn[0].name}`);

      return {
        ...newState,
        turn: nextTurn,
        player: { ...pDraw.state, energy: newMaxEnergy, maxEnergy: newMaxEnergy, cardsPlayedThisTurn: 0 },
        enemy: { ...eDraw.state, energy: newMaxEnergy, maxEnergy: newMaxEnergy },
      };
    });
    haptic.medium();
  }, [roundScores]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Battle Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onExit} className="h-8 text-xs">
          <ArrowLeft size={14} /> Retreat
        </Button>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Turn {battle.turn} · Round {battle.round}/{battle.maxRounds}</p>
          <p className="text-xs font-bold">
            <span className="text-green-400">{roundScores.player}</span>
            <span className="text-muted-foreground"> — </span>
            <span className="text-red-400">{roundScores.enemy}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Energy</p>
          <p className="text-xs font-bold text-primary">{battle.player.energy}/{battle.player.maxEnergy} ⚡</p>
        </div>
      </div>

      {/* Score Bar */}
      <div className="flex items-center px-3 py-1.5 bg-muted/30 text-[10px]">
        <span className="flex-1 text-green-400 font-bold">You: {playerScore} Power</span>
        <span className="text-muted-foreground">vs</span>
        <span className="flex-1 text-right text-red-400 font-bold">{FACTION_ICONS[enemyFaction]} {enemyFaction}: {enemyScore}</span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <div className="text-[8px] text-center text-muted-foreground mb-1">Enemy ← → You</div>
        {(['front', 'mid', 'back'] as Lane[]).map(lane => (
          <LaneRow
            key={lane}
            label={lane.charAt(0).toUpperCase() + lane.slice(1)}
            playerUnits={battle.player.board[lane]}
            enemyUnits={battle.enemy.board[lane]}
            onPlayerUnitTap={(idx) => setSelectedPlayerUnit(
              selectedPlayerUnit?.lane === lane && selectedPlayerUnit?.idx === idx ? null : { lane, idx }
            )}
            onEnemyUnitTap={(idx) => setSelectedEnemyUnit(
              selectedEnemyUnit?.lane === lane && selectedEnemyUnit?.idx === idx ? null : { lane, idx }
            )}
            selectedPlayer={selectedPlayerUnit?.lane === lane ? selectedPlayerUnit.idx : undefined}
            selectedEnemy={selectedEnemyUnit?.lane === lane ? selectedEnemyUnit.idx : undefined}
          />
        ))}

        {/* Clash button */}
        {selectedPlayerUnit && selectedEnemyUnit && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center my-2">
            <Button size="sm" onClick={initiateClash} className="bg-red-600 hover:bg-red-700 text-xs">
              <Swords size={14} /> Clash!
            </Button>
          </motion.div>
        )}

        {/* Lane select when card selected */}
        {selectedHandIdx !== null && battle.player.hand[selectedHandIdx] && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex gap-2 justify-center my-2">
            {(['front', 'mid', 'back'] as Lane[]).map(lane => (
              <Button key={lane} size="sm" variant="outline" className="text-[10px] h-7" onClick={() => playCard(selectedHandIdx, lane)}>
                → {lane}
              </Button>
            ))}
          </motion.div>
        )}

        {/* Battle Log */}
        <div className="mt-2 p-2 rounded-lg bg-muted/20 border border-border max-h-20 overflow-y-auto">
          {battleLog.slice(-6).map((msg, i) => (
            <p key={i} className="text-[9px] text-muted-foreground">{msg}</p>
          ))}
        </div>
      </div>

      {/* Hand */}
      <div className="border-t border-border p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Hand ({battle.player.hand.length}) · Deck ({battle.player.deck.length})</span>
          {battle.phase !== 'game_over' && (
            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={endTurn}>
              End Turn <ChevronRight size={12} />
            </Button>
          )}
          {battle.phase === 'game_over' && (
            <Button size="sm" className="h-7 text-[10px]" onClick={onExit}>
              {battle.winner === 'player' ? '🏆 Victory!' : '💀 Defeat'} — Exit
            </Button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {battle.player.hand.map((card, i) => {
            const canPlay = card.cost <= battle.player.energy && battle.phase !== 'game_over';
            return (
              <motion.div
                key={`${card.id}-${i}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (!canPlay) return;
                  haptic.light();
                  if (card.type !== 'unit') {
                    playCard(i, 'mid');
                  } else {
                    setSelectedHandIdx(selectedHandIdx === i ? null : i);
                  }
                }}
                className={`shrink-0 w-[72px] rounded-lg p-1.5 cursor-pointer transition-all ${selectedHandIdx === i ? 'ring-2 ring-primary -translate-y-2' : ''} ${!canPlay ? 'opacity-40' : ''}`}
                style={{ background: RARITY_CONFIG[card.rarity].bg }}
              >
                <div className="text-center">
                  <div className="text-[9px] font-bold text-primary">{card.cost}⚡</div>
                  <div className="text-xl my-0.5">{card.art}</div>
                  <p className="text-[8px] font-bold text-foreground truncate">{card.name}</p>
                  {card.type === 'unit' && (
                    <p className="text-[8px] text-muted-foreground">{card.power}P {card.guard}G</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Card Reveal Animation ──
function CardRevealAnimation({ card, onDone }: { card: CardDef; onDone: () => void }) {
  const [phase, setPhase] = useState<'hidden' | 'flip' | 'glow' | 'done'>('hidden');
  const rc = RARITY_CONFIG[card.rarity];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flip'), 300);
    const t2 = setTimeout(() => setPhase('glow'), 1200);
    const t3 = setTimeout(() => setPhase('done'), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => { if (phase === 'done') onDone(); }}>
      <AnimatePresence mode="wait">
        {phase === 'hidden' && (
          <motion.div key="hidden" className="w-48 h-64 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center"
            animate={{ rotateY: [0, 10, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <Sparkles size={40} className="text-muted-foreground animate-pulse" />
          </motion.div>
        )}
        {phase === 'flip' && (
          <motion.div key="flip" initial={{ rotateY: 180, scale: 0.5 }} animate={{ rotateY: 0, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }} className="w-48 h-64 rounded-2xl flex items-center justify-center"
            style={{ background: rc.bg, boxShadow: rc.glow }}>
            <span className="text-6xl">{card.art}</span>
          </motion.div>
        )}
        {(phase === 'glow' || phase === 'done') && (
          <motion.div key="reveal" initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="w-56">
            <motion.div animate={{ boxShadow: [rc.glow, `0 0 40px ${rc.color}`, rc.glow] }}
              transition={{ duration: 2, repeat: Infinity }} className="rounded-2xl">
              <MiniCard card={card} />
            </motion.div>
            {phase === 'done' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-muted-foreground mt-4">Tap to continue</motion.p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ──
interface CardArenaProps { onBack: () => void; }

export default function CardArena({ onBack }: CardArenaProps) {
  const [tab, setTab] = useState<ArenaTab>('collection');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [revealCard, setRevealCard] = useState<CardDef | null>(null);
  const [filterRarity, setFilterRarity] = useState<CardRarity | 'all'>('all');
  const [filterFaction, setFilterFaction] = useState<string | 'all'>('all');
  const [showBudget, setShowBudget] = useState(false);
  const [deckFaction, setDeckFaction] = useState<string>('Ironclad');
  const [inBattle, setInBattle] = useState(false);

  const filteredCards = useMemo(() =>
    STARTER_CARDS.filter(c => {
      if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
      if (filterFaction !== 'all' && c.faction !== filterFaction) return false;
      return true;
    }),
  [filterRarity, filterFaction]);

  const deckCards = useMemo(() => STARTER_CARDS.filter(c => c.faction === deckFaction), [deckFaction]);

  const simulateReveal = useCallback(() => {
    haptic.heavy();
    const weights: Record<CardRarity, number> = { common: 40, uncommon: 25, rare: 18, epic: 10, legendary: 5, mythic: 2 };
    const total = Object.values(weights).reduce((s, w) => s + w, 0);
    let roll = Math.random() * total;
    let pickedRarity: CardRarity = 'common';
    for (const [r, w] of Object.entries(weights) as [CardRarity, number][]) {
      roll -= w;
      if (roll <= 0) { pickedRarity = r; break; }
    }
    const pool = STARTER_CARDS.filter(c => c.rarity === pickedRarity);
    const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : STARTER_CARDS[0];
    setRevealCard({ ...pick, id: `reveal_${Date.now()}` });
  }, []);

  if (inBattle) {
    return <BattleScreen playerFaction={deckFaction} onExit={() => setInBattle(false)} />;
  }

  const tabs: { id: ArenaTab; label: string; icon: React.ReactNode }[] = [
    { id: 'collection', label: 'Cards', icon: <Layers size={16} /> },
    { id: 'deck', label: 'Deck', icon: <Shield size={16} /> },
    { id: 'battle', label: 'Battle', icon: <Swords size={16} /> },
    { id: 'open', label: 'Open', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {revealCard && <CardRevealAnimation card={revealCard} onDone={() => setRevealCard(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => { haptic.light(); onBack(); }} className="h-9 w-9">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers size={18} className="text-orange-400" /> Card Arena
          </h1>
          <p className="text-[10px] text-muted-foreground">{STARTER_CARDS.length} cards · 3 factions · Budget B={BALANCE_CONSTANT}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { haptic.light(); setTab(t.id); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {tab === 'collection' && (
            <motion.div key="collection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Filters */}
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {(['all', ...FACTIONS] as const).map(f => (
                  <button key={f} onClick={() => setFilterFaction(f)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${filterFaction === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {f === 'all' ? '🌀 All' : `${FACTION_ICONS[f]} ${f}`}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {(['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as const).map(r => (
                  <button key={r} onClick={() => setFilterRarity(r)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${filterRarity === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {r === 'all' ? 'All' : RARITY_CONFIG[r].label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end mb-2">
                <button onClick={() => setShowBudget(!showBudget)} className="text-[9px] text-muted-foreground underline">
                  {showBudget ? 'Hide' : 'Show'} Balance Stats
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {filteredCards.map(card => (
                  <MiniCard key={card.id} card={card} selected={selectedCard === card.id} showBudget={showBudget}
                    onTap={() => setSelectedCard(card.id === selectedCard ? null : card.id)} />
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'deck' && (
            <motion.div key="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">Choose Faction</h2>
              </div>
              <div className="flex gap-2 mb-4">
                {FACTIONS.map(f => (
                  <button key={f} onClick={() => { haptic.light(); setDeckFaction(f); }}
                    className={`flex-1 p-3 rounded-xl text-center transition-all ${deckFaction === f ? 'bg-primary/20 border-2 border-primary' : 'bg-muted border border-border'}`}>
                    <span className="text-2xl">{FACTION_ICONS[f]}</span>
                    <p className="text-[10px] font-bold text-foreground mt-1">{f}</p>
                  </button>
                ))}
              </div>
              <Card className="mb-3">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-red-400">{deckCards.reduce((s, c) => s + c.power, 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total Power</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-400">{deckCards.reduce((s, c) => s + c.guard, 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total Guard</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-yellow-400">{deckCards.reduce((s, c) => s + c.cost, 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total Cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {deckCards.map(card => (
                  <div key={card.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
                    <span className="text-2xl">{card.art}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{card.name}</p>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span style={{ color: RARITY_CONFIG[card.rarity].color }}>{RARITY_CONFIG[card.rarity].label}</span>
                        <span>{TYPE_ICONS[card.type]} {card.type}</span>
                        <span>{card.cost}⚡ {card.power}P {card.guard}G</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'battle' && (
            <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="py-8">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">⚔</motion.div>
                <h2 className="text-lg font-bold text-foreground mb-1">Enter Battle</h2>
                <p className="text-xs text-muted-foreground mb-2">3-lane board · Best of 3 rounds · Energy scaling</p>
                <p className="text-[10px] text-muted-foreground mb-6">
                  Playing as {FACTION_ICONS[deckFaction]} <strong>{deckFaction}</strong>
                </p>
              </div>

              <Card className="mb-4 text-left">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold text-foreground mb-2">Combat Formulas Active</h3>
                  <div className="space-y-1 text-[10px] text-muted-foreground">
                    <p>⚡ Budget = Cost × {BALANCE_CONSTANT} + Rarity Bonus</p>
                    <p>🔥 Combo = Base × (1 + 0.25 × chain)</p>
                    <p>⚔ Clash = mutual Power damage through Guard</p>
                    <p>💥 Crit = 5% base, ×1.5 damage, 35% cap</p>
                    <p>🌊 Element advantage = +25% damage</p>
                    <p>🔥❄️☠️🩸 Status ticks: burn/frost/poison/bleed</p>
                  </div>
                </CardContent>
              </Card>

              <Button size="lg" onClick={() => { haptic.heavy(); setInBattle(true); }} className="w-full">
                <Swords size={18} /> Start Battle
              </Button>
            </motion.div>
          )}

          {tab === 'open' && (
            <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="py-8">
                <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="inline-block text-6xl mb-4">🃏</motion.div>
                <h2 className="text-lg font-bold text-foreground mb-1">Card Packs</h2>
                <p className="text-xs text-muted-foreground mb-6">Weighted rarity · Common 40% → Mythic 2%</p>
              </div>
              <div className="space-y-3">
                <Card className="text-left">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl">📦</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Standard Pack</p>
                      <p className="text-[10px] text-muted-foreground">1 card · Full rarity pool</p>
                    </div>
                    <Button size="sm" onClick={simulateReveal}><Star size={14} /> 500</Button>
                  </CardContent>
                </Card>
                <Card className="text-left border-yellow-500/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl">🎁</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Premium Pack</p>
                      <p className="text-[10px] text-muted-foreground">1 card · Rare+ guaranteed</p>
                    </div>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700" onClick={simulateReveal}><Crown size={14} /> 2,000</Button>
                  </CardContent>
                </Card>
                <Card className="text-left border-pink-500/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl">💎</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Mythic Pack</p>
                      <p className="text-[10px] text-muted-foreground">1 card · Epic+ · Mythic chance</p>
                    </div>
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700" onClick={simulateReveal}><Sparkles size={14} /> 5,000</Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
