import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { InterviewContent, ResumeAnalysisResult } from './types';
import {
  buildInterviewFromJDPrompt,
  buildInterviewFromRolePrompt,
  buildResumeAnalysisPrompt,
} from './prompts';
import type { AIProvider } from './provider-types';
import { connectDB } from './mongodb';
import { ApiKey } from './models/ApiKey';
import { decrypt } from './encryption';

export type { AIProvider };

// ─── Provider Config ───────────────────────────────────────────────

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
}

/**
 * Fetches the user's API key config from MongoDB.
 * Falls back to env-var-based keys if no user keys are found.
 */
export async function getProviderConfig(userId?: string): Promise<ProviderConfig> {
  // Try user's saved keys first
  if (userId) {
    try {
      await connectDB();
      const userKey = await ApiKey.findOne({ userId, isDefault: true }).sort({ createdAt: -1 });
      if (userKey) {
        const decrypted = decrypt(userKey.encryptedKey);
        return { provider: userKey.provider, apiKey: decrypted };
      }
      // Fallback: get any key for the user
      const anyKey = await ApiKey.findOne({ userId }).sort({ createdAt: -1 });
      if (anyKey) {
        const decrypted = decrypt(anyKey.encryptedKey);
        return { provider: anyKey.provider, apiKey: decrypted };
      }
    } catch {
      // Fall through to env var fallback
    }
  }

  // Fallback to env vars
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    return { provider: 'gemini', apiKey: geminiKey };
  }

  throw new Error(
    'No AI provider configured. Add an API key in Settings, or set GEMINI_API_KEY in your .env file.'
  );
}

// ─── Core Provider Functions ──────────────────────────────────────

async function geminiGenerateJSON<T>(prompt: string, apiKey: string): Promise<T> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

async function openaiGenerateJSON<T>(prompt: string, apiKey: string): Promise<T> {
  const openai = new OpenAI({ apiKey });
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 8192,
  });
  const text = result.choices[0]?.message?.content || '{}';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

async function claudeGenerateJSON<T>(prompt: string, apiKey: string): Promise<T> {
  const anthropic = new Anthropic({ apiKey });
  const result = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 8192,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = result.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n');
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

async function geminiGenerateText(prompt: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function openaiGenerateText(prompt: string, apiKey: string): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return result.choices[0]?.message?.content?.trim() || '';
}

async function claudeGenerateText(prompt: string, apiKey: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey });
  const result = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });
  return result.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n')
    .trim();
}

// ─── Router ───────────────────────────────────────────────────────

async function generateJSON<T>(
  prompt: string,
  config: ProviderConfig
): Promise<T> {
  switch (config.provider) {
    case 'openai':
      return openaiGenerateJSON<T>(prompt, config.apiKey);
    case 'claude':
      return claudeGenerateJSON<T>(prompt, config.apiKey);
    case 'gemini':
    default:
      return geminiGenerateJSON<T>(prompt, config.apiKey);
  }
}

async function generateText(
  prompt: string,
  config: ProviderConfig
): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return openaiGenerateText(prompt, config.apiKey);
    case 'claude':
      return claudeGenerateText(prompt, config.apiKey);
    case 'gemini':
    default:
      return geminiGenerateText(prompt, config.apiKey);
  }
}

// ─── Public Feature Functions ─────────────────────────────────────

export async function generateInterviewFromJD(
  jobDescription: string,
  config: ProviderConfig
): Promise<InterviewContent> {
  const prompt = buildInterviewFromJDPrompt(jobDescription);
  return generateJSON<InterviewContent>(prompt, config);
}

export async function generateInterviewFromRole(
  input: { role: string; experienceLevel: string; techStack: string[] },
  config: ProviderConfig
): Promise<InterviewContent> {
  const prompt = buildInterviewFromRolePrompt(input as any);
  return generateJSON<InterviewContent>(prompt, config);
}

export async function analyzeResumeVsJD(
  resumeText: string,
  jobDescription: string,
  config: ProviderConfig
): Promise<ResumeAnalysisResult> {
  const prompt = buildResumeAnalysisPrompt(resumeText, jobDescription);
  return generateJSON<ResumeAnalysisResult>(prompt, config);
}
