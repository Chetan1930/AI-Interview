'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, BookOpen, FileText, MessageSquare,
  LoaderCircle, Trash2, Clock, ChevronRight, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const sessionTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  'jd': { label: 'From JD', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'role': { label: 'From Role', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'resume-analysis': { label: 'Resume Analysis', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'chat-import': { label: 'Chat Import', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

const typeFilters = [
  { value: '', label: 'All' },
  { value: 'jd', label: 'JD' },
  { value: 'role', label: 'Role' },
  { value: 'resume-analysis', label: 'Resume' },
  { value: 'chat-import', label: 'Chat' },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/sessions?${params}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this session? This action cannot be undone.')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSessions(prev => prev.filter(s => s._id !== id));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.sessionType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-1">All Sessions</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Browse and manage all your interview prep, mock interviews, and resume analyses
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions by title..."
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {search || typeFilter ? 'No matching sessions' : 'No sessions yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || typeFilter
                ? 'Try a different search or filter'
                : 'Start by generating interview questions or analyzing your resume'}
            </p>
          </div>
          {!search && !typeFilter && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="sm">
                <Link href="/interview-prep">
                  <BookOpen className="h-4 w-4 mr-1.5" /> Interview Prep
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/resume-analyzer">
                  <FileText className="h-4 w-4 mr-1.5" /> Analyze Resume
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((session, i) => {
            const config = sessionTypeConfig[session.sessionType] || sessionTypeConfig['jd'];
            const Icon = config.icon;
            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={`/sessions/${session._id}`}>
                  <Card className="group hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {session.title || 'Untitled Session'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            <button
                              onClick={(e) => handleDelete(session._id, e)}
                              disabled={deletingId === session._id}
                              className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                            >
                              {deletingId === session._id ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
