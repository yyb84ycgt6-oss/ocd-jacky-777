/**
 * LLM Bridge - Unified interface for LLM interactions
 * Provides a simple, flowing API for accessing language models
 */

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'local';
  apiKey?: string;
  model?: string;
  streaming?: boolean;
  temperature?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  text: string;
  model: string;
  tokensUsed?: number;
  timestamp: Date;
}

class LLMBridge {
  private config: LLMConfig;
  private conversationHistory: LLMMessage[] = [];

  constructor(config: LLMConfig) {
    this.config = {
      streaming: false,
      temperature: 0.7,
      ...config,
    };
  }

  async prompt(message: string, systemPrompt?: string): Promise<LLMResponse> {
    const messages: LLMMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: message });
    messages.push(...this.conversationHistory);

    try {
      const response = await this.callProvider(messages);
      this.conversationHistory.push({ role: 'user', content: message });
      this.conversationHistory.push({ role: 'assistant', content: response.text });
      return response;
    } catch (error) {
      throw new Error(`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      return await this.callProvider(messages);
    } catch (error) {
      throw new Error(`LLM chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private async callProvider(messages: LLMMessage[]): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'anthropic':
        return this.callAnthropic(messages);
      case 'openai':
        return this.callOpenAI(messages);
      case 'gemini':
        return this.callGemini(messages);
      case 'local':
        return this.callLocal(messages);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  private async callAnthropic(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }
    // Placeholder for Anthropic integration
    return {
      text: 'Anthropic integration ready',
      model: this.config.model || 'claude-opus',
      timestamp: new Date(),
    };
  }

  private async callOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    // Placeholder for OpenAI integration
    return {
      text: 'OpenAI integration ready',
      model: this.config.model || 'gpt-4',
      timestamp: new Date(),
    };
  }

  private async callGemini(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    // Placeholder for Gemini integration
    return {
      text: 'Gemini integration ready',
      model: this.config.model || 'gemini-pro',
      timestamp: new Date(),
    };
  }

  private async callLocal(messages: LLMMessage[]): Promise<LLMResponse> {
    // Local/offline LLM support
    return {
      text: 'Local LLM response',
      model: this.config.model || 'local-model',
      timestamp: new Date(),
    };
  }
}

export default LLMBridge;
