'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ATSScoreProps {
  score: number;
}

export function ATSScore({ score }: ATSScoreProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = Date.now();
    const duration = 1200;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color =
    score >= 80 ? 'text-emerald-500' :
    score >= 60 ? 'text-amber-500' :
    'text-red-500';

  const barColor =
    score >= 80 ? 'bg-emerald-500' :
    score >= 60 ? 'bg-amber-500' :
    'bg-red-500';

  const label =
    score >= 80 ? 'Excellent Match' :
    score >= 60 ? 'Good Match' :
    score >= 40 ? 'Partial Match' :
    'Low Match';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <motion.circle
            cx="64" cy="64" r="54"
            fill="none"
            stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 339.3' }}
            animate={{ strokeDasharray: `${(score / 100) * 339.3} 339.3` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl sm:text-3xl font-bold', color)}>{displayed}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <p className={cn('text-sm font-semibold', color)}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">ATS Compatibility Score</p>
      </div>

      <div className="w-full">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={cn('h-full rounded-full', barColor)}
          />
        </div>
      </div>
    </div>
  );
}
