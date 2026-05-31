'use client';

import { Search, Bell, MapPin, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/api';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await notificationService.getAll();
        const notifs = Array.isArray(data) ? data : (data?.results || []);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-16 flex items-center justify-between px-4 sm:px-6 topbar sticky top-0 z-30">

      {/* Barre de recherche */}
      <div className="flex-1 max-w-md hidden sm:block ml-12 lg:ml-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm text-[var(--text-muted)] hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <Search className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" />
          <span className="flex-1 text-left">Rechercher...</span>
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md text-[10px] font-medium text-[var(--text-muted)] opacity-60">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Spacer mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Actions droite */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Statut restaurant */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Ouvert
          </span>
        </div>

        {/* Localisation - desktop seulement */}
        <div className="hidden md:flex items-center gap-1 text-[var(--text-muted)] text-xs">
          <MapPin className="w-3 h-3" />
          <span>Conakry</span>
        </div>

        {/* Toggle thème */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:border-primary/40 hover:text-[var(--foreground)] transition-all"
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-amber-500" />
            : <Moon className="w-4 h-4 text-blue-500" />
          }
        </motion.button>

        {/* Cloche avec badge dynamique */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/dashboard/notifications'}
          className="relative p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:border-primary/40 hover:text-[var(--foreground)] transition-all"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--topbar-bg)]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

      </div>
    </div>
  );
}
