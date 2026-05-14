'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InterviewSession, ResumeAnalysis } from '@/lib/types';

interface AppState {
  recentSessions: InterviewSession[];
  recentAnalyses: ResumeAnalysis[];
  sidebarOpen: boolean;
  addSession: (session: InterviewSession) => void;
  addAnalysis: (analysis: ResumeAnalysis) => void;
  setSidebarOpen: (open: boolean) => void;
  removeSession: (id: string) => void;
  removeAnalysis: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      recentSessions: [],
      recentAnalyses: [],
      sidebarOpen: true,
      addSession: (session) =>
        set((state) => ({
          recentSessions: [session, ...state.recentSessions.filter(s => s.id !== session.id)].slice(0, 10),
        })),
      addAnalysis: (analysis) =>
        set((state) => ({
          recentAnalyses: [analysis, ...state.recentAnalyses.filter(a => a.id !== analysis.id)].slice(0, 10),
        })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      removeSession: (id) =>
        set((state) => ({ recentSessions: state.recentSessions.filter(s => s.id !== id) })),
      removeAnalysis: (id) =>
        set((state) => ({ recentAnalyses: state.recentAnalyses.filter(a => a.id !== id) })),
    }),
    { name: 'interview-prep-store' }
  )
);
