'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Zap,
  DollarSign,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Plus,
  Calendar,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  Search,
  Bell,
  MoreVertical,
  UserPlus,
  Clock3,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { dashboardService, notificationService } from '@/lib/api';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState('7 derniers jours');
  const [userNom, setUserNom] = useState('Cherif');

  useEffect(() => {
    setMounted(true);
    fetchData();
    setUserNom(localStorage.getItem('user_nom') || 'Cherif');

    // Temps réel : Polling toutes les 10 secondes
    const statsInterval = setInterval(fetchData, 10000);

    return () => {
      clearInterval(statsInterval);
    };
  }, []);

  const fetchData = async () => {
    // Ne pas mettre loading=true lors du polling pour éviter les flashs
    try {
      const [statsData, notifData] = await Promise.all([
        dashboardService.getStats(),
        notificationService.getAll()
      ]);
      setStats(statsData);
      // DRF renvoie un objet avec 'results' si la pagination est activée
      const finalNotifs = Array.isArray(notifData) ? notifData : (notifData?.results || []);
      setNotifications(finalNotifs);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchData();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  if (!mounted) return null;



  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20">

      {/* --- LAYER 1: INTELLIGENT HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">
              {new Date().getHours() >= 0 && new Date().getHours() < 12 ? 'Bonjour' : 'Bonsoir'}, {userNom}
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">
            Restaurant <span className="text-[var(--foreground)] font-bold">SLM</span> • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a href="/dashboard/employees">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--background)] transition-all text-[var(--foreground)]">
              <UserPlus className="w-3.5 h-3.5" /> Ajouter employé
            </button>
          </a>
          <a href="/dashboard/attendance">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--background)] transition-all text-[var(--foreground)]">
              <Clock3 className="w-3.5 h-3.5" /> Pointer
            </button>
          </a>
          <a href="/dashboard/expenses">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <FileText className="w-3.5 h-3.5" /> Rapport
            </button>
          </a>
        </div>
      </div>

      {/* --- LAYER 2: CRITICAL ALERTS & SYSTEM PULSE --- */}
      <AnimatePresence>
        {Array.isArray(notifications) && notifications.filter(n => !n.is_read).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-rose-500 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-rose-500">Alertes Opérationnelles</p>
                  <p className="text-sm font-medium text-rose-200/80">
                    {(notifications || []).filter(n => !n.is_read).length} notification(s) critique(s) en attente d'action.
                  </p>
                </div>
              </div>
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Tout traiter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Présents', value: stats?.attendance?.presents || 0, trend: `${stats?.attendance?.trend >= 0 ? '+' : ''}${stats?.attendance?.trend || 0}`, icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
            { label: 'Absents', value: stats?.attendance?.absents || 0, trend: 'En direct', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/5' },
            { label: 'Retards', value: stats?.attendance?.retards || 0, trend: 'Scan QR', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5' },
            { label: 'Taux', value: `${stats?.attendance?.rate || 0}%`, trend: `${stats?.attendance?.rate > 90 ? 'OPTIMAL' : 'A SURVEILLER'}`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/5' },
            { label: 'Dépenses', value: `${stats?.expenses?.today_total || 0} FG`, trend: `${stats?.expenses?.trend >= 0 ? '+' : ''}${stats?.expenses?.trend || 0}%`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          ].map((kpi, i) => (
            <a key={kpi.label} href="/dashboard/attendance" className="block">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${kpi.trend.includes('+') ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                <h3 className="text-xl font-black text-[var(--foreground)] tracking-tighter truncate">{kpi.value}</h3>
              </motion.div>
            </a>
          ))}
        </div>

        {/* SYSTEM PULSE WIDGET - ADAPTIVE BLUE */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-[2rem] p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Système Actif</p>
              <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-white">QR-99%</p>
              <p className="text-[9px] text-blue-200/60 font-bold uppercase tracking-widest">Rotation Token OK</p>
            </div>
            <div className="w-full h-1 bg-[var(--background)]/20 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: ['20%', '100%'] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="h-full bg-blue-500"
              />
            </div>
            <p className="text-[8px] text-[var(--text-muted)] italic">Prochain cycle dans 4s...</p>
          </div>
        </div>
      </div>

      {/* --- LAYER 3: REAL-TIME OPERATIONS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LIVE ACTIVITY FEED */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 italic">
              <Activity className="w-4 h-4 text-primary" /> Activité en direct
            </h3>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-8 space-y-8">
              {/* Combiner les activités de pointage et les notifications */}
              {stats?.recent_activity?.length > 0 ? stats.recent_activity.slice(0, 5).map((act, i) => (
                <div key={act.id} className="flex items-start gap-6 relative">
                  {i !== (stats.recent_activity.length - 1) && i < 4 && <div className="absolute left-[23px] top-12 bottom-[-32px] w-px bg-[var(--card-border)]"></div>}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] shrink-0 border ${act.statut === 'absent' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-primary/10 border-primary/20 text-primary'
                    }`}>
                    {act.statut === 'absent' ? 'ABS' : 'IN'}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-[var(--foreground)] uppercase tracking-tight">
                        {act.employee?.nom || 'Employé'}
                      </p>
                      <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-widest">
                        {act.heure_arrivee ? act.heure_arrivee.substring(0, 5) : '--:--'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      {act.statut === 'en_retard' ? 'Arrivée avec retard détectée' : 'A pointé son arrivée au restaurant'}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic">Aucun mouvement détecté aujourd'hui</div>
              )}
            </div>
            <div className="px-8 py-4 bg-[var(--background)] border-t border-[var(--card-border)] flex justify-center">
              <a href="/dashboard/attendance">
                <button className="text-[9px] font-black text-primary uppercase tracking-[0.3em] hover:underline transition-all">Voir l'historique complet</button>
              </a>
            </div>
          </div>
        </div>

        {/* STATUS TABLE / MINI STATS */}
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 italic px-2">
            <Zap className="w-4 h-4 text-amber-500" /> État des Shifts
          </h3>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                  <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Employé</th>
                  <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {stats?.employee_status?.length > 0 ? stats.employee_status.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[var(--background)] transition-colors">
                    <td className="px-6 py-4 text-[11px] font-bold text-[var(--foreground)] uppercase">{emp.nom}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${emp.statut === 'present' ? 'text-primary' :
                        emp.statut === 'en_retard' ? 'text-amber-500' : 'text-rose-500'
                        }`}>{emp.statut}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-10 text-center text-[9px] font-black text-[var(--text-muted)] uppercase italic">Aucune donnée staff</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-6">
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Conseil Manager</p>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium italic">
                  {stats?.attendance?.retards > 0
                    ? `"${stats.attendance.retards} retard(s) détecté(s) aujourd'hui. Un rappel sur la ponctualité pourrait être utile lors du prochain briefing."`
                    : stats?.attendance?.absents > 0
                      ? `"${stats.attendance.absents} absence(s) signalée(s). Pensez à réorganiser les tâches prioritaires pour la journée."`
                      : stats?.expenses?.today_total > 500000
                        ? `"Les dépenses du jour sont élevées (${stats.expenses.today_total} FG). Vérifiez la validité des dernières factures saisies."`
                        : `"Toute l'équipe est à l'heure et les indicateurs sont au vert. Continuez ainsi !"`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LAYER 4: ANALYTICS OVERVIEW --- */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black uppercase tracking-widest italic">Performance Hebdomadaire</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-[var(--foreground)] text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer border-b border-primary/20 pb-1"
            >
              <option value="Aujourd'hui">Aujourd'hui</option>
              <option value="Hier">Hier</option>
              <option value="7 derniers jours">7 derniers jours</option>
              <option value="Mois en cours">Mois en cours</option>
              <option value="Cette Année">Cette Année</option>
            </select>
          </div>

          {/* ✅ FIX: monté seulement côté client */}
          {mounted && (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.weekly_stats || []}>
                  <defs>
                    <linearGradient id="softEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      fontSize: '10px',
                      color: 'var(--foreground)'
                    }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={4} fill="url(#softEmerald)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: 'var(--background)' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
