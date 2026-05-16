'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  Users,
  Clock,
  Settings,
  Plus,
  ArrowRight,
  Calculator,
  Calendar,
  Zap,
  DollarSign,
  UserPlus,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const togglePalette = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        togglePalette();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomEvent = () => {
      togglePalette();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-command-palette', handleCustomEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-command-palette', handleCustomEvent);
    };
  }, [togglePalette, isOpen]);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchEntities = async () => {
      setLoading(true);
      try {
        const { employeeService, expenseService, attendanceService, scheduleService, notificationService } = await import('@/lib/api');

        const [empData, expData, attData, schData, notData] = await Promise.all([
          employeeService.search(query),
          expenseService.search(query),
          attendanceService.search(query),
          scheduleService.search(query),
          notificationService.search(query)
        ]);

        const employeeResults = (Array.isArray(empData) ? empData : (empData.results || [])).map(emp => ({
          id: `emp-${emp.id}`,
          name: emp.user.nom,
          icon: Users,
          category: 'Employés trouvés',
          href: `/dashboard/employees`
        }));

        const expenseResults = (Array.isArray(expData) ? expData : (expData.results || [])).map(exp => ({
          id: `exp-${exp.id}`,
          name: `${exp.title} (${exp.amount} FG)`,
          icon: DollarSign,
          category: 'Dépenses trouvées',
          href: `/dashboard/expenses`
        }));

        const attendanceResults = (Array.isArray(attData) ? attData : (attData.results || [])).map(att => ({
          id: `att-${att.id}`,
          name: `Présence: ${att.employee?.nom || 'Employé'} (${att.statut})`,
          icon: Clock,
          category: 'Pointages trouvés',
          href: `/dashboard/attendance`
        }));

        const scheduleResults = (Array.isArray(schData) ? schData : (schData.results || [])).map(sch => ({
          id: `sch-${sch.id}`,
          name: `Shift: ${sch.employee?.user?.nom || 'Employé'} - ${sch.fonction}`,
          icon: Calendar,
          category: 'Plannings trouvés',
          href: `/dashboard/schedules`
        }));

        const notificationResults = (Array.isArray(notData) ? notData : (notData.results || [])).map(not => ({
          id: `not-${not.id}`,
          name: not.message,
          icon: Zap,
          category: 'Alertes trouvées',
          href: `/dashboard/notifications`
        }));

        setResults([
          ...employeeResults,
          ...expenseResults,
          ...attendanceResults,
          ...scheduleResults,
          ...notificationResults
        ]);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchEntities, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const actions = [
    { id: 'add-employee', name: 'Ajouter un employé', icon: UserPlus, shortcut: 'A', category: 'Actions Rapides', href: '/dashboard/employees', keywords: 'staff recrutement nouveau embauche' },
    { id: 'check-in', name: 'Pointer (Arrivée/Départ)', icon: Clock, shortcut: 'P', category: 'Actions Rapides', href: '/dashboard/attendance', keywords: 'présence retard pointage scan qr' },
    { id: 'add-expense', name: 'Déclarer une dépense', icon: DollarSign, shortcut: 'D', category: 'Actions Rapides', href: '/dashboard/expenses', keywords: 'argent facture achat dépense coût' },
    { id: 'view-notifications', name: 'Voir les alertes', icon: Zap, shortcut: 'N', category: 'Actions Rapides', href: '/dashboard/notifications', keywords: 'notification message alerte urgent' },
    { id: 'view-attendance', name: 'Historique des présences', icon: Users, category: 'Navigation', href: '/dashboard/attendance', keywords: 'liste historique pointages' },
    { id: 'view-schedules', name: 'Planning et Rotations', icon: Calendar, category: 'Navigation', href: '/dashboard/schedules', keywords: 'horaire emploi du temps équipe calendrier' },
    { id: 'view-stats', name: 'Performances SLM', icon: Zap, category: 'Navigation', href: '/dashboard', keywords: 'rapport stats graphiques analytique' },
    { id: 'settings', name: 'Paramètres du restaurant', icon: Settings, category: 'Système', href: '/dashboard', keywords: 'configuration profil compte' },
  ];

  const filteredActions = [
    ...actions.filter(action =>
      action.name.toLowerCase().includes(query.toLowerCase()) ||
      action.category.toLowerCase().includes(query.toLowerCase()) ||
      (action.keywords && action.keywords.toLowerCase().includes(query.toLowerCase()))
    ),
    ...results
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl bg-[#0a0b14] border border-white/10 rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              <Search className="w-5 h-5 text-primary" />
              <input
                autoFocus
                type="text"
                placeholder="Que voulez-vous faire ?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium placeholder:text-white/20"
              />
              <div className="flex items-center gap-4">
                {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">ESC</span>
                </div>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-4">
              {filteredActions.length > 0 ? (
                <div className="space-y-6">
                  {['Actions Rapides', 'Employés trouvés', 'Dépenses trouvées', 'Pointages trouvés', 'Plannings trouvés', 'Alertes trouvées', 'Navigation', 'Système'].map(category => {
                    const categoryActions = filteredActions.filter(a => a.category === category);
                    if (categoryActions.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2">
                        <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 italic">{category}</h3>
                        <div className="grid grid-cols-1 gap-1">
                          {categoryActions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                setIsOpen(false);
                                if (action.href) router.push(action.href);
                              }}
                              className="group flex items-center justify-between p-4 rounded-2xl hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
                                  <action.icon className="w-5 h-5 text-white/60 group-hover:text-primary" />
                                </div>
                                <span className="text-sm font-bold text-white/70 group-hover:text-white">{action.name}</span>
                              </div>
                              {action.shortcut && (
                                <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] font-black uppercase">{action.shortcut}</span>
                                </div>
                              )}
                              {!action.shortcut && (
                                <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-sm text-white/30 font-medium">Aucun résultat pour "{query}"</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-black text-white/40">↑↓</kbd>
                  <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Naviguer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-black text-white/40">Enter</kbd>
                  <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Sélectionner</span>
                </div>
              </div>
              <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] italic">SLM Intelligence Engine v1.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
