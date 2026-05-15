'use client';

import { Search, Bell, MapPin, Menu, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const today = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="h-20 flex items-center justify-between px-4 sm:px-8 bg-[var(--background)] backdrop-blur-md border-b border-[var(--card-border)] sticky top-0 z-30 transition-colors">
      {/* Search Bar - Hidden on small mobile */}
      <div className="flex-1 max-w-xl hidden sm:block ml-12 lg:ml-0">
        <div 
          className="relative group cursor-pointer"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
          <div className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl pl-12 pr-4 py-2 text-sm text-[var(--text-muted)] flex items-center justify-between hover:border-primary/50 transition-all">
            <span>Rechercher...</span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Ctrl K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Spacer for mobile when search is hidden */}
      <div className="flex-1 sm:hidden"></div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Restaurant Status - Smaller on mobile */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-400/5 border border-emerald-400/20 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-[8px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ouvert</span>
        </div>

        {/* Date - Hidden on mobile */}
        <div className="hidden md:flex flex-col items-end">
          <div className="flex items-center gap-1 text-slate-500 text-[8px] font-bold uppercase">
            <MapPin className="w-2.5 h-2.5" /> Conakry
          </div>
        </div>

        {/* Theme Toggle */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
        </motion.button>

        {/* Icons */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full border-2 border-black"></span>
        </motion.button>
      </div>
    </div>
  );
}
