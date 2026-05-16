'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  UserCheck, 
  UserMinus, 
  AlertCircle, 
  Search,
  Filter,
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { attendanceService, dashboardService } from '@/lib/api';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [mounted, setMounted] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, attData] = await Promise.all([
        dashboardService.getStats(),
        attendanceService.search(search)
      ]);
      
      setStats(statsData);
      const finalAtt = Array.isArray(attData) ? attData : (attData?.results || []);
      setAttendances(finalAtt);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s is enough for live updates
    return () => clearInterval(interval);
  }, [search]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            Suivi des <span className="text-primary">Présences</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">
            Contrôle des flux et ponctualité en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher un employé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary/50 transition-all w-full md:w-64"
            />
          </div>
          <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-primary transition-all">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Présents', value: stats?.attendance?.presents || 0, icon: UserCheck, color: 'text-primary' },
          { label: 'Retards', value: stats?.attendance?.retards || 0, icon: Clock, color: 'text-amber-400' },
          { label: 'Absents', value: stats?.attendance?.absents || 0, icon: UserMinus, color: 'text-rose-500' },
          { label: 'Taux de présence', value: `${stats?.attendance?.rate || 0}%`, icon: AlertCircle, color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 border border-[var(--card-border)] bg-[var(--card-bg)]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Aujourd'hui</span>
            </div>
            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-[var(--foreground)]">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Table/List */}
      <div className="glass-card border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden">
        <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest italic">Journal de pointage</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            Live
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Employé</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Heure Arrivée</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Statut</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Vérification</th>
                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {attendances.length > 0 ? attendances.map((att) => (
                <tr key={att.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black">
                        {att.employee_name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-[var(--foreground)] uppercase">{att.employee_name || 'Inconnu'}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Employé SLM</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-[var(--foreground)]">{att.heure_arrivee || '--:--'}</p>
                    {att.statut === 'en_retard' && (
                      <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">En retard</p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                      att.statut === 'present' ? 'bg-primary/5 border-primary/20 text-primary' :
                      att.statut === 'en_retard' ? 'bg-amber-400/5 border-amber-400/20 text-amber-400' :
                      'bg-rose-500/5 border-rose-500/20 text-rose-500'
                    }`}>
                      {att.statut}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                      <UserCheck className="w-3 h-3" /> Vérifié
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-[var(--text-muted)] group-hover:text-primary transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                    Aucun pointage trouvé pour cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-white/5 flex justify-center">
          <button className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] hover:text-primary uppercase tracking-widest transition-all">
            Voir tout le journal <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
