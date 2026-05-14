'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InterviewResults } from '@/components/interview/interview-results';
import { InterviewSkeleton } from '@/components/interview/skeleton-loader';
import { Sparkles, X, Plus, Loader as Loader2 } from 'lucide-react';
import type { InterviewContent, ExperienceLevel } from '@/lib/types';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';

export default function GeneralPrepPage() {
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('fresher');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<InterviewContent | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const { addSession } = useAppStore();

  const addTech = () => {
    const t = techInput.trim();
    if (t && !techStack.includes(t)) {
      setTechStack(prev => [...prev, t]);
      setTechInput('');
    }
  };

  const removeTech = (t: string) => setTechStack(prev => prev.filter(x => x !== t));

  const generate = async () => {
    if (!role.trim()) return toast.error('Please enter a job role');
    if (techStack.length === 0) return toast.error('Add at least one technology');
    setLoading(true);
    setContent(null);
    try {
      const res = await fetch('/api/interview/from-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, experienceLevel: experience, techStack }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.content);
      const title = `${role} — ${experience} (${techStack.slice(0, 3).join(', ')})`;
      setSessionTitle(title);
      await saveSession({ session_type: 'role', input_data: { role, experienceLevel: experience, techStack }, title, content: data.content });
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (params: {
    session_type: 'role';
    input_data: object;
    title: string;
    content: InterviewContent;
  }) => {
    addSession({
      id: crypto.randomUUID(),
      title: params.title,
      session_type: params.session_type,
      input_data: params.input_data,
      generated_content: params.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-1">General Interview Preparation</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Prepare for interviews by role and tech stack without a specific job description</p>
      </div>

      {!content && !loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 bg-card rounded-xl p-4 sm:p-6 border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Job Role</Label>
              <Input
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
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
                onKeyDown={e => e.key === 'Enter' && addTech()}
                placeholder="e.g. React, TypeScript, Node.js..."
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

          <Button onClick={generate} disabled={!role.trim() || techStack.length === 0} className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4 mr-2" /> Generate Prep Material
          </Button>
        </motion.div>
      )}

      {loading && <InterviewSkeleton />}

      <AnimatePresence>
        {content && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">{sessionTitle}</h3>
                <p className="text-xs text-muted-foreground">Comprehensive prep material</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={() => { setContent(null); setRole(''); setTechStack([]); }}
              >
                New Session
              </Button>
            </div>
            <InterviewResults content={content} sessionTitle={sessionTitle} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
