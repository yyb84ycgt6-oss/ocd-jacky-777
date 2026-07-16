# Integration Guide: LLM + Serverless Development Environment

## Overview

This integration layer provides a unified, harmonious system for building intelligent serverless applications. It combines:

- **LLM Bridge**: Access to multiple language models (OpenAI, Anthropic Claude, Google Gemini, local models)
- **Serverless Simulator**: Local development environment for AppSync APIs, GraphQL, and REST endpoints
- **Orchestrator**: Unified task execution engine that coordinates both systems

The design prioritizes simplicity, natural flow, and low-friction developer experience.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           Orchestrator (Task Coordination)           │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────┐        ┌──────────────────┐  │
│  │  LLM Bridge      │        │ Serverless API   │  │
│  │                  │        │ Simulator        │  │
│  │ • Anthropic      │        │                  │  │
│  │ • OpenAI         │        │ • GraphQL        │  │
│  │ • Gemini         │        │ • REST           │  │
│  │ • Local Models   │        │ • Event Logging  │  │
│  └──────────────────┘        └──────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Setup

```typescript
import { Orchestrator } from './src/integration';

const orchestrator = new Orchestrator({
  llm: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-opus',
  },
  simulator: {
    port: 4000,
    debug: true,
  },
});
```

### In React Components

```typescript
import { useIntegration } from './src/integration/useIntegration';

function MyComponent() {
  const { executeTask, tasks, error } = useIntegration({
    llm: {
      provider: 'anthropic',
      apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
    },
    simulator: { port: 4000 },
  });

  const handleGenerate = async () => {
    const result = await executeTask({
      name: 'generate-resolver',
      description: 'Generate a GraphQL resolver for user queries',
      type: 'generation',
    });
    console.log('Generated:', result);
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate Resolver</button>
      {tasks.map((task) => (
        <div key={task.id} className={`task ${task.status}`}>
          {task.name}: {task.status}
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## Core Concepts

### LLM Bridge

The LLM Bridge provides a unified interface to multiple language model providers.

**Supported Providers:**
- `anthropic`: Claude models via Anthropic API
- `openai`: GPT models via OpenAI API
- `gemini`: Google Gemini models
- `local`: Local/offline models

**Basic Usage:**

```typescript
import { LLMBridge } from './src/integration';

const llm = new LLMBridge({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-opus',
  temperature: 0.7,
});

// Simple prompt
const response = await llm.prompt('What is the capital of France?');

// With system prompt
const response = await llm.prompt(
  'Generate a TypeScript resolver',
  'You are a code generation assistant. Generate clean, well-structured code.'
);

// Multi-turn conversation
await llm.prompt('First question');
const response = await llm.prompt('Follow-up question'); // Context is preserved
llm.clearHistory(); // Reset conversation
```

### Serverless Simulator

The Serverless Simulator provides local development capabilities for serverless APIs.

**Features:**
- GraphQL resolver simulation
- REST endpoint simulation
- Event logging and debugging
- Hot reload support
- Persistence options

**Basic Usage:**

```typescript
import { ServerlessSimulator, type ApiResolver } from './src/integration';

const simulator = new ServerlessSimulator({ port: 4000, debug: true });

// Register a resolver
const resolver: ApiResolver = {
  name: 'getUser',
  type: 'Query',
  field: 'user',
  handler: async (args: unknown) => ({
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
  }),
};

simulator.registerResolver(resolver);

// Execute queries
const result = await simulator.resolveQuery('Query', 'user', { id: '123' });

// Check status
const status = simulator.getStatus();
console.log('Active resolvers:', status.resolvers);

// View event log
const events = simulator.getEventLog();
```

### Orchestrator

The Orchestrator coordinates tasks between LLM and serverless systems.

**Task Types:**
- `query`: Execute GraphQL/API queries
- `mutation`: Execute mutations
- `generation`: Generate code with LLM assistance
- `testing`: Generate and analyze tests

**Basic Usage:**

```typescript
import { Orchestrator } from './src/integration';

const orchestrator = new Orchestrator({
  llm: { provider: 'anthropic', apiKey: '...' },
  simulator: { port: 4000 },
});

// Execute tasks
const result = await orchestrator.executeTask({
  name: 'create-user',
  description: 'Create a new user in the system',
  type: 'mutation',
});

// Check task status
const task = orchestrator.getTask(result.id);
if (task?.status === 'completed') {
  console.log('Task result:', task.result);
}

// View history
const history = orchestrator.getTaskHistory(10);
```

## Environment Variables

Create a `.env` file with the following:

```bash
# LLM Configuration
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here

# Simulator Configuration
SIMULATOR_PORT=4000
SIMULATOR_DEBUG=true

# React App (if building frontend)
REACT_APP_ANTHROPIC_KEY=your_key_here
```

## Use Cases

### 1. Code Generation Assistant

Generate resolvers, mutations, and API handlers with LLM assistance:

```typescript
const result = await orchestrator.executeTask({
  name: 'generate-resolver',
  description: 'Generate a GraphQL resolver for fetching user data from Supabase',
  type: 'generation',
});
```

### 2. API Testing

Simulate and test serverless APIs before deployment:

```typescript
// Register a resolver
simulator.registerResolver({
  name: 'listUsers',
  type: 'Query',
  field: 'users',
  handler: async () => [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ],
});

// Test the API
const result = await simulator.resolveQuery('Query', 'users', {});
```

### 3. Test Generation

Use LLM to generate comprehensive test cases:

```typescript
const result = await orchestrator.executeTask({
  name: 'generate-tests',
  description: 'Generate test cases for the getUserById resolver',
  type: 'testing',
});
```

### 4. Interactive Development

Build interactive development tools with real-time LLM assistance:

```typescript
function DevTool() {
  const { executeTask, tasks } = useIntegration(config);

  const handleQuery = async (query: string) => {
    const result = await executeTask({
      name: 'api-query',
      description: query,
      type: 'query',
    });
    return result;
  };

  return (
    <div>
      {/* UI components */}
    </div>
  );
}
```

## Best Practices

### 1. Configuration Management

Keep sensitive keys in environment variables:

```typescript
const config = {
  llm: {
    provider: process.env.LLM_PROVIDER as 'anthropic',
    apiKey: process.env.LLM_API_KEY,
  },
};
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await orchestrator.executeTask(task);
} catch (error) {
  console.error('Task failed:', error);
  // Fallback or retry logic
}
```

### 3. Streaming for Large Operations

For larger operations, consider streaming responses:

```typescript
const llm = new LLMBridge({
  provider: 'anthropic',
  apiKey: '...',
  streaming: true,
});
```

### 4. Task History

Keep track of completed tasks for debugging:

```typescript
const history = orchestrator.getTaskHistory(20);
history.forEach((task) => {
  if (task.status === 'failed') {
    console.log(`Failed: ${task.name}`, task.error);
  }
});
```

## Integration Points

### With Supabase

Connect the simulator to your Supabase database:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Register resolvers that use Supabase
simulator.registerResolver({
  name: 'getUsers',
  type: 'Query',
  field: 'users',
  handler: async () => {
    const { data } = await supabase.from('users').select();
    return data;
  },
});
```

### With React Components

Use the hook in any React component:

```typescript
import { useIntegration } from './src/integration/useIntegration';

function MyFeature() {
  const { executeTask, isReady } = useIntegration(config);
  
  if (!isReady) return <Loading />;
  
  return <YourComponent onTask={executeTask} />;
}
```

## Performance Considerations

1. **Task Batching**: Group related tasks to reduce overhead
2. **Caching**: Cache LLM responses for repeated queries
3. **Local Models**: Use local models for development to reduce API costs
4. **Event Log Cleanup**: Periodically clear the event log on long-running simulators

## Troubleshooting

### LLM Connection Issues

Ensure API keys are correctly set and valid:

```typescript
try {
  const response = await llm.prompt('test');
  console.log('LLM is working:', response);
} catch (error) {
  console.error('LLM error:', error);
}
```

### Resolver Not Found

Register all needed resolvers before executing queries:

```typescript
// Make sure resolver is registered
simulator.registerResolver(myResolver);

// Then query
const result = await simulator.resolveQuery('Query', 'myField', {});
```

### Task Timeout

Increase simulator timeout settings or break large tasks into smaller ones:

```typescript
const simulator = new ServerlessSimulator({
  port: 4000,
  debug: true,
  // Add timeout configuration as needed
});
```

## Contributing

To extend this integration:

1. Add new LLM providers to `llm-bridge.ts`
2. Add new resolver types to `serverless-simulator.ts`
3. Create task handlers in `orchestrator.ts`
4. Update hooks in `useIntegration.ts`

## License

This integration is part of the project and follows the same license as the main application.
