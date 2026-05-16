'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, LoaderCircle, Brain, FileText, MessageSquare, Trash2,
  Sparkles, BookOpen, Briefcase, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { InterviewResults } from '@/components/interview/interview-results';
import { AnalysisResults } from '@/components/resume/analysis-results';
import type { InterviewContent, ResumeAnalysisResult } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Session not found');
        setSession(data.session);
      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Session deleted');
      router.push('/sessions');
    } catch {
      toast.error('Failed to delete session');
      setDeleting(false);
    }
  };

  const getSessionMeta = () => {
    if (!session) return { icon: Brain, label: '', color: '', bg: '' };
    switch (session.sessionType) {
      case 'jd':
        return { icon: BookOpen, label: 'From Job Description', color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'role':
        return { icon: Briefcase, label: 'From Role', color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'mock-interview':
        return { icon: MessageSquare, label: 'Mock Interview', color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'resume-analysis':
        return { icon: FileText, label: 'Resume Analysis', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      default:
        return { icon: Brain, label: 'Session', color: 'text-primary', bg: 'bg-primary/10' };
    }
  };

  // Get contextual action buttons
  const getContextualActions = () => {
    if (!session) return null;
    const input = session.inputData || {};

    switch (session.sessionType) {
      case 'jd':
        return (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="default">
              <Link href={`/interview-prep?tab=jd`}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> New Prep from JD
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/mock-interview`}>
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Mock Interview
              </Link>
            </Button>
          </div>
        );
      case 'role':
        const role = input.role || '';
        const tech = (input.techStack || []).join(', ');
        return (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="default">
              <Link href={`/general-prep`}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> New Prep for {role || 'Role'}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/mock-interview`}>
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Mock Interview as {role || 'Role'}
              </Link>
            </Button>
          </div>
        );
      case 'resume-analysis':
        return (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="default">
              <Link href="/resume-analyzer">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Analyze New Resume
              </Link>
            </Button>
          </div>
        );
      case 'mock-interview':
        return (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="default">
              <Link href="/mock-interview">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> New Mock Interview
              </Link>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <LoaderCircle className="h-5 w-5 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'Session not found'}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/sessions')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const meta = getSessionMeta();
  const Icon = meta.icon;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header with back, title, delete */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5 flex-shrink-0" onClick={() => router.push('/sessions')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold truncate">{session.title}</h2>
                <Badge variant="secondary" className={`${meta.bg} ${meta.color} border-0 text-xs flex-shrink-0`}>
                  <Icon className="h-3 w-3 mr-1" />
                  {meta.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                {' • '}
                {new Date(session.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The session and all its content will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Contextual action buttons */}
      <div className="flex flex-wrap gap-2">
        {getContextualActions()}
      </div>

      {/* Session content */}
      {session.sessionType === 'resume-analysis' && session.generatedContent ? (
        <AnalysisResults result={session.generatedContent as ResumeAnalysisResult} />
      ) : session.generatedContent ? (
        <InterviewResults content={session.generatedContent as InterviewContent} sessionTitle={session.title} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No generated content</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {session.sessionType === 'mock-interview'
                ? 'This mock interview session was saved but the conversation transcript is not available for replay.'
                : 'This session does not have any generated content to display.'}
            </p>
          </div>
          {getContextualActions()}
        </motion.div>
      )}
    </div>
  );
}
