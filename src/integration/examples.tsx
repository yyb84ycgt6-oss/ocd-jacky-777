/**
 * Integration Examples - Sample usage patterns
 * These examples demonstrate how to use the LLM + Serverless integration
 */

import { useIntegration } from './useIntegration';
import { Orchestrator, ServerlessSimulator, LLMBridge } from './index';

/**
 * Example 1: Simple Code Generation
 * Generate a GraphQL resolver using LLM assistance
 */
export function CodeGenerationExample() {
  const { executeTask, tasks, error, isReady } = useIntegration({
    llm: {
      provider: 'anthropic',
      apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
      model: 'claude-opus',
    },
    simulator: {
      port: 4000,
      debug: false,
    },
  });

  const handleGenerateResolver = async () => {
    const result = await executeTask({
      name: 'generate-graphql-resolver',
      description:
        'Generate a TypeScript GraphQL resolver for fetching user profile data from Supabase',
      type: 'generation',
    });

    console.log('Generated resolver:', result.result);
  };

  if (!isReady) return <div>Initializing...</div>;

  return (
    <div className="example">
      <h2>Code Generation</h2>
      <button onClick={handleGenerateResolver}>Generate Resolver</button>
      {error && <p className="error">{error}</p>}
      <div className="tasks">
        {tasks.map((task) => (
          <div key={task.id} className={`task status-${task.status}`}>
            <strong>{task.name}</strong>
            <span className="status">{task.status}</span>
            {task.result && <pre>{JSON.stringify(task.result, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 2: API Simulation and Testing
 * Set up local API simulation for testing
 */
export function ApiSimulationExample() {
  const simulator = new ServerlessSimulator({ port: 4000, debug: true });

  // Initialize with sample resolvers
  const setupApi = () => {
    simulator.registerResolver({
      name: 'getUsers',
      type: 'Query',
      field: 'users',
      handler: async () => [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ],
    });

    simulator.registerResolver({
      name: 'getUser',
      type: 'Query',
      field: 'user',
      handler: async (args: unknown) => ({
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        profile: args,
      }),
    });

    simulator.registerResolver({
      name: 'createUser',
      type: 'Mutation',
      field: 'createUser',
      handler: async (input: unknown) => ({
        id: String(Math.random()),
        ...input,
        createdAt: new Date(),
      }),
    });
  };

  const testApi = async () => {
    setupApi();

    // Test Query
    const users = await simulator.resolveQuery('Query', 'users', {});
    console.log('Users:', users);

    // Test Mutation
    const newUser = await simulator.simulateMutation('Mutation', 'createUser', {
      name: 'Charlie',
      email: 'charlie@example.com',
    });
    console.log('New user:', newUser);

    // Check status
    const status = simulator.getStatus();
    console.log('Simulator status:', status);
  };

  return (
    <div className="example">
      <h2>API Simulation</h2>
      <button onClick={testApi}>Test API</button>
      <pre id="api-output">{/* Results will be logged to console */}</pre>
    </div>
  );
}

/**
 * Example 3: Task Orchestration
 * Coordinate multiple tasks across LLM and serverless systems
 */
export function OrchestrationExample() {
  const orchestrator = new Orchestrator({
    llm: {
      provider: 'anthropic',
      apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
    },
    simulator: {
      port: 4000,
      debug: false,
    },
  });

  const executeTasks = async () => {
    // Task 1: Generate a resolver
    const generationTask = await orchestrator.executeTask({
      name: 'generate-user-resolver',
      description: 'Generate a resolver for fetching user data',
      type: 'generation',
    });

    console.log('Generation task:', generationTask);

    // Task 2: Test the API
    const testTask = await orchestrator.executeTask({
      name: 'test-user-api',
      description: 'Test the user API endpoint',
      type: 'query',
    });

    console.log('Test task:', testTask);

    // Task 3: Generate tests
    const testGenTask = await orchestrator.executeTask({
      name: 'generate-user-tests',
      description: 'Generate test cases for user resolver',
      type: 'testing',
    });

    console.log('Test generation task:', testGenTask);

    // View all tasks
    const history = orchestrator.getTaskHistory(10);
    console.log('Task history:', history);
  };

  return (
    <div className="example">
      <h2>Task Orchestration</h2>
      <button onClick={executeTasks}>Run Example Tasks</button>
      <p>Check console for detailed output</p>
    </div>
  );
}

/**
 * Example 4: Interactive LLM Chat
 * Use LLM bridge for interactive conversations
 */
export function LLMChatExample() {
  const llm = new LLMBridge({
    provider: 'anthropic',
    apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
    model: 'claude-opus',
  });

  const conversation = async () => {
    // First message
    const response1 = await llm.prompt('What are the best practices for GraphQL resolvers?');
    console.log('Response 1:', response1);

    // Follow-up (context is preserved)
    const response2 = await llm.prompt('Can you give me an example in TypeScript?');
    console.log('Response 2:', response2);

    // Another follow-up
    const response3 = await llm.prompt('How do I handle errors?');
    console.log('Response 3:', response3);

    // Clear history for new conversation
    llm.clearHistory();
  };

  return (
    <div className="example">
      <h2>LLM Chat</h2>
      <button onClick={conversation}>Start Conversation</button>
      <p>Check console for conversation output</p>
    </div>
  );
}

/**
 * Example 5: Combined React Hook Usage
 * Complete example showing the useIntegration hook in action
 */
export function IntegrationHookExample() {
  const { executeTask, tasks, error, isReady, clearTasks, getStatus } = useIntegration({
    llm: {
      provider: 'anthropic',
      apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
    },
    simulator: {
      port: 4000,
      debug: true,
    },
  });

  const handleGenerateCode = async () => {
    await executeTask({
      name: 'code-gen',
      description: 'Generate boilerplate for a new resolver',
      type: 'generation',
    });
  };

  const handleTestAPI = async () => {
    await executeTask({
      name: 'api-test',
      description: 'Test the API endpoints',
      type: 'query',
    });
  };

  if (!isReady) return <div>Loading integration...</div>;

  const status = getStatus();

  return (
    <div className="example">
      <h2>Integration Hook</h2>
      <div className="controls">
        <button onClick={handleGenerateCode}>Generate Code</button>
        <button onClick={handleTestAPI}>Test API</button>
        <button onClick={clearTasks}>Clear Tasks</button>
      </div>

      {error && <div className="error">Error: {error}</div>}

      <div className="status">
        <h3>Status</h3>
        <pre>{JSON.stringify(status, null, 2)}</pre>
      </div>

      <div className="tasks-list">
        <h3>Recent Tasks ({tasks.length})</h3>
        {tasks.map((task) => (
          <div key={task.id} className={`task status-${task.status}`}>
            <div className="task-header">
              <strong>{task.name}</strong>
              <span className="status-badge">{task.status}</span>
            </div>
            <div className="task-description">{task.description}</div>
            {task.error && <div className="error">{task.error}</div>}
            {task.result && <div className="result">{String(task.result)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * All examples combined for demonstration
 */
export function AllExamples() {
  return (
    <div className="examples-container">
      <h1>LLM + Serverless Integration Examples</h1>
      <CodeGenerationExample />
      <ApiSimulationExample />
      <OrchestrationExample />
      <LLMChatExample />
      <IntegrationHookExample />
    </div>
  );
}
