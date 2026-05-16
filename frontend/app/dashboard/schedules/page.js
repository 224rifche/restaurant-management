'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  X,
  User
} from 'lucide-react';

import { scheduleService, employeeService } from '@/lib/api';

export default function SchedulesPage() {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    employee: '',
    heure_debut: '08:00',
    heure_fin: '16:00',
    fonction: 'Cuisine'
  });

  const getWeekDates = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() + i);
      return d;
    });
  };

  const [weekDates] = useState(getWeekDates());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const data = await scheduleService.search(formattedDate);
      setSchedules(Array.isArray(data) ? data : (data?.results || []));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchSchedules();
    fetchEmployees();
  }, [selectedDate]);

  if (!mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await scheduleService.create({
        ...formData,
        date: selectedDate.toISOString().split('T')[0]
      });
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du shift");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            Planning & <span className="text-primary">Shifts</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">
            Optimisation des horaires et affectations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" /> Auto-Planning
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
           <div className="glass-card border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]">Semaine en cours</h3>
                 <div className="flex gap-1">
                    <button className="p-1.5 text-[var(--text-muted)] hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <button className="p-1.5 text-[var(--text-muted)] hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
                 </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                 {days.map(day => (
                   <span key={day} className="text-[8px] font-black text-[var(--text-muted)] uppercase">{day}</span>
                 ))}
              </div>

               <div className="grid grid-cols-7 gap-2">
                  {weekDates.map(date => {
                    const isSelected = selectedDate.getDate() === date.getDate() && 
                                     selectedDate.getMonth() === date.getMonth();
                    return (
                      <button 
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${
                          isSelected 
                          ? 'bg-primary text-black' 
                          : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="text-[7px] uppercase font-bold mb-0.5">{days[(date.getDay() + 6) % 7]}</span>
                        <span className="text-xs font-black">{date.getDate()}</span>
                      </button>
                    );
                  })}
               </div>
           </div>

           <div className="glass-card border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]">État du Planning</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                       <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-[var(--foreground)] uppercase">Complet</p>
                       <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Semaine validée</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-widest italic">
                Horaires du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all bg-primary/10 px-4 py-2 rounded-xl border border-primary/20"
              >
                 <Plus className="w-3 h-3" /> Ajouter un shift
              </button>
           </div>

           <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Synchronisation...</p>
                </div>
              ) : schedules.length > 0 ? schedules.map((sch, i) => (
                <motion.div
                  key={sch.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card border border-[var(--card-border)] bg-[var(--card-bg)] p-8 hover:border-primary/20 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                     <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 w-24">
                           <Clock className="w-5 h-5 text-[var(--text-muted)] mb-2" />
                           <span className="text-[10px] font-black text-[var(--foreground)] text-center">{sch.heure_debut?.substring(0,5)} - {sch.heure_fin?.substring(0,5)}</span>
                        </div>
                        <div>
                           <h4 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight">{sch.fonction}</h4>
                           <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest">
                                 <Users className="w-3.5 h-3.5" /> {sch.employee_name || 'Personnel'}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Poste validé</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--background)] border-2 border-[var(--card-border)] flex items-center justify-center text-[10px] font-black text-[var(--foreground)] uppercase">
                           {sch.employee_name?.charAt(0) || 'SLM'}
                        </div>
                        <div className="w-px h-10 bg-[var(--card-border)] mx-4"></div>
                        <button className="px-6 py-2.5 rounded-xl border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:border-primary/30 group-hover:text-primary transition-all">
                           Éditer
                        </button>
                     </div>
                  </div>
                </motion.div>
              )) : (
                <div className="p-12 border-2 border-dashed border-[var(--card-border)] rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[var(--foreground)] uppercase">Pas de shifts prévus</h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Vous pouvez planifier la journée maintenant</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/30 pb-0.5 hover:border-primary transition-all"
                  >
                    Créer le premier shift
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0b14] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">Nouveau <span className="text-primary">Shift</span></h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Planification du {selectedDate.toLocaleDateString('fr-FR')}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Employé</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <select 
                      required
                      value={formData.employee}
                      onChange={(e) => setFormData({...formData, employee: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0b14]">Sélectionner un collaborateur</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-[#0a0b14]">
                          {emp.user?.nom || 'Employé'} ({emp.fonction})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Heure Début</label>
                    <input 
                      type="time" 
                      required
                      value={formData.heure_debut}
                      onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Heure Fin</label>
                    <input 
                      type="time" 
                      required
                      value={formData.heure_fin}
                      onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Poste de travail</label>
                  <select 
                    value={formData.fonction}
                    onChange={(e) => setFormData({...formData, fonction: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="Cuisine" className="bg-[#0a0b14]">Cuisine</option>
                    <option value="Caisse" className="bg-[#0a0b14]">Caisse</option>
                    <option value="Salle" className="bg-[#0a0b14]">Service Salle</option>
                    <option value="Bar" className="bg-[#0a0b14]">Bar</option>
                    <option value="Nettoyage" className="bg-[#0a0b14]">Nettoyage</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                >
                  Confirmer la planification
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
