'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, AlertCircle, Zap, DollarSign,
  Activity, TrendingUp, UserPlus, Clock3, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardService, notificationService } from '@/lib/api';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState('7 derniers jours');
  const [userNom, setUserNom] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setMounted(true);
    setUserNom(localStorage.getItem('user_nom') || 'Manager');
    setUserPhoto(localStorage.getItem('user_photo') || null);
    setUserRole(Cookies.get('user_role') || ''); 
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, notifData] = await Promise.all([
        dashboardService.getStats(),
        notificationService.getAll()
      ]);
      setStats(statsData);
      const finalNotifs = Array.isArray(notifData) ? notifData : (notifData?.results || []);
      setNotifications(finalNotifs);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (!mounted) return null;

  const kpis = [
    {
      label: 'Présents',
      value: stats?.attendance?.presents ?? 0,
      sub: `+${stats?.attendance?.trend ?? 0} vs hier`,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Absents',
      value: stats?.attendance?.absents ?? 0,
      sub: 'En direct',
      icon: AlertCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
    {
      label: 'Retards',
      value: stats?.attendance?.retards ?? 0,
      sub: 'Scan QR actif',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Taux présence',
      value: `${stats?.attendance?.rate ?? 0}%`,
      sub: stats?.attendance?.rate > 90 ? 'Optimal' : 'À surveiller',
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Dépenses',
      value: `${(stats?.expenses?.today_total ?? 0).toLocaleString('fr-FR')} FG`,
      sub: `${stats?.expenses?.trend >= 0 ? '+' : ''}${stats?.expenses?.trend ?? 0}%`,
      icon: DollarSign,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="dashboard-content max-w-[1400px] mx-auto space-y-8 pb-16">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            {greeting}, <span className="text-primary">{userNom}</span> 
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Restaurant <strong className="text-[var(--foreground)]">SLM</strong> &nbsp;·&nbsp;
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

      <div className="flex flex-wrap items-center gap-2">
  {userRole === 'admin' && (
    <Link href="/dashboard/employees">
      <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-medium hover:border-primary/40 hover:shadow-sm transition-all text-[var(--foreground)]">
        <UserPlus className="w-4 h-4 text-[var(--text-muted)]" />
        Ajouter employé
      </button>
    </Link>
  )}
  {(userRole === 'admin' || userRole === 'caissier') && (
    <Link href="/dashboard/attendance">
      <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-medium hover:border-primary/40 hover:shadow-sm transition-all text-[var(--foreground)]">
        <Clock3 className="w-4 h-4 text-[var(--text-muted)]" />
        Pointer
      </button>
    </Link>
  )}
  {userRole === 'admin' && (
    <Link href="/dashboard/expenses">
      <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] transition-all">
        <FileText className="w-4 h-4" />
        Rapport
      </button>
    </Link>
  )}
</div>
      </div>

      {/* ALERTE NOTIFICATIONS */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-4 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500 rounded-lg shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-700">
                  {unreadCount} alerte{unreadCount > 1 ? 's' : ''} opérationnelle{unreadCount > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-rose-500 mt-0.5">En attente de traitement</p>
              </div>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap"
            >
              Tout traiter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, i) => (
            <Link key={kpi.label} href="/dashboard/attendance">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} border ${kpi.border} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-xs text-[var(--text-muted)] font-medium mb-1">{kpi.label}</p>
                <p className="text-xl font-bold text-[var(--foreground)] tracking-tight">{kpi.value}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{kpi.sub}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* SYSTÈME ACTIF */}
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2a4a] border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden shadow-md">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-400/10 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">Système actif</span>
              <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">QR-99%</p>
              <p className="text-xs text-blue-300/70 mt-0.5">Rotation Token OK</p>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="h-full bg-blue-400 rounded-full"
              />
            </div>
            <p className="text-[10px] text-blue-300/50">Prochain cycle dans 4s...</p>
          </div>
        </div>
      </div>

      {/* ACTIVITÉ + SHIFTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVITÉ EN DIRECT */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Activité en direct
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] text-[var(--text-muted)] font-medium">Live</span>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 space-y-5">
              {stats?.recent_activity?.length > 0
                ? stats.recent_activity.slice(0, 5).map((act, i) => (
                  <div key={act.id} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      act.statut === 'absent'
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {act.statut === 'absent' ? 'ABS' : 'IN'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {act.employee?.nom || 'Employé'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {act.statut === 'en_retard' ? 'Arrivée avec retard détectée' : 'A pointé son arrivée'}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                      {act.heure_arrivee?.substring(0, 5) ?? '--:--'}
                    </span>
                  </div>
                ))
                : (
                  <div className="py-14 text-center">
                    <p className="text-sm text-[var(--text-muted)]">Aucun mouvement détecté aujourd'hui</p>
                  </div>
                )
              }
            </div>
            <div className="px-6 py-3 border-t border-[var(--card-border)] bg-[var(--background)]">
              <Link href="/dashboard/attendance" className="text-xs font-medium text-primary hover:underline">
                Voir l'historique complet →
              </Link>
            </div>
          </div>
        </div>

        {/* ÉTAT DES SHIFTS */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 mb-4 px-1">
            <Zap className="w-4 h-4 text-amber-500" />
            État des shifts
          </h3>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-muted)]">Employé</th>
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-muted)]">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {stats?.employee_status?.length > 0
                  ? stats.employee_status.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[var(--background)] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[var(--foreground)]">{emp.nom}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          emp.statut === 'present'
                            ? 'bg-emerald-100 text-emerald-700'
                            : emp.statut === 'en_retard'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}>
                          {emp.statut}
                        </span>
                      </td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td colSpan="2" className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                        Aucune donnée staff
                      </td>
                    </tr>
                  )
                }
              </tbody>
            </table>

            {/* CONSEIL MANAGER */}
            <div className="p-5">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1.5">💡 Conseil Manager</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {stats?.attendance?.retards > 0
                    ? `${stats.attendance.retards} retard(s) aujourd'hui. Un rappel sur la ponctualité pourrait être utile.`
                    : stats?.attendance?.absents > 0
                      ? `${stats.attendance.absents} absence(s) signalée(s). Pensez à réorganiser les tâches.`
                      : 'Toute l\'équipe est à l\'heure. Continuez ainsi !'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Performance hebdomadaire</h3>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-[var(--text-muted)] text-xs font-medium outline-none cursor-pointer border border-[var(--card-border)] rounded-lg px-3 py-1.5 hover:border-primary/40 transition-colors"
          >
            <option value="Aujourd'hui">Aujourd'hui</option>
            <option value="Hier">Hier</option>
            <option value="7 derniers jours">7 derniers jours</option>
            <option value="Mois en cours">Mois en cours</option>
            <option value="Cette Année">Cette année</option>
          </select>
        </div>

        {mounted && (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weekly_stats || []}>
                <defs>
                  <linearGradient id="softEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--foreground)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                  }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#softEmerald)"
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
