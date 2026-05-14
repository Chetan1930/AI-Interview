'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ATSScore } from './ats-score';
import { CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Lightbulb, Tag, Star, FolderOpen, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import type { ResumeAnalysisResult } from '@/lib/types';

interface AnalysisResultsProps {
  result: ResumeAnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center">
            <ATSScore score={result.atsScore} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Overall Feedback</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.overallFeedback}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Skills Found</p>
              <div className="flex flex-wrap gap-1.5">
                {result.skillsFound.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" /> {s}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          title="Missing Skills"
          icon={XCircle}
          iconColor="text-red-500"
          items={result.missingSkills}
          itemColor="text-red-500"
          prefix="•"
        />
        <SectionCard
          title="Weak Areas"
          icon={AlertTriangle}
          iconColor="text-amber-500"
          items={result.weakAreas}
          itemColor="text-amber-600 dark:text-amber-400"
          prefix="⚠"
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-sm">Suggested Improvements</h3>
          </div>
          <div className="space-y-2">
            {result.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-semibold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {result.suggestedSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-primary">Suggested Resume Summary</h3>
            </div>
            <p className="text-sm leading-relaxed italic text-muted-foreground">"{result.suggestedSummary}"</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function SectionCard({
  title, icon: Icon, iconColor, items, itemColor, prefix
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: string[];
  itemColor: string;
  prefix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="outline" className="ml-auto text-xs">{items.length}</Badge>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">None identified</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className={`text-sm flex items-start gap-1.5 ${itemColor}`}>
                {prefix && <span className="flex-shrink-0 mt-0.5">{prefix}</span>}
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
