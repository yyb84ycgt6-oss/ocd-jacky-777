// Wave 3: Time Travel — Immutable commit log for full replay + fork capability
import { appStorage } from './appStorageV2';
import crypto from 'crypto';

export interface Commit {
  id: string;
  timestamp: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH';
  path: string; // e.g., "media[5].categoryId" or "categories"
  before: any;
  after: any;
  userId: string;
  hash: string; // SHA256 content hash
  parentHash: string; // Previous commit hash (immutable chain)
  branchId: string; // Which timeline/fork
  metadata?: {
    reason?: string;
    tags?: string[];
    source?: 'user' | 'system' | 'sync';
  };
}

export interface Timeline {
  id: string;
  name: string;
  created_at: number;
  forked_from?: string; // Parent timeline ID
  head_commit_id: string;
  commit_count: number;
}

export class TimeTravel {
  private static instance: TimeTravel;

  private constructor() {}

  static getInstance(): TimeTravel {
    if (!TimeTravel.instance) {
      TimeTravel.instance = new TimeTravel();
    }
    return TimeTravel.instance;
  }

  /**
   * Record a change as an immutable commit
   */
  async commit(
    operation: Commit['operation'],
    path: string,
    before: any,
    after: any,
    userId: string,
    metadata?: Commit['metadata'],
    branchId: string = 'main'
  ): Promise<Commit> {
    try {
      // Get current head
      const head = await this.getHeadCommit(branchId);
      const parentHash = head?.hash || '0'.repeat(64);

      // Create commit object
      const commitData = { operation, path, before, after, userId, timestamp: Date.now() };
      const hash = this.hashCommit(commitData);

      const commit: Commit = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        operation,
        path,
        before,
        after,
        userId,
        hash,
        parentHash,
        branchId,
        metadata,
      };

      // Store immutably
      await appStorage.set('timetravel', `commit_${commit.id}`, commit);

      // Update branch head
      const timeline = await appStorage.get<Timeline>('timetravel', `timeline_${branchId}`);
      if (timeline) {
        timeline.head_commit_id = commit.id;
        timeline.commit_count++;
        await appStorage.set('timetravel', `timeline_${branchId}`, timeline);
      }

      // Audit log
      const auditLog = (await appStorage.get<Commit[]>('timetravel', 'audit_log')) || [];
      auditLog.push(commit);
      if (auditLog.length > 10000) auditLog.shift();
      await appStorage.set('timetravel', 'audit_log', auditLog);

      return commit;
    } catch (err) {
      console.error('TimeTravel: Commit failed:', err);
      throw err;
    }
  }

  /**
   * Get full history for a timeline
   */
  async getHistory(branchId: string = 'main'): Promise<Commit[]> {
    try {
      const timeline = await appStorage.get<Timeline>('timetravel', `timeline_${branchId}`);
      if (!timeline) return [];

      const commits: Commit[] = [];
      let current = timeline.head_commit_id;

      while (current) {
        const commit = await appStorage.get<Commit>('timetravel', `commit_${current}`);
        if (!commit) break;
        commits.unshift(commit);
        // Find previous by hash matching
        current = await this.findParentCommitId(commit.parentHash, branchId);
      }

      return commits;
    } catch (err) {
      console.error('TimeTravel: Get history failed:', err);
      return [];
    }
  }

  /**
   * Replay state to any point in time
   */
  async replayTo(timestamp: number, branchId: string = 'main'): Promise<any> {
    try {
      const history = await this.getHistory(branchId);
      const state = {};

      for (const commit of history) {
        if (commit.timestamp > timestamp) break;

        if (commit.operation === 'CREATE' || commit.operation === 'UPDATE') {
          this.applyCommitToState(state, commit);
        } else if (commit.operation === 'DELETE') {
          this.removeFromState(state, commit.path);
        }
      }

      return state;
    } catch (err) {
      console.error('TimeTravel: Replay failed:', err);
      return null;
    }
  }

  /**
   * Fork the timeline (create alternate branch)
   */
  async fork(fromBranchId: string = 'main', newBranchName: string): Promise<Timeline> {
    try {
      const parentBranch = await appStorage.get<Timeline>('timetravel', `timeline_${fromBranchId}`);
      if (!parentBranch) throw new Error('Parent branch not found');

      const newBranch: Timeline = {
        id: crypto.randomUUID(),
        name: newBranchName,
        created_at: Date.now(),
        forked_from: fromBranchId,
        head_commit_id: parentBranch.head_commit_id,
        commit_count: parentBranch.commit_count,
      };

      await appStorage.set('timetravel', `timeline_${newBranch.id}`, newBranch);

      // Log fork event
      const forkLog = (await appStorage.get<any[]>('timetravel', 'fork_log')) || [];
      forkLog.push({
        timestamp: Date.now(),
        parent: fromBranchId,
        child: newBranch.id,
        name: newBranchName,
      });
      await appStorage.set('timetravel', 'fork_log', forkLog);

      return newBranch;
    } catch (err) {
      console.error('TimeTravel: Fork failed:', err);
      throw err;
    }
  }

  /**
   * Diff between two commits
   */
  async diff(commitId1: string, commitId2: string): Promise<any> {
    try {
      const commit1 = await appStorage.get<Commit>('timetravel', `commit_${commitId1}`);
      const commit2 = await appStorage.get<Commit>('timetravel', `commit_${commitId2}`);

      if (!commit1 || !commit2) return null;

      return {
        path: commit1.path,
        removed: commit1.after,
        added: commit2.after,
        timestamp1: commit1.timestamp,
        timestamp2: commit2.timestamp,
      };
    } catch (err) {
      console.error('TimeTravel: Diff failed:', err);
      return null;
    }
  }

  /**
   * Get all timelines (branches)
   */
  async getTimelines(): Promise<Timeline[]> {
    try {
      const log = await appStorage.get<Timeline[]>('timetravel', 'timelines') || [];
      return log;
    } catch (err) {
      console.error('TimeTravel: Get timelines failed:', err);
      return [];
    }
  }

  /**
   * Integrity verification (check hash chain)
   */
  async verifyIntegrity(branchId: string = 'main'): Promise<boolean> {
    try {
      const history = await this.getHistory(branchId);

      for (let i = 0; i < history.length; i++) {
        const commit = history[i];
        const expectedHash = this.hashCommit({
          operation: commit.operation,
          path: commit.path,
          before: commit.before,
          after: commit.after,
          userId: commit.userId,
          timestamp: commit.timestamp,
        });

        if (commit.hash !== expectedHash) {
          console.warn(`TimeTravel: Hash mismatch at commit ${commit.id}`);
          return false;
        }

        if (i > 0) {
          const parentHash = history[i - 1].hash;
          if (commit.parentHash !== parentHash) {
            console.warn(`TimeTravel: Chain broken at commit ${commit.id}`);
            return false;
          }
        }
      }

      return true;
    } catch (err) {
      console.error('TimeTravel: Integrity check failed:', err);
      return false;
    }
  }

  // Helpers
  private hashCommit(data: any): string {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  private async getHeadCommit(branchId: string): Promise<Commit | null> {
    const timeline = await appStorage.get<Timeline>('timetravel', `timeline_${branchId}`);
    if (!timeline) return null;
    return appStorage.get<Commit>('timetravel', `commit_${timeline.head_commit_id}`);
  }

  private async findParentCommitId(parentHash: string, branchId: string): Promise<string | null> {
    const history = await this.getHistory(branchId);
    const parent = history.find(c => c.hash === parentHash);
    return parent?.id || null;
  }

  private applyCommitToState(state: any, commit: Commit) {
    const parts = commit.path.split('[');
    let current = state;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i].replace(/[\]\.]/g, '');
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    const lastKey = parts[parts.length - 1].replace(/[\]\.]/g, '');
    current[lastKey] = commit.after;
  }

  private removeFromState(state: any, path: string) {
    const parts = path.split('[');
    let current = state;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i].replace(/[\]\.]/g, '');
      current = current[key];
    }
    const lastKey = parts[parts.length - 1].replace(/[\]\.]/g, '');
    delete current[lastKey];
  }
}

export const timeTravel = TimeTravel.getInstance();
