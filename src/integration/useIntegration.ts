/**
 * React Hook - useIntegration
 * Simple, flowing interface for accessing LLM + Serverless capabilities within React
 */

import { useCallback, useRef, useState } from 'react';
import Orchestrator, { type OrchestratorConfig, type Task } from './orchestrator';

export function useIntegration(config: OrchestratorConfig) {
  const orchestratorRef = useRef<Orchestrator | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize orchestrator
  if (!orchestratorRef.current) {
    orchestratorRef.current = new Orchestrator(config);
    setIsReady(true);
  }

  const executeTask = useCallback(
    async (task: Omit<Task, 'status' | 'id'>) => {
      if (!orchestratorRef.current) {
        setError('Orchestrator not initialized');
        return;
      }

      try {
        setError(null);
        const result = await orchestratorRef.current.executeTask(task);
        setTasks((prev) => [...prev, result]);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  const getStatus = useCallback(() => {
    if (!orchestratorRef.current) return null;
    return orchestratorRef.current.getStatus();
  }, []);

  return {
    isReady,
    tasks,
    error,
    executeTask,
    clearTasks,
    getStatus,
    orchestrator: orchestratorRef.current,
  };
}

export type UseIntegrationReturn = ReturnType<typeof useIntegration>;
