export type AIProvider = 'gemini' | 'openai' | 'claude';

export function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case 'gemini':
      return 'Google Gemini (Gemini 2.0 Flash)';
    case 'openai':
      return 'OpenAI (GPT-4o Mini)';
    case 'claude':
      return 'Anthropic (Claude 3.5 Haiku)';
  }
}

export function getProviderIcon(provider: AIProvider): string {
  switch (provider) {
    case 'gemini': return '🔮';
    case 'openai': return '🤖';
    case 'claude': return '🟣';
  }
}

export const PROVIDER_DOCS: Record<AIProvider, string> = {
  gemini: 'https://aistudio.google.com/app/apikey',
  openai: 'https://platform.openai.com/api-keys',
  claude: 'https://console.anthropic.com/settings/keys',
};

export const VALID_PROVIDERS: AIProvider[] = ['gemini', 'openai', 'claude'];
