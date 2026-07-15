// Wave 5: Predictive Intelligence — On-device ML for anticipatory UX
// Learns user patterns and predicts next actions

import type { MiniManifest, MediaItem, VaultCategory } from '../types';

export class PredictiveIntelligence {
  static readonly MINI_MANIFEST: MiniManifest = {
    id: 'predictive-intelligence',
    name: 'Predictive Intelligence',
    description: 'On-device ML mini. Predicts user intent from action history.',
    version: '1.0.0',
    icon: '🧠',
    storage_version: 2,
    mass_cost: 15, // Resource intensive
    permissions: ['storage'],
    active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  private actionHistory: Array<{
    action: string;
    timestamp: number;
    metadata?: any;
  }> = [];

  private patterns: Map<string, number> = new Map(); // action sequence -> frequency
  private predictions: Array<{ action: string; confidence: number }> = [];

  /**
   * Log user action
   */
  logAction(action: string, metadata?: any): void {
    this.actionHistory.push({
      action,
      timestamp: Date.now(),
      metadata,
    });

    // Keep last 100 actions
    if (this.actionHistory.length > 100) {
      this.actionHistory.shift();
    }

    // Update patterns
    this.updatePatterns();
  }

  /**
   * Predict next actions
   */
  predictNextActions(count: number = 3): Array<{ action: string; confidence: number }> {
    if (this.actionHistory.length < 3) {
      return [];
    }

    // Extract last 3 actions as context
    const context = this.actionHistory
      .slice(-3)
      .map(a => a.action)
      .join(' -> ');

    // Find all patterns that start with this context
    const matching = Array.from(this.patterns.entries())
      .filter(([pattern]) => pattern.startsWith(context))
      .sort((a, b) => b[1] - a[1])
      .slice(0, count);

    return matching.map(([pattern, freq]) => {
      const actions = pattern.split(' -> ');
      return {
        action: actions[actions.length - 1],
        confidence: Math.min(freq / 10, 0.95), // Cap at 95%
      };
    });
  }

  /**
   * Suggest categories based on media patterns
   */
  suggestCategory(media: MediaItem[], allCategories: VaultCategory[]): VaultCategory | null {
    if (media.length === 0 || allCategories.length === 0) {
      return null;
    }

    // Count category usage
    const categoryUsage = new Map<string, number>();
    media.forEach(m => {
      if (m.categoryId) {
        categoryUsage.set(m.categoryId, (categoryUsage.get(m.categoryId) || 0) + 1);
      }
    });

    // Find most-used category
    let bestCategoryId = '';
    let maxUsage = 0;
    for (const [catId, usage] of categoryUsage) {
      if (usage > maxUsage) {
        maxUsage = usage;
        bestCategoryId = catId;
      }
    }

    // Return category object (confidence = usage frequency)
    return allCategories.find(c => c.id === bestCategoryId) || null;
  }

  /**
   * Suggest compression based on battery level
   */
  suggestCompression(batteryLevel: number): { priority: 'low' | 'medium' | 'high'; reason: string } {
    if (batteryLevel < 15) {
      return { priority: 'high', reason: 'Critical: Battery <15%' };
    } else if (batteryLevel < 30) {
      return { priority: 'medium', reason: 'Battery <30%' };
    } else {
      return { priority: 'low', reason: 'Battery healthy' };
    }
  }

  /**
   * Learn time-of-day patterns
   */
  learnTimePatterns(): Map<string, Array<{ action: string; frequency: number }>> {
    const timePatterns = new Map<string, Map<string, number>>();

    for (const item of this.actionHistory) {
      const hour = new Date(item.timestamp).getHours();
      const timeSlot = this.getTimeSlot(hour);

      if (!timePatterns.has(timeSlot)) {
        timePatterns.set(timeSlot, new Map());
      }

      const slotPattern = timePatterns.get(timeSlot)!;
      slotPattern.set(item.action, (slotPattern.get(item.action) || 0) + 1);
    }

    // Convert to sorted arrays
    const result = new Map<string, Array<{ action: string; frequency: number }>>();
    for (const [slot, patterns] of timePatterns) {
      const sorted = Array.from(patterns.entries())
        .map(([action, frequency]) => ({ action, frequency }))
        .sort((a, b) => b.frequency - a.frequency);
      result.set(slot, sorted);
    }

    return result;
  }

  /**
   * Get action patterns (Markov chain)
   */
  getActionPatterns(): Map<string, number> {
    return new Map(this.patterns);
  }

  // Helpers
  private updatePatterns(): void {
    this.patterns.clear();

    // Build 2-action and 3-action patterns
    for (let i = 0; i < this.actionHistory.length - 1; i++) {
      // 2-action pattern
      const pattern2 = `${this.actionHistory[i].action} -> ${this.actionHistory[i + 1].action}`;
      this.patterns.set(pattern2, (this.patterns.get(pattern2) || 0) + 1);

      // 3-action pattern
      if (i + 2 < this.actionHistory.length) {
        const pattern3 = `${pattern2} -> ${this.actionHistory[i + 2].action}`;
        this.patterns.set(pattern3, (this.patterns.get(pattern3) || 0) + 1);
      }
    }
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

export const predictiveIntelligence = new PredictiveIntelligence();
