'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Send, Bot, User, CircleCheck,
  AlertTriangle, LoaderCircle, ArrowLeft, MessageSquare, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { MockInterviewMessage, ExperienceLevel } from '@/lib/types';

export default function MockInterviewPage() {
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('fresher');
  const [techStackInput, setTechStackInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState<MockInterviewMessage[]>([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [sessionContext, setSessionContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addTech = () => {
    const t = techStackInput.trim();
    if (t && !techStack.includes(t)) {
      setTechStack(prev => [...prev, t]);
      setTechStackInput('');
    }
  };

  const startInterview = async () => {
    if (!role.trim()) return toast.error('Please enter a job role');
    if (techStack.length === 0) return toast.error('Add at least one technology');

    const context = `Mock interview for ${role} (${experience}). Tech stack: ${techStack.join(', ')}`;
    setSessionContext(context);
    setLoading(true);
    setSessionStarted(true);

    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionContext: context,
          messages: [],
          action: 'next',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages([{
        role: 'interviewer',
        content: data.question,
        timestamp: new Date().toISOString(),
      }]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to start interview. Check your Gemini API key.');
      setSessionStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setEvaluating(true);

    const userMessage: MockInterviewMessage = {
      role: 'candidate',
      content: answer,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setAnswer('');

    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionContext,
          messages: updatedMessages.slice(0, -1),
          action: 'evaluate',
          question: messages[messages.length - 1]?.content || '',
          answer: answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const evaluatedMessage: MockInterviewMessage = {
        ...userMessage,
        evaluation: data.evaluation,
      };

      const nextQuestion: MockInterviewMessage = {
        role: 'interviewer',
        content: data.nextQuestion,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev.slice(0, -1), evaluatedMessage, nextQuestion]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to evaluate answer');
    } finally {
      setEvaluating(false);
    }
  };

  const reset = () => {
    setSessionStarted(false);
    setMessages([]);
    setAnswer('');
    setRole('');
    setTechStack([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  // Setup screen
  if (!sessionStarted) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-1">Mock Interview</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Practice with an AI interviewer that evaluates your answers in real-time
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 bg-card rounded-xl p-4 sm:p-6 border border-border"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Job Role</Label>
              <Input
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Full Stack Developer"
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
                value={techStackInput}
                onChange={e => setTechStackInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTech()}
                placeholder="e.g. React, Node.js, PostgreSQL..."
              />
              <Button variant="outline" size="icon" onClick={addTech} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {techStack.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={startInterview}
            disabled={!role.trim() || techStack.length === 0 || loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            Start Interview
          </Button>
        </motion.div>
      </div>
    );
  }

  // Interview chat screen
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={reset}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{role} Mock Interview</h3>
            <p className="text-xs text-muted-foreground truncate">{experience} — {techStack.join(', ')}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs flex-shrink-0">
          Q{messages.filter(m => m.role === 'interviewer').length}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex gap-3 max-w-3xl mx-auto',
              msg.role === 'candidate' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'interviewer' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <div className={cn(
              'space-y-2 max-w-[80%] sm:max-w-[70%]',
              msg.role === 'candidate' && 'items-end'
            )}>
              <div className={cn(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'interviewer'
                  ? 'bg-card border border-border rounded-bl-md'
                  : 'bg-primary text-primary-foreground rounded-br-md'
              )}>
                {msg.content}
              </div>

              {/* Evaluation feedback */}
              {msg.evaluation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-card border border-border rounded-xl p-3 sm:p-4 space-y-3"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium">Correctness</span>
                      <span className={cn(
                        'text-xs font-bold',
                        msg.evaluation.correctness >= 80 ? 'text-emerald-500' :
                        msg.evaluation.correctness >= 50 ? 'text-amber-500' : 'text-red-500'
                      )}>
                        {msg.evaluation.correctness}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">Confidence</span>
                      <span className={cn(
                        'text-xs font-bold',
                        msg.evaluation.confidence >= 80 ? 'text-emerald-500' :
                        msg.evaluation.confidence >= 50 ? 'text-amber-500' : 'text-red-500'
                      )}>
                        {msg.evaluation.confidence}%
                      </span>
                    </div>
                  </div>

                  {msg.evaluation.missingPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-500 flex items-center gap-1 mb-1.5">
                        <AlertTriangle className="h-3 w-3" /> Missing Points
                      </p>
                      <ul className="space-y-1">
                        {msg.evaluation.missingPoints.map((point, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.evaluation.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-1.5">
                        <Sparkles className="h-3 w-3" /> Suggestions
                      </p>
                      <ul className="space-y-1">
                        {msg.evaluation.suggestions.map((suggestion, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {msg.role === 'candidate' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </motion.div>
        ))}

        {evaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 max-w-3xl mx-auto"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <LoaderCircle className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="text-sm text-muted-foreground">Evaluating your answer...</div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4 sm:p-6">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <Textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer... (Enter to submit, Shift+Enter for new line)"
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={evaluating}
            rows={1}
          />
          <Button
            onClick={submitAnswer}
            disabled={!answer.trim() || evaluating}
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0"
          >
            {evaluating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
