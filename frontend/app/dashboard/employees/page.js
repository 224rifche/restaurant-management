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
  Lock,
  Edit2,
  Trash2,
  Power,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';

import { employeeService } from '@/lib/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous les rôles');
  const [view, setView] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nom: '',
    telephone: '',
    poste: 'serveur',
    salaire_base: '',
    statut: 'actif',
    notes: ''
  });

  // Form State
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    poste: 'serveur',
    salaire_base: '',
    password: 'password123'
  });

  const [mounted, setMounted] = useState(false);

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      let finalData = Array.isArray(data) ? data : (data?.results || []);
      
      if (search) {
        finalData = finalData.filter(emp => 
          (emp.nom && emp.nom.toLowerCase().includes(search.toLowerCase())) ||
          (emp.poste_label && emp.poste_label.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      if (roleFilter !== 'Tous les rôles') {
        finalData = finalData.filter(emp => emp.poste_label === roleFilter);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeeService.create(formData);
      setIsModalOpen(false);
      setFormData({ nom: '', telephone: '', poste: 'serveur', salaire_base: '', password: 'password123' });
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'employé. Vérifiez si l'email est déjà utilisé.");
    }
  };

  const toggleDropdown = (id) => {
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('.dropdown-trigger') || e.target.closest('.dropdown-menu')) {
        return;
      }
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  if (!mounted) return null;

  const handleCardClick = (emp) => {
    setSelectedEmployee(emp);
    setIsDetailModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setEditFormData({
      nom: emp.nom || '',
      telephone: emp.telephone || '',
      poste: emp.poste || 'serveur',
      salaire_base: emp.salaire_base || '',
      statut: emp.statut || 'actif',
      notes: emp.notes || ''
    });
    setIsEditModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeeService.update(selectedEmployee.id, editFormData);
      setIsEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de l'employé.");
    }
  };

  const handleToggleSuspend = async (emp) => {
    setActiveDropdownId(null);
    try {
      if (emp.statut === 'actif') {
        await employeeService.delete(emp.id);
      } else {
        await employeeService.activer(emp.id);
      }
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de statut de l'employé.");
    }
  };

  const handleDeleteClick = async (emp) => {
    setActiveDropdownId(null);
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${emp.nom} ? Cette action est irréversible.`)) {
      try {
        await employeeService.hardDelete(emp.id);
        fetchEmployees();
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression de l'employé.");
      }
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
               <option className="bg-[#0a0b14]">Serveur / Serveuse</option>
               <option className="bg-[#0a0b14]">Caissier / Caissière</option>
               <option className="bg-[#0a0b14]">Administrateur</option>
               <option className="bg-[#0a0b14]">Manager</option>
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
              onClick={() => handleCardClick(emp)}
              className="group glass-card border border-[var(--card-border)] bg-[var(--card-bg)] p-6 relative overflow-hidden cursor-pointer hover:border-primary/20 transition-all duration-300"
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
                          {emp.nom?.charAt(0) || 'E'}
                       </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--background)] rounded-full border border-[var(--card-border)] flex items-center justify-center">
                       <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                 </div>

                 <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">{emp.nom || 'Employé'}</h3>
                 <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{emp.poste_label}</p>

                 <div className="flex items-center gap-1 mt-4 mb-6">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-black text-[var(--foreground)]">4.5</span>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold ml-1">Rating</span>
                 </div>

                 <div className="grid grid-cols-2 gap-3 w-full">
                    <a 
                      href={`tel:${emp.telephone}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[var(--text-muted)] hover:text-white transition-all"
                    >
                       <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a 
                      href={`mailto:contact@${emp.telephone}.com`} 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[var(--text-muted)] hover:text-white transition-all"
                    >
                       <Mail className="w-3.5 h-3.5" />
                    </a>
                 </div>
              </div>

              <div className="absolute top-4 left-4 z-20">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(emp.id);
                  }}
                  className="dropdown-trigger p-1 text-[var(--text-muted)] hover:text-white transition-all hover:bg-white/5 rounded-full"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {activeDropdownId === emp.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="dropdown-menu absolute left-0 mt-2 w-44 bg-[#0a0b14]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-30 p-2 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-colors rounded-xl flex items-center gap-2 font-bold"
                      >
                        <Edit2 className="w-3 h-3 text-primary" /> Modifier
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(emp)}
                        className={`w-full text-left px-4 py-2 hover:bg-white/5 text-xs transition-colors rounded-xl flex items-center gap-2 font-bold ${
                          emp.statut === 'actif' ? 'text-amber-500 hover:text-amber-400' : 'text-primary hover:text-primary-light'
                        }`}
                      >
                        <Power className="w-3 h-3" /> {emp.statut === 'actif' ? 'Suspendre' : 'Activer'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(emp)}
                        className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-xs text-rose-500 hover:text-rose-400 transition-colors rounded-xl flex items-center gap-2 font-bold"
                      >
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Poste</label>
                    <select 
                      value={formData.poste}
                      onChange={(e) => setFormData({...formData, poste: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="serveur" className="bg-[#0a0b14]">Serveur</option>
                      <option value="caissier" className="bg-[#0a0b14]">Caissier</option>
                      <option value="admin" className="bg-[#0a0b14]">Administrateur</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Salaire de base (FG)</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="number" 
                        required
                        placeholder="Ex: 500000"
                        value={formData.salaire_base}
                        onChange={(e) => setFormData({...formData, salaire_base: e.target.value})}
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

      {/* MODAL MODIFIER UN EMPLOYÉ */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
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
                  <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">Modifier le <span className="text-primary">Collaborateur</span></h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Mise à jour du profil équipe SLM</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Nom Complet</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Jean Dupont"
                        value={editFormData.nom}
                        onChange={(e) => setEditFormData({...editFormData, nom: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Poste</label>
                    <select 
                      value={editFormData.poste}
                      onChange={(e) => setEditFormData({...editFormData, poste: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="serveur" className="bg-[#0a0b14]">Serveur</option>
                      <option value="caissier" className="bg-[#0a0b14]">Caissier</option>
                      <option value="admin" className="bg-[#0a0b14]">Administrateur</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Salaire de base (FG)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="number" 
                        required
                        placeholder="Ex: 500000"
                        value={editFormData.salaire_base}
                        onChange={(e) => setEditFormData({...editFormData, salaire_base: e.target.value})}
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
                        value={editFormData.telephone}
                        onChange={(e) => setEditFormData({...editFormData, telephone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Statut</label>
                    <select 
                      value={editFormData.statut}
                      onChange={(e) => setEditFormData({...editFormData, statut: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="actif" className="bg-[#0a0b14]">Actif</option>
                      <option value="inactif" className="bg-[#0a0b14]">Inactif (Suspendu)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Notes / Observations</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-4 h-4 text-primary" />
                    <textarea 
                      placeholder="Ajouter des notes internes sur l'employé..."
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all resize-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                >
                  Enregistrer les modifications
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DÉTAILS EMPLOYÉ */}
      <AnimatePresence>
        {isDetailModalOpen && selectedEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0b14] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              {/* Header inside modal */}
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Main Profile Header */}
              <div className="flex flex-col items-center text-center pb-8 border-b border-white/5">
                <div className="relative mb-6">
                  <div className="w-28 h-28 rounded-full bg-white/5 border-2 border-primary/30 p-1.5">
                    <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shadow-inner">
                      {selectedEmployee.nom?.charAt(0) || 'E'}
                    </div>
                  </div>
                  <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shadow-lg ${
                    selectedEmployee.statut === 'actif' ? 'bg-primary/20 text-primary' : 'bg-rose-500/20 text-rose-500'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">
                  {selectedEmployee.nom}
                </h2>
                
                <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                  <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {selectedEmployee.poste_label}
                  </span>
                  
                  <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                    selectedEmployee.statut === 'actif' 
                    ? 'border-primary/20 bg-primary/5 text-primary' 
                    : 'border-rose-500/20 bg-rose-500/5 text-rose-500'
                  }`}>
                    {selectedEmployee.statut === 'actif' ? 'Actif' : 'Suspendu / Inactif'}
                  </span>
                </div>
              </div>

              {/* Detailed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                {/* Contact Box */}
                <div className="glass-card p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Coordonnées</h4>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--text-muted)]">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Téléphone</p>
                      <a href={`tel:${selectedEmployee.telephone}`} className="text-sm font-bold text-white hover:text-primary transition-colors">
                        {selectedEmployee.telephone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--text-muted)]">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Email (Généré)</p>
                      <a href={`mailto:contact@${selectedEmployee.telephone}.com`} className="text-sm font-bold text-white hover:text-primary transition-colors">
                        contact@{selectedEmployee.telephone}.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* HR & Financial Box */}
                <div className="glass-card p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">RH & Contrat</h4>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--text-muted)]">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Salaire de Base</p>
                      <p className="text-sm font-black text-white">
                        {selectedEmployee.salaire_base ? Number(selectedEmployee.salaire_base).toLocaleString('fr-FR') : '0'} FG
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--text-muted)]">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Date d'embauche</p>
                      <p className="text-sm font-bold text-white">
                        {selectedEmployee.date_embauche 
                          ? new Date(selectedEmployee.date_embauche).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : selectedEmployee.inserted_at 
                            ? new Date(selectedEmployee.inserted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : 'Non renseignée'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes / Internal Observations */}
              {selectedEmployee.notes && (
                <div className="glass-card p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Notes & Observations</h4>
                  <p className="text-xs text-slate-300 italic leading-relaxed pl-4 border-l-2 border-primary/40">
                    "{selectedEmployee.notes}"
                  </p>
                </div>
              )}

              {/* Footer Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEditModal(selectedEmployee);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02]"
                >
                  <Edit2 className="w-4 h-4 text-primary" /> Modifier le profil
                </button>
                
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleToggleSuspend(selectedEmployee);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] ${
                    selectedEmployee.statut === 'actif'
                    ? 'border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10'
                    : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                  }`}
                >
                  <Power className="w-4 h-4" /> {selectedEmployee.statut === 'actif' ? 'Suspendre' : 'Activer'}
                </button>

                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleDeleteClick(selectedEmployee);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all hover:scale-[1.02]"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
