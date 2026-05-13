'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Clock, 
  FileText, 
  Calendar, 
  Users, 
  Bell, 
  LogOut,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { authService } from '@/lib/api';
import Image from 'next/image';

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
  const userNom = typeof window !== 'undefined' ? localStorage.getItem('user_nom') : 'Utilisateur';
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : 'Rôle';

  return (
    <div className="h-screen w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col p-6 sticky top-0 overflow-hidden">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-primary/20">
          <Image src="/LOGO.png" alt="Logo" fill className="object-cover" />
        </div>
        <div>
          <h2 className="text-white font-black text-sm tracking-tighter uppercase">SLM <span className="text-primary">Resto</span></h2>
          <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Management</p>
        </div>
      </div>

      {/* Menu Links */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileHover={{ x: 5 }}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-bold text-sm tracking-wide">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="mt-auto space-y-6">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-white text-xs font-black truncate">{userNom}</p>
          <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1">{userRole}</p>
        </div>
        
        <button 
          onClick={() => authService.logout()}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm border border-transparent hover:border-red-400/20"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
}
