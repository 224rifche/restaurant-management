'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Clock,
  FileText,
  Calendar,
  Users,
  Bell,
  LogOut,
  X,
  Menu
} from 'lucide-react';
import { authService } from '@/lib/api';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Pointage', icon: Clock, path: '/dashboard/attendance' },
  { name: 'Factures', icon: FileText, path: '/dashboard/expenses' },
  { name: 'Planning', icon: Calendar, path: '/dashboard/schedules' },
  { name: 'Employés', icon: Users, path: '/dashboard/employees' },
  { name: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ nom: 'Utilisateur', role: 'Rôle' });

  useEffect(() => {
    setUserInfo({
      nom: localStorage.getItem('user_nom') || 'Utilisateur',
      role: localStorage.getItem('user_role') || 'Rôle'
    });
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-5 left-5 z-[100] p-3 bg-primary text-black rounded-xl shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-[var(--background)] border-r border-[var(--card-border)] flex flex-col p-6 z-[90]
        transition-transform duration-500 ease-in-out shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 mb-12 px-2 mt-12 lg:mt-0">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[var(--card-border)] shadow-sm">
            <Image src="/LOGO.png" alt="Logo" fill sizes="40px" className="object-cover" />
          </div>
          <div>
            <h2 className="text-[var(--foreground)] font-black text-sm tracking-tighter uppercase">Restaurant <span className="text-primary">SLM</span></h2>
          </div>
        </div>

        {/* Menu Links */}
        <motion.nav
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          initial="hidden"
          animate="visible"
          className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2"
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className="relative block"
              >
                {/* STATIC BACKGROUND HIGHLIGHT */}
                {isActive && (
                  <motion.div
                    layoutId="nav-highlight"
                    className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 35
                    }}
                  />
                )}

                <motion.div
                  variants={{
                    hidden: { x: -20, opacity: 0 },
                    visible: { x: 0, opacity: 1 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors duration-300 z-10 ${isActive ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[var(--text-muted)]'
                    }`} />
                  <span className="font-bold text-sm tracking-wide">{item.name}</span>

                  {isActive && (
                    <motion.div
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </motion.nav>

        {/* User & Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-auto pt-6 border-t border-[var(--card-border)] space-y-6"
        >
          <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <p className="text-[var(--foreground)] text-xs font-black truncate">{userInfo.nom}</p>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1">{userInfo.role}</p>
          </div>

          <button
            onClick={() => authService.logout()}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/5 transition-all font-bold text-sm border border-transparent"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </motion.div>
      </aside>
    </>
  );
}
