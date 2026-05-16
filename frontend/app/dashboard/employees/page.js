'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MoreHorizontal, 
  Filter,
  Grid,
  List as ListIcon,
  ChevronRight,
  ShieldCheck,
  Star,
  Loader2,
  X,
  User as UserIcon,
  Lock
} from 'lucide-react';

import { employeeService } from '@/lib/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous les rôles');
  const [view, setView] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    fonction: 'Serveur',
    password: 'password123' // Mot de passe par défaut
  });

  const [mounted, setMounted] = useState(false);

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      let finalData = Array.isArray(data) ? data : (data?.results || []);
      
      if (search) {
        finalData = finalData.filter(emp => 
          emp.user?.nom?.toLowerCase().includes(search.toLowerCase()) ||
          emp.fonction.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (roleFilter !== 'Tous les rôles') {
        finalData = finalData.filter(emp => emp.fonction === roleFilter);
      }

      setEmployees(finalData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchEmployees();
  }, [search, roleFilter]);

  if (!mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeeService.create(formData);
      setIsModalOpen(false);
      setFormData({ nom: '', email: '', telephone: '', fonction: 'Serveur', password: 'password123' });
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'employé. Vérifiez si l'email est déjà utilisé.");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            Équipe <span className="text-primary">SLM</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">
            Gestion des collaborateurs et des talents
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-1">
             <button 
               onClick={() => setView('grid')}
               className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-primary text-black' : 'text-[var(--text-muted)] hover:text-white'}`}
             >
               <Grid className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setView('list')}
               className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-primary text-black' : 'text-[var(--text-muted)] hover:text-white'}`}
             >
               <ListIcon className="w-4 h-4" />
             </button>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" /> Recruter
          </motion.button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--card-bg)] border border-[var(--card-border)] p-3 rounded-2xl">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, rôle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none pl-12 pr-4 py-2 text-xs outline-none text-[var(--foreground)] placeholder:text-[var(--text-muted)]"
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-[var(--card-border)] pt-4 md:pt-0 md:pl-4">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] outline-none border-none cursor-pointer"
            >
               <option className="bg-[#0a0b14]">Tous les rôles</option>
               <option className="bg-[#0a0b14]">Cuisine</option>
               <option className="bg-[#0a0b14]">Caisse</option>
               <option className="bg-[#0a0b14]">Salle</option>
               <option className="bg-[#0a0b14]">Bar</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all">
               <Filter className="w-3.5 h-3.5" /> Filtres
            </button>
         </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Chargement de l'équipe...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.length > 0 ? employees.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group glass-card border border-[var(--card-border)] bg-[var(--card-bg)] p-6 relative overflow-hidden"
            >
              <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                emp.presence_status === 'en_service' 
                ? 'border-primary/20 bg-primary/5 text-primary' 
                : 'border-rose-500/20 bg-rose-500/5 text-rose-500'
              }`}>
                <div className={`w-1 h-1 rounded-full ${emp.presence_status === 'en_service' ? 'bg-primary animate-pulse' : 'bg-rose-500'}`}></div>
                {emp.presence_status === 'en_service' ? 'En service' : 'Absent'}
              </div>

              <div className="flex flex-col items-center text-center mt-4">
                 <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-[var(--card-border)] p-1 group-hover:border-primary/30 transition-all duration-500">
                       <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-black">
                          {emp.user?.nom?.charAt(0) || 'E'}
                       </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--background)] rounded-full border border-[var(--card-border)] flex items-center justify-center">
                       <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                 </div>

                 <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">{emp.user?.nom || 'Employé'}</h3>
                 <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{emp.fonction}</p>

                 <div className="flex items-center gap-1 mt-4 mb-6">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-black text-[var(--foreground)]">4.5</span>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold ml-1">Rating</span>
                 </div>

                 <div className="grid grid-cols-2 gap-3 w-full">
                    <a href={`tel:${emp.telephone}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[var(--text-muted)] hover:text-white transition-all">
                       <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a href={`mailto:${emp.user?.email || '#'}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[var(--text-muted)] hover:text-white transition-all">
                       <Mail className="w-3.5 h-3.5" />
                    </a>
                 </div>
              </div>

              <button className="absolute top-4 left-4 p-1 text-[var(--text-muted)] hover:text-white transition-all">
                 <MoreHorizontal className="w-4 h-4" />
              </button>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center text-[var(--text-muted)] text-xs font-black uppercase tracking-widest italic">
              Aucun collaborateur trouvé
            </div>
          )}
        </div>
      )}

      {/* MODAL RECRUTER UN EMPLOYÉ */}
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
              className="relative w-full max-w-xl bg-[#0a0b14] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">Recruter un <span className="text-primary">Collaborateur</span></h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Nouveau profil équipe SLM</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Nom Complet</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Jean Dupont"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Fonction</label>
                    <select 
                      value={formData.fonction}
                      onChange={(e) => setFormData({...formData, fonction: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="Serveur" className="bg-[#0a0b14]">Serveur</option>
                      <option value="Cuisinier" className="bg-[#0a0b14]">Cuisinier</option>
                      <option value="Chef" className="bg-[#0a0b14]">Chef de Cuisine</option>
                      <option value="Caissier" className="bg-[#0a0b14]">Caissier</option>
                      <option value="Barman" className="bg-[#0a0b14]">Barman</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email (Identifiant)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="email" 
                        required
                        placeholder="jean@exemple.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="tel" 
                        required
                        placeholder="620 00 00 00"
                        value={formData.telephone}
                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Mot de passe temporaire</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input 
                      type="text" 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <p className="text-[9px] text-[var(--text-muted)] font-medium mt-1 ml-1 italic">* L'employé pourra modifier son mot de passe lors de sa première connexion.</p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                >
                  Finaliser le recrutement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
