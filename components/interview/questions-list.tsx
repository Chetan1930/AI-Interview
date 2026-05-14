'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuestionCard } from './question-card';
import type { Question, Difficulty } from '@/lib/types';

interface QuestionsListProps {
  questions: Question[];
  emptyMessage?: string;
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

export function QuestionsList({ questions, emptyMessage = 'No questions generated' }: QuestionsListProps) {
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');

  const filtered = filter === 'all' ? questions : questions.filter(q => q.difficulty === filter);
  const counts = {
    all: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };

  if (questions.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="h-7 text-xs"
        >
          All ({counts.all})
        </Button>
        {difficulties.map(d => (
          <Button
            key={d}
            variant={filter === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(d)}
            className="h-7 text-xs capitalize"
          >
            {d} ({counts[d]})
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((q, i) => (
          <QuestionCard key={q.id || i} question={q} index={i} />
        ))}
      </div>
    </div>
  );
}
