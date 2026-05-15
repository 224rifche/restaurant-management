'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

const data = [
  { name: 'Lun', amount: 450000 },
  { name: 'Mar', amount: 320000 },
  { name: 'Mer', amount: 600000 },
  { name: 'Jeu', amount: 480000 },
  { name: 'Ven', amount: 750000 },
  { name: 'Sam', amount: 900000 },
  { name: 'Dim', amount: 400000 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

import { dashboardService, expenseService } from '@/lib/api';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

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

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            Flux de <span className="text-primary">Dépenses</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium mt-1">Gestion et suivi analytique des sorties de caisse</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Plus className="w-3.5 h-3.5" /> Nouvelle dépense
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-8 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] italic">Aperçu Hebdomadaire</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-primary">
              <CalendarIcon className="w-3 h-3" /> Cette semaine
            </div>
          </div>
          {mounted && (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.weekly_stats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0f12', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
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
        </div>

        {/* Mini Stats */}
        <div className="space-y-6">
          {[
            { label: 'Total Mois', value: `${(stats?.expenses?.today_total * 25) || 0} FG`, icon: DollarSign, trend: '+12%', color: 'emerald-500' },
            { label: 'Factures en attente', value: expenses.filter(e => e.status === 'en_attente').length, icon: PieChart, trend: 'Action requise', color: 'blue-500' },
            { label: 'Dépenses du jour', value: `${stats?.expenses?.today_total || 0} FG`, icon: ShoppingBag, trend: `${stats?.expenses?.trend || 0}%`, color: 'rose-500' }
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `rgba(var(--${stat.color}), 0.1)` }}>
                <stat.icon className="w-6 h-6" style={{ color: `var(--${stat.color})` }} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</p>
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-black">{stat.value}</h4>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/5">{stat.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest italic">Dernières Dépenses</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-primary/50 transition-all" 
              />
            </div>
            <button className="p-2 bg-white/5 rounded-xl border border-white/10"><Filter className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="divide-y divide-white/5">
          {expenses.length > 0 ? expenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-[10px] text-[var(--text-muted)] group-hover:text-primary transition-colors">#{exp.id.substring(0, 4)}</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight">{exp.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">Par {exp.issuer_name || 'Inconnu'} • {new Date(exp.inserted_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="hidden md:block text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    exp.status === 'valide' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    exp.status === 'rejete' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {exp.status}
                  </span>
                  <p className="text-[9px] text-[var(--text-muted)] font-medium mt-1">{exp.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-rose-500">- {exp.amount} FG</p>
                  <button className="mt-1 text-primary uppercase tracking-widest text-[8px] font-black hover:underline flex items-center gap-1">
                    Détails <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
              Aucune dépense trouvée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
