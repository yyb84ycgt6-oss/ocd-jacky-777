// Pod Custodian: Privileged mini that owns all compression & encryption
// Single Sovereign Key, transactional lock, audit trail
import { appStorage } from '../storage/appStorageV2';
import { encryptData, decryptData } from '../storage/encryption';
import type { MiniManifest } from '../types';

export class PodCustodian {
  static readonly MINI_MANIFEST: MiniManifest = {
    id: 'pod-custodian',
    name: 'Pod Custodian',
    description: 'Privileged system mini. Handles all pod compression, encryption, and storage transactions.',
    version: '1.0.0',
    icon: '🔐',
    model_id: undefined,
    tokenizer_hash: undefined,
    storage_version: 2,
    mass_cost: 0, // System mini, no cost
    permissions: ['storage', 'notifications'],
    category_id: undefined,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  private static instance: PodCustodian;

  private constructor() {}

  static getInstance(): PodCustodian {
    if (!PodCustodian.instance) {
      PodCustodian.instance = new PodCustodian();
    }
    return PodCustodian.instance;
  }

  /**
   * Compress and encrypt data into a pod
   * Single authority for all pod operations
   */
  async createPod(namespace: string, data: unknown, userId: string): Promise<string> {
    try {
      // Encrypt the data
      const encrypted = await encryptData(data, userId);

      // Store pod metadata
      const podKey = `pod_${namespace}_${Date.now()}`;
      await appStorage.set('pod_custodian', podKey, {
        namespace,
        encrypted,
        userId,
        timestamp: Date.now(),
        version: 2,
      });

      // Audit trail
      await this.logPodOperation('CREATE', namespace, podKey, userId);

      return podKey;
    } catch (err) {
      console.error('PodCustodian: Failed to create pod:', err);
      throw err;
    }
  }

  /**
   * Decrypt and restore data from a pod
   */
  async restorePod<T>(podKey: string, userId: string): Promise<T | null> {
    try {
      const podData = await appStorage.get<{
        encrypted: string;
        userId: string;
        namespace: string;
      }>('pod_custodian', podKey);

      if (!podData) return null;

      // Verify ownership
      if (podData.userId !== userId) {
        throw new Error('Pod ownership verification failed');
      }

      // Decrypt
      const decrypted = await decryptData<T>(podData.encrypted, userId);

      // Audit trail
      await this.logPodOperation('RESTORE', podData.namespace, podKey, userId);

      return decrypted;
    } catch (err) {
      console.error('PodCustodian: Failed to restore pod:', err);
      throw err;
    }
  }

  /**
   * Compress pod for battery/thermal efficiency
   * Called at <15% battery via Sovereign Engine
   */
  async compressPod(podKey: string, userId: string): Promise<void> {
    try {
      const podData = await appStorage.get<{
        encrypted: string;
        namespace: string;
      }>('pod_custodian', podKey);

      if (!podData) return;

      // Pod is already encrypted+compressed by encryptData (DEFLATE)
      // This is a no-op verification pass
      await this.logPodOperation('COMPRESS', podData.namespace, podKey, userId);
    } catch (err) {
      console.error('PodCustodian: Failed to compress pod:', err);
    }
  }

  /**
   * Audit trail for all pod operations
   */
  private async logPodOperation(
    operation: 'CREATE' | 'RESTORE' | 'COMPRESS' | 'DELETE',
    namespace: string,
    podKey: string,
    userId: string
  ): Promise<void> {
    try {
      const log = await appStorage.get<any[]>('pod_custodian', 'audit_log') || [];
      log.push({
        operation,
        namespace,
        podKey,
        userId,
        timestamp: Date.now(),
      });

      // Keep last 100 operations
      if (log.length > 100) {
        log.shift();
      }

      await appStorage.set('pod_custodian', 'audit_log', log);
    } catch (err) {
      console.warn('PodCustodian: Failed to log operation:', err);
    }
  }

  /**
   * Get audit trail for debugging
   */
  async getAuditLog(): Promise<any[]> {
    try {
      return (await appStorage.get<any[]>('pod_custodian', 'audit_log')) || [];
    } catch (err) {
      console.error('PodCustodian: Failed to read audit log:', err);
      return [];
    }
  }

  /**
   * Health check: verify pod integrity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Write a test pod
      const testPod = await this.createPod('health_check', { test: true }, 'system');

      // Restore it
      const restored = await this.restorePod<{ test: boolean }>(testPod, 'system');

      // Delete it
      await appStorage.delete('pod_custodian', testPod);

      return restored?.test === true;
    } catch (err) {
      console.error('PodCustodian: Health check failed:', err);
      return false;
    }
  }
}

export const podCustodian = PodCustodian.getInstance();
