'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';

interface QuestionCardProps {
  question: Question;
  index: number;
}

const difficultyConfig = {
  easy: { label: 'Easy', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  medium: { label: 'Medium', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  hard: { label: 'Hard', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export function QuestionCard({ question, index }: QuestionCardProps) {
  const [open, setOpen] = useState(false);
  const diff = difficultyConfig[question.difficulty];
  const isCode = question.category === 'coding';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-border rounded-xl overflow-hidden bg-card"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-2 sm:gap-3 p-3 sm:p-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
          <span className="text-xs font-semibold text-primary">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={cn('text-[10px] sm:text-xs px-1.5 sm:px-2 py-0', diff.class)}>
              {diff.label}
            </Badge>
            {isCode && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 bg-blue-500/10 text-blue-500 border-blue-500/20">
                <Code className="h-3 w-3 mr-1" /> Coding
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">{question.question}</p>
        </div>
        <div className="flex-shrink-0 ml-1 sm:ml-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-4 border-t border-border/50 pt-4 ml-8 sm:ml-9">
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Answer</h5>
                {isCode ? (
                  <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                    {question.answer}
                  </pre>
                ) : (
                  <p className="text-sm leading-relaxed text-foreground/90">{question.answer}</p>
                )}
              </div>
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deep Explanation</h5>
                <p className="text-sm leading-relaxed text-muted-foreground">{question.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
