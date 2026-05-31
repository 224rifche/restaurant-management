'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Plus, Clock, Users,
  CheckCircle2, X, User
} from 'lucide-react';
import { scheduleService, employeeService } from '@/lib/api';
import Cookies from 'js-cookie';

export default function SchedulesPage() {
  const [schedules, setSchedules]   = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [mounted, setMounted]       = useState(false);
  const [userRole, setUserRole]     = useState('');
  const [userNom, setUserNom]       = useState('');

  const [formData, setFormData] = useState({
    employee: '', heure_debut: '08:00', heure_fin: '16:00',
    fonction: 'salle_int', jours_repos: 'Aucun'
  });

  useEffect(() => {
    setUserRole(Cookies.get('user_role') || '');
    setUserNom(Cookies.get('user_nom')   || '');
    setMounted(true);
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await scheduleService.getAll();
      let final = Array.isArray(data) ? data : (data?.results || []);
      // Serveur et Cuisine : voir seulement leur propre planning
      if (userRole === 'serveur' || userRole === 'cuisine') {
        final = final.filter(s =>
          s.employee?.user?.nom?.toLowerCase() === userNom.toLowerCase() ||
          s.employee?.nom?.toLowerCase() === userNom.toLowerCase()
        );
      }
      setSchedules(final);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchSchedules();
    if (userRole === 'admin') fetchEmployees();
  }, [mounted, userRole]);

  if (!mounted) return null;

  const canEdit   = userRole === 'admin';
  const isReadOnly = !canEdit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await scheduleService.update(editingId, formData);
      } else {
        await scheduleService.create(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du shift");
    }
  };

  const openCreateModal = () => {
    setFormData({ employee: '', heure_debut: '08:00', heure_fin: '16:00', fonction: 'salle_int', jours_repos: 'Aucun' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (sch) => {
    setFormData({
      employee:    sch.employee?.id || '',
      heure_debut: sch.heure_debut?.substring(0, 5) || '08:00',
      heure_fin:   sch.heure_fin?.substring(0, 5) || '16:00',
      fonction:    sch.fonction || 'salle_int',
      jours_repos: sch.jours_repos || 'Aucun'
    });
    setEditingId(sch.id);
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-content max-w-[1400px] mx-auto space-y-8 pb-16">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {isReadOnly ? 'Mon planning' : 'Planning & Shifts'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {isReadOnly
              ? 'Vos horaires et affectations'
              : 'Gestion des horaires et affectations de l\'équipe'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" /> Ajouter un shift
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar info */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">État du planning</h3>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Complet</p>
                <p className="text-xs text-[var(--text-muted)]">Semaine validée</p>
              </div>
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isReadOnly
                ? 'Consultez vos horaires de travail. Pour toute modification, contactez votre manager.'
                : 'Définissez les horaires fixes pour chaque membre de l\'équipe.'}
            </p>
          </div>
        </div>

        {/* Liste des shifts */}
        <div className="xl:col-span-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
            </div>
          ) : schedules.length > 0 ? schedules.map((sch, i) => (
            <motion.div
              key={sch.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 hover:border-primary/20 hover:shadow-sm transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] min-w-[80px]">
                    <Clock className="w-4 h-4 text-[var(--text-muted)] mb-1" />
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {sch.heure_debut?.substring(0, 5)} - {sch.heure_fin?.substring(0, 5)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">{sch.fonction_label}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Users className="w-3 h-3" />
                        {sch.employee?.user?.nom || sch.employee?.nom || 'Employé'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">Repos : {sch.jours_repos || 'Aucun'}</span>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleEditClick(sch)}
                    className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-xs font-medium text-[var(--text-muted)] group-hover:border-primary/30 group-hover:text-primary transition-all"
                  >
                    Modifier
                  </button>
                )}
              </div>
            </motion.div>
          )) : (
            <div className="py-16 flex flex-col items-center text-center border-2 border-dashed border-[var(--card-border)] rounded-2xl">
              <CalendarIcon className="w-8 h-8 text-[var(--text-muted)] mb-3" />
              <p className="text-sm font-medium text-[var(--foreground)]">
                {isReadOnly ? 'Aucun planning assigné pour le moment' : 'Pas de shifts prévus'}
              </p>
              {canEdit && (
                <button onClick={openCreateModal} className="mt-3 text-sm text-primary hover:underline">
                  Créer le premier shift
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL — admin seulement */}
      <AnimatePresence>
        {isModalOpen && canEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-lg bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {editingId ? 'Modifier' : 'Nouveau'} shift
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">Employé</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <select required value={formData.employee}
                      onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="">Sélectionner un collaborateur</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nom || 'Employé'} ({emp.poste_label || emp.poste || ''})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[['heure_debut', 'Heure début'], ['heure_fin', 'Heure fin']].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">{label}</label>
                      <input type="time" required value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">Poste de travail</label>
                  <select value={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="salle_int">Salle Intérieure</option>
                    <option value="salle_balcon">Salle Balcon</option>
                    <option value="sauce">Préparation des Sauces</option>
                    <option value="caisse">Gestion Caisse</option>
                    <option value="repos">Jour de Repos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">Jours de repos</label>
                  <input type="text" value={formData.jours_repos} placeholder="Aucun"
                    onChange={(e) => setFormData({ ...formData, jours_repos: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <button type="submit"
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-md shadow-primary/20 hover:bg-primary-hover transition-all mt-2">
                  {editingId ? 'Enregistrer les modifications' : 'Confirmer le shift'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
