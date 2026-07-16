# Integration Module: LLM + Serverless Development

A unified, harmonious system for building intelligent serverless applications with LLM assistance.

## Quick Links

- **Full Guide**: [INTEGRATION_GUIDE.md](../../INTEGRATION_GUIDE.md)
- **Examples**: [examples.tsx](./examples.tsx)
- **Config Template**: [.env.integration.example](../../.env.integration.example)

## Module Structure

```
src/integration/
├── llm-bridge.ts          # LLM provider abstraction
├── serverless-simulator.ts # API simulation engine
├── orchestrator.ts         # Task coordination
├── useIntegration.ts      # React hook
├── examples.tsx           # Usage examples
├── index.ts               # Module exports
└── README.md             # This file
```

## Three Core Components

### 1. LLMBridge

Unified interface to multiple language models.

```typescript
import { LLMBridge } from './src/integration';

const llm = new LLMBridge({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-opus',
});

const response = await llm.prompt('Generate a GraphQL resolver');
```

**Supported Providers:** Anthropic, OpenAI, Google Gemini, Local models

### 2. ServerlessSimulator

Local development environment for serverless APIs.

```typescript
import { ServerlessSimulator } from './src/integration';

const simulator = new ServerlessSimulator({ port: 4000 });

simulator.registerResolver({
  name: 'getUser',
  type: 'Query',
  field: 'user',
  handler: async (args) => ({ id: '1', name: 'John' }),
});

const result = await simulator.resolveQuery('Query', 'user', {});
```

### 3. Orchestrator

Coordinates tasks between LLM and serverless systems.

```typescript
import { Orchestrator } from './src/integration';

const orchestrator = new Orchestrator({
  llm: { provider: 'anthropic', apiKey: '...' },
  simulator: { port: 4000 },
});

const result = await orchestrator.executeTask({
  name: 'generate-resolver',
  description: 'Generate a user resolver',
  type: 'generation',
});
```

## React Hook

Use in React components with a simple hook:

```typescript
import { useIntegration } from './src/integration/useIntegration';

function MyComponent() {
  const { executeTask, tasks, error } = useIntegration({
    llm: { provider: 'anthropic', apiKey: '...' },
    simulator: { port: 4000 },
  });

  return (
    <button onClick={() => executeTask({ name: 'task', type: 'generation', description: '...' })}>
      Execute
    </button>
  );
}
```

## Task Types

| Type | Purpose | Use Case |
|------|---------|----------|
| `query` | Execute GraphQL queries | Fetch data from API |
| `mutation` | Execute GraphQL mutations | Modify data in API |
| `generation` | Generate code with LLM | Create resolvers, handlers, tests |
| `testing` | Generate and analyze tests | Test coverage, edge cases |

## Configuration

Create `.env` file or use environment variables:

```bash
ANTHROPIC_API_KEY=your_key_here
SIMULATOR_PORT=4000
SIMULATOR_DEBUG=true
```

See [.env.integration.example](../../.env.integration.example) for all options.

## Real-World Example

```typescript
import { useIntegration } from './src/integration/useIntegration';

function DevTool() {
  const { executeTask, tasks } = useIntegration({
    llm: { provider: 'anthropic', apiKey: process.env.REACT_APP_ANTHROPIC_KEY },
    simulator: { port: 4000 },
  });

  const generateAndTest = async () => {
    // Generate a resolver
    const gen = await executeTask({
      name: 'generate-resolver',
      description: 'Generate resolver for user queries',
      type: 'generation',
    });

    // Test it
    const test = await executeTask({
      name: 'test-resolver',
      description: 'Test the generated resolver',
      type: 'query',
    });

    // Generate tests
    await executeTask({
      name: 'generate-tests',
      description: 'Create test cases for the resolver',
      type: 'testing',
    });
  };

  return (
    <div>
      <button onClick={generateAndTest}>Generate, Test & Validate</button>
      {tasks.map(task => (
        <div key={task.id} className={`task ${task.status}`}>
          {task.name}: {task.status}
          {task.result && <pre>{JSON.stringify(task.result, null, 2)}</pre>}
        </div>
      ))}
    </div>
  );
}
```

## Features

✨ **Unified Interface** - Single API for multiple LLM providers  
🚀 **Local Development** - Simulate serverless APIs before deployment  
🔄 **Task Orchestration** - Coordinate complex multi-step workflows  
⚡ **React Integration** - Simple hook for component usage  
🎯 **TypeScript** - Full type safety throughout  
💾 **Event Logging** - Track all operations for debugging  
🌊 **Low Friction** - Designed for natural, flowing developer experience  

## Best Practices

1. **Environment Variables** - Always store API keys in .env files
2. **Error Handling** - Wrap tasks in try-catch blocks
3. **Task History** - Use orchestrator history for debugging
4. **Rate Limiting** - Consider LLM API rate limits
5. **Local Models** - Use local models for development/testing

## Extending

### Add a New LLM Provider

Edit `llm-bridge.ts`:

```typescript
private async callMyProvider(messages: LLMMessage[]): Promise<LLMResponse> {
  // Implementation
}
```

### Add Custom Task Types

Edit `orchestrator.ts`:

```typescript
case 'myType':
  fullTask.result = await this.handleMyType(task.name, task.description);
  break;
```

## Troubleshooting

**LLM Connection Error**: Check API key and provider configuration  
**Resolver Not Found**: Ensure resolver is registered before querying  
**CORS Issues**: Simulator runs on localhost:4000 by default  

## Performance Tips

- Use local models for development
- Batch related tasks together
- Clear event logs periodically
- Cache LLM responses when possible

## License

Part of the main application project.

---

**Ready to build?** Check [examples.tsx](./examples.tsx) for sample code patterns.
