'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, BookOpen, Briefcase, MessageSquare,
  ChevronLeft, X, Brain, Sparkles, LogOut, User, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/interview-prep', label: 'Interview Prep', icon: BookOpen },
  { href: '/mock-interview', label: 'Mock Interview', icon: MessageSquare },
  { href: '/resume-analyzer', label: 'Resume Analyzer', icon: FileText },
  { href: '/general-prep', label: 'General Prep', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile, setSidebarOpen]);

  // On desktop, default to open
  useEffect(() => {
    if (!isMobile && !sidebarOpen) {
      // Keep closed if user explicitly closed it on desktop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={cn(
          'flex flex-col h-full bg-card border-r border-border flex-shrink-0 overflow-hidden',
          // Mobile: fixed overlay
          isMobile && 'fixed top-0 left-0 z-50 w-[260px] transition-transform duration-300 ease-in-out',
          isMobile && !sidebarOpen && '-translate-x-full',
          isMobile && sidebarOpen && 'translate-x-0',
          // Desktop: relative positioned
          !isMobile && 'relative z-10 transition-all duration-300 ease-in-out',
          !isMobile && (sidebarOpen ? 'w-[240px]' : 'w-[64px]')
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-14 px-4 border-b border-border flex-shrink-0',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight whitespace-nowrap">PrepAI</span>
              <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          {sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setSidebarOpen(false)}>
              {isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  'flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                  !sidebarOpen && 'justify-center'
                )}>
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-primary')} />
                  {sidebarOpen && (
                    <span className="whitespace-nowrap overflow-hidden">{label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        {user && (
          <div className="border-t border-border px-3 py-3 space-y-2">
            {sidebarOpen && (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className={cn(
                'flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                !sidebarOpen && 'justify-center'
              )}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
