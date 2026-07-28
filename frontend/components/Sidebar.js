'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Clock, FileText, Calendar, Users, Bell, LogOut, X, Menu } from 'lucide-react';
import { authService } from '@/lib/api';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const menuItems = [
  { name: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard',              roles: ['admin', 'caissier', 'serveur', 'cuisine'] },
  { name: 'Pointage',      icon: Clock,           path: '/dashboard/attendance',   roles: ['admin', 'caissier', 'serveur', 'cuisine'] },
  { name: 'Factures',      icon: FileText,        path: '/dashboard/expenses',     roles: ['admin'] },
  { name: 'Planning',      icon: Calendar,        path: '/dashboard/schedules',    roles: ['admin', 'caissier', 'serveur', 'cuisine'] },
  { name: 'Employes',      icon: Users,           path: '/dashboard/employees',    roles: ['admin'] },
  { name: 'Notifications', icon: Bell,            path: '/dashboard/notifications',roles: ['admin', 'caissier'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen]     = useState(false);
  const [userInfo, setUserInfo] = useState({ nom: 'Utilisateur', role: '' });

  useEffect(() => {
    setUserInfo({
      nom:  Cookies.get('user_nom')  || 'Utilisateur',
      role: Cookies.get('user_role') || '',
    });
  }, []);

  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(userInfo.role));

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-5 left-5 z-[100] p-3 bg-primary text-white rounded-xl shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 z-[80]"
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          'fixed lg:sticky top-0 left-0 h-screen w-64',
          'flex flex-col p-5 z-[90]',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'sidebar'
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-2 mt-12 lg:mt-0">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[var(--card-border)]">
            <Image src="/LOGO.png" alt="Logo" fill sizes="36px" className="object-cover" />
          </div>
          <div>
            <h2 className="text-[var(--sidebar-text)] font-black text-sm tracking-tight uppercase">
              Restaurant <span className="text-primary">SLM</span>
            </h2>
            <p className="text-[var(--sidebar-muted)] text-[10px] font-medium">Gestion & Admin</p>
          </div>
        </div>

        {/* Navigation filtrée par rôle */}
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className="relative block"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-highlight"
                    className="absolute inset-0 bg-primary rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className={[
                    'relative flex items-center gap-3 px-4 py-3 rounded-xl z-10',
                    'transition-colors duration-200 text-sm font-semibold',
                    isActive
                      ? 'text-white'
                      : 'text-[var(--sidebar-text)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'
                  ].join(' ')}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="mt-auto pt-4 border-t border-[var(--card-border)] space-y-3">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--sidebar-hover-bg)]">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-black text-xs uppercase">
                {userInfo.nom.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[var(--sidebar-text)] text-xs font-bold truncate">{userInfo.nom}</p>
              <p className="text-primary text-[10px] font-bold uppercase tracking-wider">{userInfo.role}</p>
            </div>
          </div>

          <button
            onClick={() => authService.logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[var(--sidebar-text)] hover:text-rose-500 hover:bg-rose-50 transition-all text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Deconnexion
          </button>
        </div>
      </aside>
    </>
  );
}