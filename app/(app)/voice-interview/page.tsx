'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatMessage, type ChatMessageData } from '@/components/chat/chat-message';
import { VoiceRecorder, SpeakButton } from '@/components/voice/voice-recorder';
import {
  Mic, Sparkles, X, Plus, Send,
  LoaderCircle, CheckCircle2, MessageSquare,
} from 'lucide-react';
import type { ExperienceLevel } from '@/lib/types';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────

interface InterviewMessage extends ChatMessageData {
  id: string;
  evaluation?: string;
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function VoiceInterviewPage() {
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('fresher');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [stage, setStage] = useState<'setup' | 'interview'>('setup');
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Tech stack helpers ──

  const addTech = () => {
    const t = techInput.trim();
    if (t && !techStack.includes(t)) {
      setTechStack(prev => [...prev, t]);
      setTechInput('');
    }
  };

  const removeTech = (t: string) => setTechStack(prev => prev.filter(x => x !== t));

  // ── Start Interview ──

  const startInterview = async () => {
    if (!role.trim()) return toast.error('Please enter a job role');
    if (techStack.length === 0) return toast.error('Add at least one technology');

    // Save session
    setSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Voice Interview — ${role} (${experience})`,
          sessionType: 'voice-interview',
          inputData: { role: role.trim(), experienceLevel: experience, techStack },
          generatedContent: { messages: [] },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSessionId(data.session?.id || null);
    } catch (e: any) {
      console.error('Failed to save session:', e);
    }
    setSaving(false);

    setStage('interview');
    startTimeRef.current = Date.now();

    // Ask first question
    await askNextQuestion([], role.trim(), experience, techStack);
  };

  // ── Ask next question ──

  const askNextQuestion = async (
    prevMessages: InterviewMessage[],
    currentRole: string,
    currentExp: string,
    currentTech: string[],
  ) => {
    setAsking(true);

    const conversationContext = prevMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionContext: {
            role: currentRole,
            experience: currentExp,
            techStack: currentTech,
          },
          messages: conversationContext,
          action: 'next',
        }),
      });

      const data = await res.json();
      const question = data.question || "Could you tell me about your experience with this role?";

      const newMsg: InterviewMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: question,
      };

      setMessages(prev => [...prev, newMsg]);
    } catch (e: any) {
      const fallback: InterviewMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Tell me about your experience with " + currentTech[0] + ".",
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setAsking(false);
    }
  };

  // ── Submit answer ──

  const submitAnswer = useCallback(async (answer: string) => {
    if (!answer.trim() || evaluating) return;

    setEvaluating(true);

    const userMsg: InterviewMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: answer.trim(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setVoiceInput('');

    // Get the last assistant question
    const lastAssistantIndex = [...updatedMessages].reverse().findIndex(m => m.role === 'assistant');
    const lastQuestion = lastAssistantIndex >= 0
      ? updatedMessages[updatedMessages.length - 1 - lastAssistantIndex].content
      : '';

    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionContext: {
            role,
            experience,
            techStack,
          },
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          action: 'evaluate',
          question: lastQuestion,
          answer: answer.trim(),
        }),
      });

      const data = await res.json();

      // Save evaluation
      if (data.evaluation) {
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, evaluation: data.evaluation }
              : m
          )
        );
      }

      // Ask next question
      if (data.nextQuestion) {
        const nextQ: InterviewMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.nextQuestion,
        };
        setMessages(prev => [...prev, nextQ]);
      } else {
        // Fallback question
        await askNextQuestion(
          [...updatedMessages],
          role,
          experience,
          techStack,
        );
      }
    } catch {
      // Fallback — just ask another question
      await askNextQuestion(
        [...updatedMessages],
        role,
        experience,
        techStack,
      );
    } finally {
      setEvaluating(false);
    }
  }, [messages, evaluating, role, experience, techStack]);

  // ── Voice send ──

  const handleVoiceSend = useCallback(() => {
    if (!voiceInput.trim()) return;
    submitAnswer(voiceInput);
  }, [voiceInput, submitAnswer]);

  // ── End interview session ──

  const endInterview = async () => {
    // Update the session with full conversation
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedContent: {
            messages,
            role,
            experience,
            techStack,
            duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
          },
        }),
      });
    } catch (e) {
      console.error('Failed to update session:', e);
    }

    toast.success('Interview ended. Session saved.');
    setStage('setup');
    setMessages([]);
    setSessionId(null);
    setRole('');
    setExperience('fresher');
    setTechStack([]);
  };

  // ── Setup View ──

  if (stage === 'setup') {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-1">Voice Interview</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Practice your interview skills by speaking your answers naturally
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg space-y-5"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/[0.04] border border-primary/10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              You&apos;ll be asked interview questions one at a time. <strong>Speak your answers</strong> using the microphone &mdash; they&apos;ll be transcribed and evaluated in real time.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Job Role</Label>
              <Input
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
                onKeyDown={e => e.key === 'Enter' && startInterview()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Experience Level</Label>
              <Select value={experience} onValueChange={v => setExperience(v as ExperienceLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['fresher', '1-2 years', '3-5 years', '5+ years'] as ExperienceLevel[]).map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Tech Stack</Label>
            <div className="flex gap-2">
              <Input
                value={techInput}
                onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (addTech(), e.preventDefault())}
                placeholder="e.g. React, Node.js, TypeScript..."
              />
              <Button variant="outline" size="icon" onClick={addTech} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {techStack.map(t => (
                  <Badge key={t} variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                    {t}
                    <button onClick={() => removeTech(t)} className="rounded-full hover:bg-muted p-0.5">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={startInterview}
            disabled={!role.trim() || techStack.length === 0 || saving}
            size="lg"
            className="w-full sm:w-auto"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Creating session...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Start Voice Interview
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Interview View ──

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">
                  Voice Interview — {role}
                </span>
                {sessionId && (
                  <Badge variant="outline" className="h-5 text-[10px] gap-1 border-green-500/30 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Live
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {experience} · {techStack.slice(0, 3).join(', ')}
                {techStack.length > 3 && ` +${techStack.length - 3}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={endInterview} className="text-xs h-8 text-muted-foreground hover:text-destructive">
              End Interview
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32 space-y-1">
          {messages.map((msg, i) => (
            <div key={msg.id} className="group/message relative">
              <ChatMessage message={msg} index={i} />
              {/* Speak button on assistant messages */}
              {msg.role === 'assistant' && (
                <div className="absolute -bottom-1 left-14 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200">
                  <SpeakButton text={msg.content} />
                </div>
              )}
              {/* Evaluation note on user messages */}
              {msg.role === 'user' && msg.evaluation && (
                <div className="ml-14 mt-1.5 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
                    {msg.evaluation}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {asking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-start"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 flex items-center justify-center flex-shrink-0 mt-1 ring-2 ring-background">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Voice Input Bar */}
      <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <VoiceRecorder
            onTranscript={(text) => {
              setVoiceInput(text);
              setTimeout(() => voiceInputRef.current?.focus(), 100);
            }}
            disabled={asking || evaluating}
          />
          <div className="flex-1 relative">
            <input
              ref={voiceInputRef}
              type="text"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && voiceInput.trim() && !evaluating) {
                  handleVoiceSend();
                }
              }}
              placeholder={evaluating ? 'Evaluating your answer...' : asking ? 'Waiting for next question...' : 'Speak or type your answer...'}
              disabled={asking || evaluating}
              className="w-full h-10 px-4 pr-10 text-sm rounded-xl border border-border/60 bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-50"
            />
            {voiceInput.trim() && !asking && !evaluating && (
              <button
                onClick={() => { setVoiceInput(''); voiceInputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleVoiceSend}
            disabled={!voiceInput.trim() || asking || evaluating}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              voiceInput.trim() && !asking && !evaluating
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90'
                : evaluating
                  ? 'bg-amber-500/10 text-amber-500'
                  : asking
                    ? 'bg-muted/60 text-muted-foreground/50'
                    : 'bg-muted/60 text-muted-foreground/50 cursor-not-allowed'
            }`}
            title="Send answer"
          >
            {evaluating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
