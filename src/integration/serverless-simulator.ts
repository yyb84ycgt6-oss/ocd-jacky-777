/**
 * Serverless Simulator - Local development environment for serverless APIs
 * Provides AppSync, GraphQL, and REST API simulation capabilities
 */

export interface ApiResolver {
  name: string;
  type: string;
  field: string;
  handler: (args: unknown) => Promise<unknown>;
}

export interface ApiSchema {
  name: string;
  type: 'graphql' | 'rest';
  resolvers: ApiResolver[];
}

export interface SimulatorConfig {
  port?: number;
  debug?: boolean;
  hotReload?: boolean;
  persistence?: boolean;
}

class ServerlessSimulator {
  private config: SimulatorConfig;
  private schemas: Map<string, ApiSchema> = new Map();
  private resolvers: Map<string, ApiResolver> = new Map();
  private eventLog: unknown[] = [];

  constructor(config: SimulatorConfig = {}) {
    this.config = {
      port: 4000,
      debug: false,
      hotReload: true,
      persistence: false,
      ...config,
    };
  }

  registerResolver(resolver: ApiResolver): void {
    const key = `${resolver.type}.${resolver.field}`;
    this.resolvers.set(key, resolver);

    if (this.config.debug) {
      console.log(`[Simulator] Registered resolver: ${key}`);
    }
  }

  registerSchema(schema: ApiSchema): void {
    this.schemas.set(schema.name, schema);
    schema.resolvers.forEach((resolver) => this.registerResolver(resolver));

    if (this.config.debug) {
      console.log(`[Simulator] Registered schema: ${schema.name}`);
    }
  }

  async resolveQuery(type: string, field: string, args: unknown): Promise<unknown> {
    const key = `${type}.${field}`;
    const resolver = this.resolvers.get(key);

    if (!resolver) {
      throw new Error(`Resolver not found: ${key}`);
    }

    try {
      const result = await resolver.handler(args);
      this.logEvent({ type: 'query', field: key, args, result, timestamp: new Date() });
      return result;
    } catch (error) {
      this.logEvent({ type: 'error', field: key, error, timestamp: new Date() });
      throw error;
    }
  }

  async simulateMutation(type: string, field: string, args: unknown): Promise<unknown> {
    const key = `${type}.${field}`;
    const resolver = this.resolvers.get(key);

    if (!resolver) {
      throw new Error(`Mutation resolver not found: ${key}`);
    }

    try {
      const result = await resolver.handler(args);
      this.logEvent({ type: 'mutation', field: key, args, result, timestamp: new Date() });
      return result;
    } catch (error) {
      this.logEvent({ type: 'error', field: key, error, timestamp: new Date() });
      throw error;
    }
  }

  getEventLog(): unknown[] {
    return [...this.eventLog];
  }

  clearEventLog(): void {
    this.eventLog = [];
  }

  private logEvent(event: unknown): void {
    this.eventLog.push(event);

    if (this.config.debug && this.eventLog.length % 10 === 0) {
      console.log(`[Simulator] Event log size: ${this.eventLog.length}`);
    }
  }

  getStatus(): Record<string, unknown> {
    return {
      port: this.config.port,
      schemas: Array.from(this.schemas.keys()),
      resolvers: Array.from(this.resolvers.keys()),
      eventCount: this.eventLog.length,
      timestamp: new Date(),
    };
  }
}

export default ServerlessSimulator;
