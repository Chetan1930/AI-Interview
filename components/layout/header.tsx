'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/interview-prep': 'Interview Preparation',
  '/mock-interview': 'Mock Interview',
  '/resume-analyzer': 'Resume Analyzer',
  '/general-prep': 'General Preparation',
};

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || 'PrepAI';

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-3 sm:px-4 gap-3 flex-shrink-0 sticky top-0 z-10">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-sm text-foreground truncate">{title}</h1>
      </div>
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
      )}
    </header>
  );
}
