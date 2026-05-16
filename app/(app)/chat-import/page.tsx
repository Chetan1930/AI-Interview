'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, WandSparkles, RotateCcw,
  Link as LinkIcon, LoaderCircle, CheckCircle2,
  ChevronDown, Globe, Clock, ChevronRight, Send, X,
} from 'lucide-react';
import { ChatMessage, type ChatMessageData } from '@/components/chat/chat-message';
import { VoiceRecorder, SpeakButton } from '@/components/voice/voice-recorder';
import { useAppStore } from '@/store/appStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────

interface ParseResult {
  messages: ChatMessageData[];
  detectedProvider: string;
}

// ─── Parser ────────────────────────────────────────────────────────

const PROVIDER_DETECTORS = [
  { name: 'ChatGPT', patterns: ['chatgpt', 'openai', 'gpt-'] },
  { name: 'Claude', patterns: ['claude', 'anthropic'] },
  { name: 'Gemini', patterns: ['gemini', 'bard', 'google ai'] },
  { name: 'DeepSeek', patterns: ['deepseek'] },
  { name: 'Mistral', patterns: ['mistral', 'le chat'] },
  { name: 'Copilot', patterns: ['copilot', 'bing', 'microsoft'] },
];

function detectProvider(text: string): string {
  const lower = text.toLowerCase();
  for (const p of PROVIDER_DETECTORS) {
    if (p.patterns.some(pt => lower.includes(pt))) return p.name;
  }
  return 'AI Assistant';
}

function parseChat(text: string): ParseResult {
  const lines = text.split('\n');
  const messages: ChatMessageData[] = [];
  let currentRole: 'user' | 'assistant' | null = null;
  let currentContent: string[] = [];

  const flush = () => {
    if (currentRole && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (content) messages.push({ role: currentRole, content });
    }
    currentContent = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    let matched = false;

    const userPattern = /^(\*\*)?(User|Human|You)(\*\*)?:\s*(.*)/i;
    const assistantPattern = /^(\*\*)?(Assistant|AI|ChatGPT|Claude|Gemini|Model|Bot)(\*\*)?:\s*(.*)/i;
    // Handle #### Speaker said: format (e.g. from raw ChatGPT share pages)
    const chatgptUserPattern = /^#### You said:\s*/i;
    const chatgptAssistantPattern = /^#### (ChatGPT|Claude|Gemini|Assistant|AI|Model|Bot) said:\s*/i;

    const userMatch = line.match(userPattern);
    const assistantMatch = line.match(assistantPattern);
    const cgptUserMatch = line.match(chatgptUserPattern);
    const cgptAssistantMatch = line.match(chatgptAssistantPattern);

    if (userMatch || cgptUserMatch) {
      flush();
      currentRole = 'user';
      const content = userMatch ? (userMatch[4] || '') : line.replace(chatgptUserPattern, '').trim();
      if (content) currentContent.push(content);
      matched = true;
    } else if (assistantMatch || cgptAssistantMatch) {
      flush();
      currentRole = 'assistant';
      const content = assistantMatch ? (assistantMatch[4] || '') : line.replace(chatgptAssistantPattern, '').trim();
      if (content) currentContent.push(content);
      matched = true;
    }

    if (!matched && currentRole) {
      currentContent.push(line);
    }

    if (!currentRole && line.trim() && !/^[-=*_]{3,}$/.test(line.trim())) {
      currentRole = 'assistant';
      currentContent.push(line);
    }
  }

  flush();

  if (messages.length === 0 && text.trim()) {
    messages.push({ role: 'assistant', content: text.trim() });
  }

  return { messages, detectedProvider: detectProvider(text) };
}

// ─── Save helper ───────────────────────────────────────────────────

async function saveChatToSession(
  messages: ChatMessageData[],
  provider: string,
  rawText: string,
  addSession: any,
): Promise<string | null> {
  const title = (messages[0]?.content.slice(0, 60).trim() || 'Chat') +
    (messages[0]?.content.length > 60 ? '...' : '');

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${provider} Chat — ${title}`,
        sessionType: 'chat-import',
        inputData: { provider, messageCount: messages.length },
        generatedContent: { provider, messages, rawText },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save');

    addSession({
      id: data.session?.id || crypto.randomUUID(),
      title: `${provider} Chat — ${title}`,
      session_type: 'chat-import',
      input_data: { provider, messageCount: messages.length },
      generated_content: { provider, messages },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    return data.session?.id || null;
  } catch (e) {
    console.error('Failed to save chat:', e);
    return null;
  }
}

// ─── Provider colors ───────────────────────────────────────────────

const PROVIDER_META: Record<string, { color: string; label: string }> = {
  ChatGPT: { color: '#10a37f', label: 'ChatGPT' },
  Claude: { color: '#d97757', label: 'Claude' },
  Gemini: { color: '#4285f4', label: 'Gemini' },
  DeepSeek: { color: '#4f6bf5', label: 'DeepSeek' },
  Mistral: { color: '#ff6b35', label: 'Mistral' },
  Copilot: { color: '#0078d4', label: 'Copilot' },
};

function getProviderColor(provider: string): string {
  return PROVIDER_META[provider]?.color || '#888';
}



// ─── Main Page ─────────────────────────────────────────────────────

export default function ChatImportPage() {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [recentImports, setRecentImports] = useState<any[]>([]);
  const [importsLoading, setImportsLoading] = useState(true);
  const [voiceText, setVoiceText] = useState('');
  const { addSession } = useAppStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [parsed?.messages.length]);

  // Fetch recent imports
  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch('/api/sessions?type=chat-import&limit=5');
        const data = await res.json();
        setRecentImports(data.sessions || []);
      } catch {
        // silently fail
      } finally {
        setImportsLoading(false);
      }
    }
    fetchRecent();
  }, []);

  // Refresh the recent imports list
  const refreshRecentImports = async () => {
    try {
      const res = await fetch('/api/sessions?type=chat-import&limit=5');
      const data = await res.json();
      setRecentImports(data.sessions || []);
    } catch {
      // silently fail
    }
  };

  // ── Import from URL ──

  const handleFetchFromUrl = async () => {
    if (!importUrl.trim()) return toast.error('Please enter a chat share URL');
    setFetching(true);

    try {
      const res = await fetch('/api/import-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Failed to import chat');

      const result = parseChat(data.content);
      if (result.messages.length === 0) {
        return toast.error('Could not detect any messages in this conversation.');
      }

      setParsed(result);
      setInputText(data.content);

      // Auto-save
      setSaving(true);
      const id = await saveChatToSession(result.messages, result.detectedProvider, data.content, addSession);
      if (id) setSessionId(id);
      setSaving(false);

      // Refresh recent imports
      refreshRecentImports();

      toast.success(
        `Imported ${result.messages.length} messages from ${result.detectedProvider} · Saved`,
        { duration: 3000 },
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch the link.');
    } finally {
      setFetching(false);
    }
  };

  // ── Format pasted text ──

  const handleParse = async () => {
    if (!inputText.trim()) return toast.error('Please paste a chat conversation');
    const result = parseChat(inputText);
    if (result.messages.length === 0) {
      return toast.error('Could not detect any messages. Try a different format.');
    }

    setParsed(result);
    setImportUrl('');

    // Auto-save
    setSaving(true);
    const id = await saveChatToSession(result.messages, result.detectedProvider, inputText, addSession);
    if (id) setSessionId(id);
    setSaving(false);

    // Refresh recent imports
    refreshRecentImports();

    toast.success(
      `Formatted ${result.messages.length} messages from ${result.detectedProvider} · Saved`,
      { duration: 3000 },
    );
  };

  const handleNew = () => {
    setInputText('');
    setImportUrl('');
    setParsed(null);
    setSessionId(null);
    setShowPaste(false);
    setVoiceText('');
  };

  // ── Voice Send ──

  const handleVoiceSend = () => {
    if (!voiceText.trim() || !parsed) return;

    // Add user message to the conversation
    const newMsg: ChatMessageData = {
      role: 'user',
      content: voiceText.trim(),
    };

    // Create a new ParseResult with the added message
    setParsed({
      ...parsed,
      messages: [...parsed.messages, newMsg],
    });

    setVoiceText('');

    // Auto-scroll to bottom
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // ── Keyboard shortcut: Ctrl+Enter for voice send ──

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleVoiceSend();
    }
  }, [handleVoiceSend]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Conversation View ──

  if (parsed) {
    const provider = parsed.detectedProvider;
    const color = getProviderColor(provider);
    const userCount = parsed.messages.filter(m => m.role === 'user').length;
    const aiCount = parsed.messages.filter(m => m.role === 'assistant').length;

    return (
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + '18' }}
              >
                <MessageSquare className="w-4 h-4" style={{ color }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">
                    {provider} Conversation
                  </span>
                  {sessionId && (
                    <Badge variant="outline" className="h-5 text-[10px] gap-1 border-green-500/30 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                  {saving && (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {parsed.messages.length} messages · {userCount} user, {aiCount} AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleNew} className="text-xs h-8">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                New Import
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32">
            <div className="text-center mb-8 sm:mb-12">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: color + '15' }}
              >
                <MessageSquare className="w-6 h-6" style={{ color }} />
              </div>
              <h1 className="text-lg font-bold">{provider} Conversation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {parsed.messages.length} messages · Imported from share link
              </p>
            </div>

            <div className="space-y-1">
              {parsed.messages.map((msg, i) => (
                <div key={i} className="group/message relative">
                  <ChatMessage message={msg} index={i} />
                  {/* Speak button on assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="absolute -bottom-1 left-14 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200">
                      <SpeakButton text={msg.content} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ── Voice Input Bar ── */}
        <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
            <VoiceRecorder
              onTranscript={(text) => {
                setVoiceText(text);
                // Auto-focus the input so user can edit/send
                setTimeout(() => voiceInputRef.current?.focus(), 100);
              }}
            />
            <div className="flex-1 relative">
              <input
                ref={voiceInputRef}
                type="text"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && voiceText.trim()) {
                    handleVoiceSend();
                  }
                }}
                placeholder={parsed.messages.length > 0 ? 'Ask a question or reply via voice...' : 'Start the interview by speaking...'}
                className="w-full h-10 px-4 pr-10 text-sm rounded-xl border border-border/60 bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
              {voiceText.trim() && (
                <button
                  onClick={() => {
                    setVoiceText('');
                    voiceInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleVoiceSend}
              disabled={!voiceText.trim()}
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                voiceText.trim()
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90'
                  : 'bg-muted/60 text-muted-foreground/50 cursor-not-allowed'
              }`}
              title="Send voice message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Input / Landing View ──

  return (
    <div className="flex flex-col min-h-full">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      {/* ── Import Form ── */}
      <div className="pt-6 sm:pt-10 pb-4 sm:pb-6 px-4 sm:px-6 relative z-[1]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Import a Chat
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Paste a share link from ChatGPT, Claude, Gemini, or any AI assistant.
              We&apos;ll fetch, format, and save it automatically.
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <LinkIcon className="h-4 w-4" />
              </div>
              <Input
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder="https://chatgpt.com/share/..."
                className="pl-10 pr-4 h-12 text-sm rounded-xl border-border/60 bg-card shadow-sm"
                onKeyDown={e => e.key === 'Enter' && handleFetchFromUrl()}
              />
            </div>
            <Button
              onClick={handleFetchFromUrl}
              disabled={fetching || !importUrl.trim()}
              className="w-full h-11 rounded-xl text-sm font-medium"
            >
              {fetching ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Fetching conversation...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Import from Link
                </span>
              )}
            </Button>
            <div className="flex items-center justify-center gap-2 pt-1">
              {Object.entries(PROVIDER_META).map(([name]) => (
                <span
                  key={name}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <button
              onClick={() => setShowPaste(!showPaste)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {showPaste ? 'Hide paste' : 'Paste text instead'}
              <ChevronDown className={`h-3 w-3 transition-transform ${showPaste ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <AnimatePresence>
            {showPaste && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  <Textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Paste conversation text here...\n\nSupported formats:\n**User:** your question\n**Assistant:** the response\n\nUser: hello\nChatGPT: hi!`}
                    className="min-h-[200px] font-mono text-xs resize-none rounded-xl border-border/60 bg-card shadow-sm"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {inputText.length > 0 ? `${inputText.length} characters` : ''}
                    </p>
                    <Button
                      onClick={handleParse}
                      disabled={!inputText.trim()}
                      size="sm"
                      className="rounded-lg"
                    >
                      <WandSparkles className="h-3.5 w-3.5 mr-1.5" />
                      Format &amp; Save
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Recent Imports ── */}
      <div className="flex-1 px-4 sm:px-6 pb-6 sm:pb-10 relative z-[1]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Imports
            </h3>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              <Link href="/sessions?type=chat-import">
                View All <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </Button>
          </div>

          {importsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentImports.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No imported chats yet</p>
              <p className="text-[11px] text-muted-foreground/60">
                Use the link importer above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentImports.map((session, i) => {
                const provider = session.inputData?.provider || 'AI Assistant';
                const color = getProviderColor(provider);
                // Extract message count from inputData
                const msgCount = session.inputData?.messageCount || '—';
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/sessions/${session._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color + '15' }}
                      >
                        <MessageSquare className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{msgCount} messages</span>
                          <span>·</span>
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
