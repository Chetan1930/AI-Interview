'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Briefcase, ArrowRight, Clock, Brain,
  TrendingUp, Zap, ChevronRight, LoaderCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const quickActions = [
  {
    title: 'Interview from JD',
    description: 'Paste a job description and get tailored questions',
    href: '/interview-prep?tab=jd',
    icon: BookOpen,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Resume Analyzer',
    description: 'Upload resume and get ATS score + improvements',
    href: '/resume-analyzer',
    icon: FileText,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'General Prep',
    description: 'Prepare by role and tech stack without a JD',
    href: '/general-prep',
    icon: Briefcase,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

interface MongoSession {
  _id: string;
  title: string;
  sessionType: string;
  createdAt: string;
}

interface MongoAnalysis {
  _id: string;
  title: string;
  sessionType: string;
  createdAt: string;
  atsScore?: number;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<MongoSession[]>([]);
  const [analyses, setAnalyses] = useState<MongoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/sessions?limit=10');
        const data = await res.json();

        if (data.sessions) {
          const interviewSessions = data.sessions.filter(
            (s: any) => s.sessionType === 'jd' || s.sessionType === 'role'
          );
          setSessions(interviewSessions);

          const resumeAnalyses = data.sessions
            .filter((s: any) => s.sessionType === 'resume-analysis')
            .map((s: any) => ({
              ...s,
              atsScore: s.generatedContent?.atsScore,
            }));
          setAnalyses(resumeAnalyses);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-xs">
                AI Powered
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Ace your next interview
            </h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Get AI-generated questions, resume analysis, and mock interviews tailored to your role and tech stack.
            </p>
          </div>
          <Zap className="w-10 h-10 sm:w-16 sm:h-16 text-primary/20 flex-shrink-0" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/interview-prep">
              Start Preparing <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/resume-analyzer">Analyze Resume</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <motion.div key={action.href} variants={item}>
              <Link href={action.href}>
                <Card className="group cursor-pointer hover:border-primary/40 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
                  <CardContent className="p-5">
                    <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center mb-4`}>
                      <action.icon className={`w-[18px] h-[18px] ${action.color}`} />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                    <div className="flex items-center gap-1 mt-4 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Get started <ChevronRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Interview Sessions
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground -mr-2">
                <Link href="/sessions">
                  View All <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <EmptyState icon={BookOpen} text="No sessions yet" sub="Start with Interview Prep" href="/interview-prep" />
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <Link key={session._id} href={`/sessions/${session._id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {session.sessionType === 'jd' ? 'JD' : 'Role'}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Recent Resume Analyses
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground -mr-2">
                <Link href="/sessions">
                  View All <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : analyses.length === 0 ? (
                <EmptyState icon={FileText} text="No analyses yet" sub="Analyze your resume" href="/resume-analyzer" />
              ) : (
                analyses.slice(0, 5).map((analysis) => (
                  <Link key={analysis._id} href={`/sessions/${analysis._id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{analysis.title || 'Resume Analysis'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {analysis.atsScore != null && (
                      <div className={`text-sm font-bold ${
                        analysis.atsScore >= 80 ? 'text-emerald-500' :
                        analysis.atsScore >= 60 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {analysis.atsScore}%
                      </div>
                    )}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub, href }: { icon: React.ElementType; text: string; sub: string; href: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{text}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{sub}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>Get started</Link>
      </Button>
    </div>
  );
}
