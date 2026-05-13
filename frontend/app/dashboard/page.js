'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp,
  Plus
} from 'lucide-react';

export default function DashboardOverview() {
  const userNom = typeof window !== 'undefined' ? localStorage.getItem('user_nom') : 'Utilisateur';

  const stats = [
    { label: 'Employés Présents', value: '12', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Retards (Aujourd\'hui)', value: '2', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Absences', value: '0', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  return (
    <div className="space-y-10">
      {/* Header & Welcome */}
      <div className="flex items-end justify-between">
        <div>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-primary font-bold text-xs uppercase tracking-[0.3em] mb-2"
          >
            Vue d'ensemble
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black text-white"
          >
            Bonjour, <span className="text-slate-400">{userNom}</span> 👋
          </motion.h1>
        </div>
        
        <button className="btn-primary flex items-center gap-2 text-xs py-3 px-6">
          <Plus className="w-4 h-4" /> Nouvelle Facture
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="glass-card p-6 border border-white/5 hover:border-primary/20 transition-all duration-500 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> +12%
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Voir les détails
              <ArrowUpRight className="w-3 h-3 group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Placeholder for Main Charts/Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="glass-card h-80 flex items-center justify-center border-dashed border-white/10"
        >
          <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-xs">Flux d'activité (Bientôt)</p>
        </motion.div>
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="glass-card h-80 flex items-center justify-center border-dashed border-white/10"
        >
          <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-xs">Calendrier Planning (Bientôt)</p>
        </motion.div>
      </div>
    </div>
  );
}
