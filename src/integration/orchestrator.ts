/**
 * Integration Orchestrator - Unified system for LLM + Serverless development
 * Provides a simple, flowing interface for coordinating both systems
 */

import LLMBridge, { type LLMConfig, type LLMResponse } from './llm-bridge';
import ServerlessSimulator, { type SimulatorConfig, type ApiResolver } from './serverless-simulator';

export interface OrchestratorConfig {
  llm: LLMConfig;
  simulator: SimulatorConfig;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'query' | 'mutation' | 'generation' | 'testing';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

class Orchestrator {
  private llm: LLMBridge;
  private simulator: ServerlessSimulator;
  private tasks: Map<string, Task> = new Map();
  private taskHistory: Task[] = [];

  constructor(config: OrchestratorConfig) {
    this.llm = new LLMBridge(config.llm);
    this.simulator = new ServerlessSimulator(config.simulator);
  }

  registerResolver(resolver: ApiResolver): void {
    this.simulator.registerResolver(resolver);
  }

  async executeTask(task: Omit<Task, 'status' | 'id'>): Promise<Task> {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: Task = {
      ...task,
      id,
      status: 'running',
    };

    this.tasks.set(id, fullTask);

    try {
      switch (task.type) {
        case 'query':
          fullTask.result = await this.handleQuery(task.name, task.description);
          break;
        case 'mutation':
          fullTask.result = await this.handleMutation(task.name, task.description);
          break;
        case 'generation':
          fullTask.result = await this.handleGeneration(task.name, task.description);
          break;
        case 'testing':
          fullTask.result = await this.handleTesting(task.name, task.description);
          break;
      }
      fullTask.status = 'completed';
    } catch (error) {
      fullTask.status = 'failed';
      fullTask.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.taskHistory.push(fullTask);
    return fullTask;
  }

  private async handleQuery(name: string, description: string): Promise<unknown> {
    try {
      return await this.simulator.resolveQuery('Query', name, { description });
    } catch {
      // Fallback to LLM if resolver not found
      return await this.llm.prompt(`Execute query: ${description}`);
    }
  }

  private async handleMutation(name: string, description: string): Promise<unknown> {
    try {
      return await this.simulator.simulateMutation('Mutation', name, { description });
    } catch {
      // Fallback to LLM
      return await this.llm.prompt(`Execute mutation: ${description}`);
    }
  }

  private async handleGeneration(name: string, description: string): Promise<unknown> {
    const systemPrompt = `You are a code generation assistant. Generate clean, well-structured code.`;
    return await this.llm.prompt(description, systemPrompt);
  }

  private async handleTesting(name: string, description: string): Promise<unknown> {
    const systemPrompt = `You are a testing assistant. Help create and analyze tests.`;
    return await this.llm.prompt(description, systemPrompt);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTaskHistory(limit: number = 10): Task[] {
    return this.taskHistory.slice(-limit);
  }

  getStatus(): Record<string, unknown> {
    return {
      simulator: this.simulator.getStatus(),
      tasksCount: this.tasks.size,
      historyCount: this.taskHistory.length,
      timestamp: new Date(),
    };
  }
}

export default Orchestrator;
