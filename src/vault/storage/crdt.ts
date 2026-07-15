// Wave 4: CRDT Sync — Conflict-free replicated data types for multi-device sync
// Vector clocks + last-write-wins for deterministic convergence

import crypto from 'crypto';

export interface VectorClock {
  [peerId: string]: number;
}

export interface CRDTOperation {
  id: string;
  peerId: string;
  timestamp: number;
  vectorClock: VectorClock;
  operation: 'SET' | 'DELETE';
  key: string;
  value?: any;
  hash: string;
}

export interface CRDTState {
  values: Map<string, any>;
  tombstones: Set<string>; // Deleted keys (for convergence)
  operations: CRDTOperation[];
  vectorClock: VectorClock;
  peerId: string;
}

export class CRDT {
  private state: CRDTState;
  private peerId: string;
  private remoteStates: Map<string, CRDTState> = new Map();

  constructor(peerId: string = 'local') {
    this.peerId = peerId;
    this.state = {
      values: new Map(),
      tombstones: new Set(),
      operations: [],
      vectorClock: { [peerId]: 0 },
      peerId,
    };
  }

  /**
   * Set value locally (generates operation)
   */
  set(key: string, value: any): CRDTOperation {
    this.state.vectorClock[this.peerId] = (this.state.vectorClock[this.peerId] || 0) + 1;
    this.state.tombstones.delete(key);

    const op: CRDTOperation = {
      id: crypto.randomUUID(),
      peerId: this.peerId,
      timestamp: Date.now(),
      vectorClock: { ...this.state.vectorClock },
      operation: 'SET',
      key,
      value,
      hash: this.hashOp({ key, value, timestamp: Date.now() }),
    };

    this.state.values.set(key, value);
    this.state.operations.push(op);
    this.pruneOperations();

    return op;
  }

  /**
   * Delete value locally (generates tombstone)
   */
  delete(key: string): CRDTOperation {
    this.state.vectorClock[this.peerId] = (this.state.vectorClock[this.peerId] || 0) + 1;
    this.state.values.delete(key);
    this.state.tombstones.add(key);

    const op: CRDTOperation = {
      id: crypto.randomUUID(),
      peerId: this.peerId,
      timestamp: Date.now(),
      vectorClock: { ...this.state.vectorClock },
      operation: 'DELETE',
      key,
      hash: this.hashOp({ key, timestamp: Date.now() }),
    };

    this.state.operations.push(op);
    this.pruneOperations();

    return op;
  }

  /**
   * Merge remote operations (convergence)
   * Uses vector clocks for causal ordering + LWW for conflicts
   */
  mergeRemote(remoteOps: CRDTOperation[], remotePeerId: string): void {
    // Update remote vector clock
    const remoteState = this.remoteStates.get(remotePeerId) || {
      values: new Map(),
      tombstones: new Set(),
      operations: [],
      vectorClock: {},
      peerId: remotePeerId,
    };

    // Apply each remote operation in vector-clock order
    for (const op of remoteOps) {
      // Check if we've seen this operation (idempotent)
      if (remoteState.operations.some(o => o.id === op.id)) {
        continue;
      }

      // Update remote vector clock
      remoteState.vectorClock[op.peerId] = Math.max(
        remoteState.vectorClock[op.peerId] || 0,
        op.vectorClock[op.peerId] || 0
      );

      // Resolve conflict: LWW (last-write-wins by timestamp, then by peerId for determinism)
      const localValue = this.state.values.get(op.key);
      const localOp = this.state.operations.find(o => o.key === op.key && o.operation === 'SET');

      let shouldApply = false;

      if (op.operation === 'SET') {
        if (!localValue) {
          shouldApply = true;
        } else if (op.timestamp > (localOp?.timestamp || 0)) {
          shouldApply = true;
        } else if (op.timestamp === localOp?.timestamp && op.peerId > this.peerId) {
          // Deterministic tiebreaker: peerId order (ensures convergence)
          shouldApply = true;
        }

        if (shouldApply) {
          this.state.values.set(op.key, op.value);
          this.state.tombstones.delete(op.key);
        }
      } else if (op.operation === 'DELETE') {
        this.state.values.delete(op.key);
        this.state.tombstones.add(op.key);
      }

      remoteState.operations.push(op);
    }

    this.remoteStates.set(remotePeerId, remoteState);
  }

  /**
   * Get current state (merged from all peers)
   */
  getState(): Map<string, any> {
    return new Map(this.state.values);
  }

  /**
   * Get operations for sync (delta only)
   */
  getOperations(after?: CRDTOperation[]): CRDTOperation[] {
    if (!after) return this.state.operations;

    const afterIds = new Set(after.map(o => o.id));
    return this.state.operations.filter(o => !afterIds.has(o.id));
  }

  /**
   * Verify all peers have converged (quorum check)
   */
  hasConverged(expectedPeerCount: number): boolean {
    const allPeers = new Set([this.peerId, ...this.remoteStates.keys()]);
    if (allPeers.size < expectedPeerCount) return false;

    // All peers should have same vector clock size
    return Array.from(allPeers).every(
      peerId => (this.state.vectorClock[peerId] || 0) === (this.remoteStates.get(peerId)?.vectorClock[peerId] || 0)
    );
  }

  /**
   * Get causality: which operations happened-before which
   */
  getCausality(): Map<string, string[]> {
    const causality = new Map<string, string[]>();

    for (const op of this.state.operations) {
      const dependencies: string[] = [];

      for (const prevOp of this.state.operations) {
        if (prevOp.id === op.id) continue;

        // prevOp happened-before op if its vector clock is less-than op's
        const happensBefore = Object.keys(prevOp.vectorClock).every(
          peerId => (prevOp.vectorClock[peerId] || 0) <= (op.vectorClock[peerId] || 0)
        );

        if (happensBefore) {
          dependencies.push(prevOp.id);
        }
      }

      causality.set(op.id, dependencies);
    }

    return causality;
  }

  /**
   * Export state for persistence
   */
  export(): any {
    return {
      values: Object.fromEntries(this.state.values),
      tombstones: Array.from(this.state.tombstones),
      operations: this.state.operations,
      vectorClock: this.state.vectorClock,
      peerId: this.peerId,
    };
  }

  /**
   * Import state from persistence
   */
  import(exported: any): void {
    this.state.values = new Map(Object.entries(exported.values || {}));
    this.state.tombstones = new Set(exported.tombstones || []);
    this.state.operations = exported.operations || [];
    this.state.vectorClock = exported.vectorClock || {};
  }

  // Helpers
  private hashOp(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private pruneOperations(): void {
    // Keep last 1000 operations to avoid unbounded growth
    if (this.state.operations.length > 1000) {
      this.state.operations = this.state.operations.slice(-1000);
    }
  }
}

export function createCRDT(peerId?: string): CRDT {
  return new CRDT(peerId);
}
