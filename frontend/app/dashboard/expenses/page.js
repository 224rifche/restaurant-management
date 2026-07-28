'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, FileText, TrendingUp, Plus, Search, Filter, Download, Calendar as CalendarIcon, ChevronRight, PieChart, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dashboardService, expenseService } from '@/lib/api';
import Cookies from 'js-cookie';

export default function ExpensesPage() {
  const [expenses, setExpenses]         = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [mounted, setMounted]           = useState(false);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [newExpenseTitle, setNewExpenseTitle]   = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExpense, setSelectedExpense]   = useState(null);
  const [userRole, setUserRole]         = useState('');

  useEffect(() => {
    setUserRole(Cookies.get('user_role') || '');
    setMounted(true);
    fetchStats();
  }, []);

  useEffect(() => {
    if (mounted) fetchExpenses();
  }, [search, mounted]);

  const fetchStats    = async () => { try { setStats(await dashboardService.getStats()); } catch (e) {} };
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data  = await expenseService.search(search);
      setExpenses(Array.isArray(data) ? data : (data?.results || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateExpense = async () => {
    if (!newExpenseTitle || !newExpenseAmount) return;
    setIsSubmitting(true);
    try {
      await expenseService.create({ title: newExpenseTitle, amount: parseFloat(newExpenseAmount), category: 'nourriture' });
      setNewExpenseTitle(''); setNewExpenseAmount('');
      setIsModalOpen(false);
      fetchExpenses(); fetchStats();
    } catch (e) { alert('Erreur lors de la création.'); }
    finally { setIsSubmitting(false); }
  };

  // Caissier peut créer et valider, admin peut tout faire
  const canCreate   = userRole === 'admin' || userRole === 'caissier';
  const canValidate = userRole === 'admin' || userRole === 'caissier';

  if (!mounted) return null;

  return (
    <div className="dashboard-content max-w-[1400px] mx-auto space-y-8 pb-16">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Flux de dépenses</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Gestion et suivi des sorties de caisse</p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'admin' && (
            <button onClick={() => alert('Génération du rapport PDF...')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-medium text-[var(--foreground)] hover:border-primary/40 transition-all">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          )}
          {canCreate && (
            <button onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-hover transition-all">
              <Plus className="w-4 h-4" /> Nouvelle dépense
            </button>
          )}
        </div>
      </div>

      {/* GRAPHIQUE + MINI STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Aperçu hebdomadaire</h3>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <CalendarIcon className="w-3.5 h-3.5" /> Cette semaine
            </div>
          </div>
          {mounted && (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.weekly_stats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--foreground)' }} />
                  <Bar dataKey="expenses" radius={[6, 6, 0, 0]}>
                    {(stats?.weekly_stats || []).map((_, i) => (
                      <Cell key={i} fill={i === 6 ? '#10b981' : 'rgba(16,185,129,0.25)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {[
            { label: 'Total du mois',        value: `${(stats?.expenses?.today_total * 25) || 0} FG`, icon: DollarSign,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Factures en attente',  value: expenses.filter(e => e.status === 'en_attente').length, icon: PieChart, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Dépenses du jour',     value: `${stats?.expenses?.today_total || 0} FG`, icon: ShoppingBag, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl">
              <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium">{s.label}</p>
                <p className="text-base font-bold text-[var(--foreground)]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLEAU DES DÉPENSES */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Dernières dépenses</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Rechercher..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm outline-none focus:border-primary/50 transition-all text-[var(--foreground)] w-48"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-[var(--card-border)]">
          {expenses.length > 0 ? expenses.map((exp, i) => (
            <motion.div key={exp.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-6 py-4 hover:bg-[var(--background)] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center text-xs text-[var(--text-muted)] font-medium">
                  #{String(exp.id).substring(0, 3)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{exp.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Par {exp.created_by_name || 'Inconnu'} · {new Date(exp.inserted_at || exp.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  exp.status === 'valide'    ? 'bg-emerald-100 text-emerald-700' :
                  exp.status === 'rejete'    ? 'bg-rose-100 text-rose-700'       :
                                               'bg-amber-100 text-amber-700'
                }`}>{exp.status}</span>
                <p className="text-sm font-semibold text-rose-500">- {exp.amount} FG</p>
                <button onClick={() => setSelectedExpense(exp)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  Détails <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">Aucune dépense trouvée.</div>
          )}
        </div>
      </div>

      {/* MODAL NOUVELLE DÉPENSE */}
      <AnimatePresence>
        {isModalOpen && canCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Nouvelle dépense</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all">
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">Libellé</label>
                  <input type="text" value={newExpenseTitle} onChange={(e) => setNewExpenseTitle(e.target.value)}
                    placeholder="Ex: Achat fournitures"
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 text-[var(--foreground)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">Montant (FG)</label>
                  <input type="number" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 text-[var(--foreground)]" />
                </div>
                <button onClick={handleCreateExpense} disabled={isSubmitting || !newExpenseTitle || !newExpenseAmount}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-md shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50 mt-2">
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer la dépense'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DÉTAILS */}
      <AnimatePresence>
        {selectedExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedExpense(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Détails de la dépense</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">ID : #{String(selectedExpense.id).substring(0, 8)}</p>
                </div>
                <button onClick={() => setSelectedExpense(null)} className="p-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all">
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                    <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Montant</p>
                    <p className="text-base font-bold text-rose-500">{selectedExpense.amount} FG</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                    <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Statut</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedExpense.status === 'valide' ? 'bg-emerald-100 text-emerald-700' :
                      selectedExpense.status === 'rejete' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>{selectedExpense.status}</span>
                  </div>
                </div>
                {[
                  { label: 'Libellé',     value: selectedExpense.title },
                  { label: 'Catégorie',   value: selectedExpense.category },
                  { label: 'Créé par',    value: selectedExpense.created_by_name || 'Inconnu' },
                  { label: 'Date',        value: new Date(selectedExpense.inserted_at || selectedExpense.created_at).toLocaleString('fr-FR') },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
                    <p className="text-sm font-medium text-[var(--foreground)] mt-0.5 capitalize">{value}</p>
                  </div>
                ))}
                {selectedExpense.status === 'en_attente' && canValidate && (
                  <button onClick={async () => {
                    try { await expenseService.validate(selectedExpense.id); setSelectedExpense(null); fetchExpenses(); fetchStats(); }
                    catch (e) { alert('Erreur lors de la validation.'); }
                  }}
                  className="w-full py-3 bg-emerald-500/10 text-emerald-700 rounded-xl font-semibold text-sm border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all mt-2">
                    Valider et payer la dépense
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
