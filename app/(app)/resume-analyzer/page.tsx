'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ResumeUpload } from '@/components/resume/resume-upload';
import { AnalysisResults } from '@/components/resume/analysis-results';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import type { ResumeAnalysisResult } from '@/lib/types';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';

export default function ResumeAnalyzerPage() {
  const [resumeText, setResumeText] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const { addAnalysis } = useAppStore();

  const analyze = async () => {
    if (!resumeText.trim()) {
      return toast.error('Please upload or paste your resume');
    }
    if (!jd.trim()) {
      return toast.error('Please paste a job description');
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/resume-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      saveAnalysis(data.result);
      toast.success('Analysis saved to your sessions');
    } catch (e: any) {
      toast.error(e.message || 'Failed to analyze resume. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (analysisResult: ResumeAnalysisResult) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Resume Analysis - ${analysisResult.atsScore}%`,
          sessionType: 'resume-analysis',
          inputData: {
            resumeText: resumeText.slice(0, 5000),
            jobDescription: jd.slice(0, 5000),
          },
          generatedContent: {
            ...analysisResult,
          },
        }),
      });
    } catch (e) {
      console.error('Failed to save analysis to MongoDB:', e);
    }

    addAnalysis({
      id: crypto.randomUUID(),
      resume_text: resumeText.slice(0, 5000),
      job_description: jd.slice(0, 5000),
      analysis_result: analysisResult,
      ats_score: analysisResult.atsScore,
      created_at: new Date().toISOString(),
    } as any);
  };

  const reset = () => {
    setResumeText('');
    setJd('');
    setResult(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-1">Resume Analyzer</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Compare your resume against a job description and get ATS score</p>
      </div>

      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Resume */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Your Resume</Label>
              <ResumeUpload onTextExtracted={setResumeText} />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">or paste as text</Label>
                <Textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste your resume here if you don't want to upload..."
                  className="min-h-[180px] sm:min-h-[240px] font-mono text-xs resize-none"
                />
              </div>
            </div>

            {/* JD */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Job Description</Label>
              <Textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Paste the job description here..."
                className="min-h-[360px] sm:min-h-[512px] font-mono text-xs resize-none"
              />
            </div>
          </div>

          <Button
            onClick={analyze}
            disabled={!resumeText.trim() || !jd.trim()}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4 mr-2" /> Analyze Resume
          </Button>
        </motion.div>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base">Analysis Complete</h3>
                <p className="text-xs text-muted-foreground">Detailed breakdown of your resume vs job description</p>
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="flex-shrink-0">
                Analyze Again
              </Button>
            </div>
            <AnalysisResults result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
