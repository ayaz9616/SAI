"use client";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle(){
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-800/70 border border-rose-100/60 dark:border-zinc-700 hover:shadow-[0_0_20px_rgba(255,111,97,0.35)] transition-shadow"
    >
      {isDark ? <Sun className="size-5 text-orange-300"/> : <Moon className="size-5 text-pink-600"/>}
    </button>
  );
}
