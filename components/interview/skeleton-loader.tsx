'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export function InterviewSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-3 sm:p-4 space-y-2">
            <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
            <Skeleton className="h-5 sm:h-6 w-10 sm:w-12" />
            <Skeleton className="h-3 w-16 sm:w-20" />
          </div>
        ))}
      </div>
      <div className="border border-border rounded-lg p-3 sm:p-4 space-y-4">
        <div className="flex gap-1 sm:gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 flex-1 rounded-md min-w-[60px]" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </motion.div>
  );
}
