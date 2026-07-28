'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock, UserCheck, UserMinus, AlertCircle,
  Search, Filter, ChevronRight
} from 'lucide-react';
import { attendanceService, dashboardService } from '@/lib/api';
import Cookies from 'js-cookie';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userNom, setUserNom] = useState('');

  useEffect(() => {
    const role = Cookies.get('user_role') || '';
    const nom  = Cookies.get('user_nom')  || '';
    setUserRole(role);
    setUserNom(nom);
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, attData] = await Promise.all([
        dashboardService.getStats(),
        attendanceService.search(search)
      ]);
      setStats(statsData);
      let final = Array.isArray(attData) ? attData : (attData?.results || []);

      // Serveur et Cuisine : voir seulement leurs propres pointages
      if (userRole === 'serveur' || userRole === 'cuisine') {
        final = final.filter(att =>
          att.employee_name?.toLowerCase() === userNom.toLowerCase()
        );
      }

      setAttendances(final);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [search, mounted, userRole]);

  if (!mounted) return null;

  const isReadOnly = userRole === 'serveur' || userRole === 'cuisine';

  const kpis = [
    { label: 'Présents',       value: stats?.attendance?.presents ?? 0,      icon: UserCheck,  color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
    { label: 'Retards',        value: stats?.attendance?.retards  ?? 0,      icon: Clock,      color: 'text-amber-500',   bg: 'bg-amber-50',    border: 'border-amber-100'   },
    { label: 'Absents',        value: stats?.attendance?.absents  ?? 0,      icon: UserMinus,  color: 'text-rose-500',    bg: 'bg-rose-50',     border: 'border-rose-100'    },
    { label: 'Taux présence',  value: `${stats?.attendance?.rate ?? 0}%`,    icon: AlertCircle,color: 'text-blue-500',    bg: 'bg-blue-50',     border: 'border-blue-100'    },
  ];

  return (
    <div className="dashboard-content max-w-[1400px] mx-auto space-y-8 pb-16">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {isReadOnly ? 'Mon pointage' : 'Suivi des présences'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {isReadOnly
              ? 'Historique de vos arrivées et départs'
              : 'Contrôle des flux et ponctualité en temps réel'}
          </p>
        </div>

        {/* Recherche — masquée pour serveur/cuisine */}
        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all w-64 text-[var(--foreground)]"
              />
            </div>
            <button className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--text-muted)] hover:text-primary transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* KPI — masqués pour serveur/cuisine */}
      {!isReadOnly && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl"
            >
              <div className={`w-9 h-9 rounded-xl ${k.bg} border ${k.border} flex items-center justify-center mb-3`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">{k.label}</p>
              <p className="text-xl font-bold text-[var(--foreground)] mt-0.5">{k.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* TABLEAU */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Journal de pointage</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-xs text-primary font-medium">Live</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)]">Employé</th>
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)]">Heure arrivée</th>
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)]">Statut</th>
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)]">Vérification</th>
                {!isReadOnly && (
                  <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)] text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {attendances.length > 0 ? attendances.map((att) => (
                <tr key={att.id} className="hover:bg-[var(--background)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {att.employee_name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{att.employee_name || 'Inconnu'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[var(--foreground)]">{att.heure_arrivee || '--:--'}</p>
                    {att.statut === 'en_retard' && (
                      <p className="text-xs text-amber-500 mt-0.5">En retard</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      att.statut === 'present'   ? 'bg-emerald-100 text-emerald-700' :
                      att.statut === 'en_retard' ? 'bg-amber-100 text-amber-700'    :
                                                   'bg-rose-100 text-rose-700'
                    }`}>
                      {att.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <UserCheck className="w-3.5 h-3.5" /> Vérifié
                    </div>
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 text-right">
                      <Link href="/dashboard/employees" className="p-2 inline-block rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-primary transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={isReadOnly ? 4 : 5} className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                    {isReadOnly
                      ? 'Aucun pointage trouvé pour votre compte.'
                      : 'Aucun pointage trouvé.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
