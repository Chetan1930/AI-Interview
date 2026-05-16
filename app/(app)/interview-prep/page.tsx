'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InterviewResults } from '@/components/interview/interview-results';
import { InterviewSkeleton } from '@/components/interview/skeleton-loader';
import { Sparkles, X, Plus, FileText, Briefcase } from 'lucide-react';
import type { InterviewContent, ExperienceLevel } from '@/lib/types';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export default function InterviewPrepPage() {
  const [jd, setJd] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('fresher');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<InterviewContent | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [activeTab, setActiveTab] = useState('jd');
  const { addSession } = useAppStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'jd' || tab === 'role') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const addTech = () => {
    const t = techInput.trim();
    if (t && !techStack.includes(t)) {
      setTechStack(prev => [...prev, t]);
      setTechInput('');
    }
  };

  const removeTech = (t: string) => setTechStack(prev => prev.filter(x => x !== t));

  const generateFromJD = async () => {
    if (!jd.trim()) return toast.error('Please paste a job description');
    setLoading(true);
    setContent(null);
    try {
      const res = await fetch('/api/interview/from-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(data.content);
      const title = jd.slice(0, 50).trim() + '...';
      setSessionTitle(title);
      await saveSessionToMongo({ session_type: 'jd', input_data: { jobDescription: jd }, title, content: data.content });
      toast.success('Interview pack saved to your sessions');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const generateFromRole = async () => {
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
      await saveSessionToMongo({ session_type: 'role', input_data: { role, experienceLevel: experience, techStack }, title, content: data.content });
      toast.success('Interview pack saved to your sessions');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const saveSessionToMongo = async (params: {
    session_type: 'jd' | 'role';
    input_data: object;
    title: string;
    content: InterviewContent;
  }) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: params.title,
          sessionType: params.session_type,
          inputData: params.input_data,
          generatedContent: params.content,
        }),
      });
    } catch (e) {
      console.error('Failed to save session to MongoDB:', e);
    }

    // Also save to local store as fallback
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-1">Interview Preparation</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Generate tailored interview questions from a job description or role</p>
      </div>

      {!content && !loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="jd" className="text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> JD
            </TabsTrigger>
            <TabsTrigger value="role" className="text-xs sm:text-sm">
              <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Role
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jd" className="mt-4 sm:mt-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Paste Job Description</Label>
                <Textarea
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[200px] sm:min-h-[280px] font-mono text-xs resize-none"
                />
                <p className="text-xs text-muted-foreground">{jd.length} characters</p>
              </div>
              <Button onClick={generateFromJD} disabled={!jd.trim()} className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" /> Generate Interview Pack
              </Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="role" className="mt-4 sm:mt-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Job Role</Label>
                  <Input
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Backend Developer"
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
                    placeholder="e.g. React, Django, PostgreSQL..."
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

              <Button onClick={generateFromRole} disabled={!role.trim() || techStack.length === 0} className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" /> Generate Interview Pack
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>
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
                <p className="text-xs text-muted-foreground">Interview preparation ready</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={() => { setContent(null); setJd(''); setRole(''); setTechStack([]); }}
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
