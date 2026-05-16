'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  FileText,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  ChevronRight,
  PieChart,
  ShoppingBag
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { dashboardService, expenseService } from '@/lib/api';
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      const [statsData, expData] = await Promise.all([
        dashboardService.getStats(),
        expenseService.search(search)
      ]);

      setStats(statsData);
      const finalExp = Array.isArray(expData) ? expData : (expData?.results || []);
      setExpenses(finalExp);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-3xl font-black tracking-tighter uppercase italic"
          >
            Flux de <span className="text-primary">Dépenses</span>
          </motion.h1>
          <p className="text-[var(--text-muted)] text-sm font-medium mt-1">Gestion et suivi analytique des sorties de caisse</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'var(--card-bg)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => alert('Génération du rapport PDF...')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-[var(--foreground)]"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle dépense
          </motion.button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 glass-card p-8 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-[2.5rem]"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Aperçu Hebdomadaire</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-full text-[10px] font-bold text-primary">
              <CalendarIcon className="w-3 h-3" /> Cette semaine
            </div>
          </div>
          {mounted && (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.weekly_stats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', fontSize: '10px', color: 'var(--foreground)' }}
                    cursor={{ fill: 'var(--background)', opacity: 0.5 }}
                  />
                  <Bar dataKey="expenses" radius={[6, 6, 0, 0]}>
                    {(stats?.weekly_stats || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 6 ? '#10b981' : 'rgba(16, 185, 129, 0.3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Mini Stats */}
        <div className="space-y-6">
          {[
            { label: 'Total Mois', value: `${(stats?.expenses?.today_total * 25) || 0} FG`, icon: DollarSign, trend: '+12%', color: '#10b981' },
            { label: 'Factures en attente', value: expenses.filter(e => e.status === 'en_attente').length, icon: PieChart, trend: 'Action requise', color: '#3b82f6' },
            { label: 'Dépenses du jour', value: `${stats?.expenses?.today_total || 0} FG`, icon: ShoppingBag, trend: `${stats?.expenses?.trend || 0}%`, color: '#f43f5e' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ x: 10 }}
              className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl flex items-center gap-5 cursor-pointer group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12`}
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</p>
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-black text-[var(--foreground)]">{stat.value}</h4>
                  <motion.span
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)]"
                  >
                    {stat.trend}
                  </motion.span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <motion.div
        variants={itemVariants}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2.5rem] overflow-hidden shadow-sm"
      >
        <div className="p-8 border-b border-[var(--card-border)] flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest italic text-[var(--foreground)]">Dernières Dépenses</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs outline-none focus:border-primary/50 transition-all text-[var(--foreground)]"
              />
            </div>
            <button className="p-2 bg-[var(--background)] rounded-xl border border-[var(--card-border)] hover:text-primary transition-colors text-[var(--text-muted)]"><Filter className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="divide-y divide-[var(--card-border)]">
          <AnimatePresence>
            {expenses.length > 0 ? expenses.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-6 hover:bg-[var(--background)] transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center font-black text-[10px] text-[var(--text-muted)] group-hover:text-primary transition-colors">#{exp.id.substring(0, 4)}</div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight text-[var(--foreground)]">{exp.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Par {exp.issuer_name || 'Inconnu'} • {new Date(exp.inserted_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="hidden md:block text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${exp.status === 'valide' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        exp.status === 'rejete' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                      {exp.status}
                    </span>
                    <p className="text-[9px] text-[var(--text-muted)] font-medium mt-1">{exp.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-500">- {exp.amount} FG</p>
                    <motion.button
                      whileHover={{ x: 5 }}
                      className="mt-1 text-primary uppercase tracking-widest text-[8px] font-black flex items-center gap-1"
                    >
                      Détails <ChevronRight className="w-2.5 h-2.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="p-10 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                Aucune dépense trouvée.
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* MODAL NOUVELLE DÉPENSE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[var(--foreground)]/10 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--background)] border border-[var(--card-border)] rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase italic tracking-tight text-[var(--foreground)]">Nouvelle <span className="text-primary">Dépense</span></h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full hover:bg-[var(--card-border)] transition-colors">
                  <Plus className="w-5 h-5 rotate-45 text-[var(--foreground)]" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Libellé</label>
                  <input type="text" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary/50 text-[var(--foreground)]" placeholder="Ex: Achat fournitures" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Montant (FG)</label>
                  <input type="number" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary/50 text-[var(--foreground)]" placeholder="0" />
                </div>
                <button className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                  Enregistrer la dépense
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
