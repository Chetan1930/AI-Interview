'use client';

import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuestionsList } from './questions-list';
import { Brain, Code, Server, Users, Zap, BookOpen, Lightbulb } from 'lucide-react';
import type { InterviewContent } from '@/lib/types';

interface InterviewResultsProps {
  content: InterviewContent;
  sessionTitle: string;
}

export function InterviewResults({ content, sessionTitle }: InterviewResultsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Technical', count: content.technicalQuestions.length, icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Coding', count: content.codingQuestions.length, icon: Code, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'System Design', count: content.systemDesignQuestions.length, icon: Server, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'HR', count: content.hrQuestions.length, icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-sm">Role Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{content.roleSummary}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Required Skills</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {content.requiredSkills.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="technical">
        <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="grid grid-cols-5 w-max min-w-full h-auto">
            {[
              { value: 'technical', label: 'Technical', icon: Brain },
              { value: 'coding', label: 'Coding', icon: Code },
              { value: 'system-design', label: 'Design', icon: Server },
              { value: 'hr', label: 'HR', icon: Users },
              { value: 'revision', label: 'Revision', icon: BookOpen },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="text-[11px] sm:text-xs py-2 px-2 sm:px-3 whitespace-nowrap">
                <Icon className="h-3.5 w-3.5 mr-1 hidden sm:block" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="technical">
            <QuestionsList questions={content.technicalQuestions} />
          </TabsContent>
          <TabsContent value="coding">
            <QuestionsList questions={content.codingQuestions} emptyMessage="No coding questions generated" />
          </TabsContent>
          <TabsContent value="system-design">
            <QuestionsList questions={content.systemDesignQuestions} emptyMessage="No system design questions generated" />
          </TabsContent>
          <TabsContent value="hr">
            <QuestionsList questions={content.hrQuestions} emptyMessage="No HR questions generated" />
          </TabsContent>
          <TabsContent value="revision">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-500" /> Topics To Revise
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {content.revisionTopics.map((topic, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">
                        {i + 1}
                      </span>
                      {topic}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
