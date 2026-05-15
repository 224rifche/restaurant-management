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
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-[var(--sidebar-bg)] border-r border-[var(--card-border)] flex flex-col p-6 z-[90]
        transition-transform duration-500 ease-in-out shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 mb-12 px-2 mt-12 lg:mt-0">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-primary/20">
            <Image src="/LOGO.png" alt="Logo" fill sizes="40px" className="object-cover" />
          </div>
          <div>
            <h2 className="text-[var(--foreground)] font-black text-sm tracking-tighter uppercase">Restaurant <span className="text-primary">SLM</span></h2>
          </div>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                <motion.div
                  whileHover={{ x: 5 }}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-[var(--text-muted)] group-hover:text-slate-300'}`} />
                  <span className="font-bold text-sm tracking-wide">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[var(--foreground)] text-xs font-black truncate">{userInfo.nom}</p>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1">{userInfo.role}</p>
          </div>
          
          <button 
            onClick={() => authService.logout()}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm border border-transparent hover:border-red-400/20"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
