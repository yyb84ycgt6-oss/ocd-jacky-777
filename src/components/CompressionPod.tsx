import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CompressionSeed } from "@/lib/compressionPods";

type CompressionPodProps = {
  roots: CompressionSeed[];
  path: CompressionSeed[];
  onOpenSeed: (seed: CompressionSeed) => void;
  onCollapseTo: (depth: number) => void;
  onCollapseRoot: () => void;
  onSelectAction: (seed: CompressionSeed) => void;
};

const panelMotion = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } },
};

export function CompressionPod({
  roots,
  path,
  onOpenSeed,
  onCollapseTo,
  onCollapseRoot,
  onSelectAction,
}: CompressionPodProps) {
  const [focusIndex, setFocusIndex] = useState(0);

  const currentLevel = useMemo(() => {
    if (path.length === 0) return roots;
    return path[path.length - 1]?.children ?? [];
  }, [path, roots]);

  useEffect(() => {
    setFocusIndex(0);
  }, [path]);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (currentLevel.length === 0) {
      if (e.key === "Escape") onCollapseTo(Math.max(path.length - 1, 0));
      return;
    }

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((idx) => (idx + 1) % currentLevel.length);
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((idx) => (idx - 1 + currentLevel.length) % currentLevel.length);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const seed = currentLevel[focusIndex];
      if (!seed) return;
      if (seed.children?.length) onOpenSeed(seed);
      else onSelectAction(seed);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      if (path.length === 0) return;
      onCollapseTo(path.length - 1);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="rounded-md border border-border bg-secondary/20 p-3 space-y-3 focus:outline-none focus:ring-1 focus:ring-primary/50"
      aria-label="Compression pod navigator"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onCollapseTo(0)}
            className="px-2 py-1 rounded-sm text-[10px] font-mono border border-border hover:bg-secondary"
          >
            Root
          </button>
          {path.map((seed, idx) => (
            <button
              key={seed.id}
              onClick={() => onCollapseTo(idx + 1)}
              className="px-2 py-1 rounded-sm text-[10px] font-mono border border-border hover:bg-secondary"
            >
              {seed.icon} {seed.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCollapseRoot}
          className="px-2 py-1 rounded-sm text-[10px] font-mono border border-border hover:bg-secondary"
        >
          Collapse to root
        </button>
      </div>

      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Compression Trail</div>

      <AnimatePresence mode="wait">
        <motion.div
          key={path.map((p) => p.id).join("/") || "root"}
          variants={panelMotion}
          initial="initial"
          animate="animate"
          exit="exit"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2"
        >
          {currentLevel.map((seed, idx) => {
            const active = idx === focusIndex;
            return (
              <button
                key={seed.id}
                onClick={() => (seed.children?.length ? onOpenSeed(seed) : onSelectAction(seed))}
                onMouseEnter={() => setFocusIndex(idx)}
                className={`text-left p-3 rounded-md border transition-colors ${
                  active
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-background/50 hover:bg-secondary/30"
                }`}
              >
                <div className="font-mono text-xs font-bold">{seed.icon} {seed.label}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-1">
                  {seed.children?.length ? `${seed.children.length} seeds` : "action"}
                </div>
              </button>
            );
          })}
          {currentLevel.length === 0 && (
            <div className="p-3 rounded-md border border-border bg-background/50 font-mono text-xs text-muted-foreground">
              No child seeds in this pod. Press Escape to collapse.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
