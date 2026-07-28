'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, ShieldAlert, Copy } from 'lucide-react';
import { shiftScheduleService } from '@/lib/admin/api';
import api from '@/lib/api-core';

const JOURS = [
  ['lundi', 'Lun'], ['mardi', 'Mar'], ['mercredi', 'Mer'],
  ['jeudi', 'Jeu'], ['vendredi', 'Ven'], ['samedi', 'Sam'], ['dimanche', 'Dim'],
];

const nouvelleEquipeVide = () => ({
  _id: Math.random().toString(36).slice(2),
  nom_equipe: '',
  heure_debut: '08:00',
  heure_fin: '16:00',
  tolerance_retard_minutes: 10,
  jours: [],
});

export default function HorairesPage() {
  const [horaires, setHoraires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posteFiltre, setPosteFiltre] = useState('serveur');

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [equipesDraft, setEquipesDraft] = useState([nouvelleEquipeVide()]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  const [editingEquipe, setEditingEquipe] = useState(null);

  const fetchHoraires = async () => {
    setLoading(true);
    try {
      const data = await shiftScheduleService.getAll();
      setHoraires(data);
    } catch (err) {
      console.error('Erreur chargement horaires:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoraires();
  }, []);

  const equipesGroupees = (() => {
    const parPoste = horaires.filter((h) => h.poste === posteFiltre);
    // Clé composite : nom_equipe + heure_debut + heure_fin
    // Evite de fusionner deux équipes de même nom mais d'horaires différents
    const groupes = {};

    for (const h of parPoste) {
      const cle = `${h.nom_equipe}||${h.heure_debut?.substring(0, 5)}||${h.heure_fin?.substring(0, 5)}`;
      if (!groupes[cle]) {
        groupes[cle] = {
          nom_equipe: h.nom_equipe,
          heure_debut: h.heure_debut?.substring(0, 5),
          heure_fin: h.heure_fin?.substring(0, 5),
          tolerance_retard_minutes: h.tolerance_retard_minutes,
          is_active: h.is_active,
          parJour: {},
        };
      }
      groupes[cle].parJour[h.jour_semaine] = h;
    }

    return Object.values(groupes);
  })();

  const openBuilder = () => {
    setEquipesDraft([nouvelleEquipeVide()]);
    setErreur(null);
    setIsBuilderOpen(true);
  };

  const ajouterLigneEquipe = () => setEquipesDraft((prev) => [...prev, nouvelleEquipeVide()]);

  const dupliquerLigneEquipe = (id) => {
    setEquipesDraft((prev) => {
      const source = prev.find((e) => e._id === id);
      if (!source) return prev;
      return [...prev, { ...source, _id: Math.random().toString(36).slice(2), nom_equipe: source.nom_equipe + ' (copie)' }];
    });
  };

  const supprimerLigneEquipe = (id) => setEquipesDraft((prev) => prev.filter((e) => e._id !== id));

  const majLigneEquipe = (id, champ, valeur) => {
    setEquipesDraft((prev) => prev.map((e) => (e._id === id ? { ...e, [champ]: valeur } : e)));
  };

  const toggleJourLigne = (id, jourKey) => {
    setEquipesDraft((prev) => prev.map((e) => {
      if (e._id !== id) return e;
      const dejaCoche = e.jours.includes(jourKey);
      return { ...e, jours: dejaCoche ? e.jours.filter((j) => j !== jourKey) : [...e.jours, jourKey] };
    }));
  };

  const toggleTouteLaSemaineLigne = (id) => {
    setEquipesDraft((prev) => prev.map((e) => {
      if (e._id !== id) return e;
      return { ...e, jours: e.jours.length === JOURS.length ? [] : JOURS.map(([key]) => key) };
    }));
  };

  const handleSubmitBuilder = async (e) => {
    e.preventDefault();
    setErreur(null);

    const lignesValides = equipesDraft.filter((eq) => eq.nom_equipe && eq.jours.length > 0);
    if (lignesValides.length === 0) {
      setErreur('Renseignez au moins une equipe avec un nom et au moins un jour coche.');
      return;
    }

    setEnvoi(true);
    try {
      await Promise.all(
        lignesValides.map((eq) =>
          api.post('/shifts/bulk-create', {
            poste: posteFiltre,
            nom_equipe: eq.nom_equipe,
            heure_debut: eq.heure_debut,
            heure_fin: eq.heure_fin,
            tolerance_retard_minutes: eq.tolerance_retard_minutes,
            is_active: true,
            jours: eq.jours,
          })
        )
      );
      setIsBuilderOpen(false);
      fetchHoraires();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data;
      setErreur(typeof detail === 'object' ? Object.values(detail).flat().join(' ') : "Erreur lors de l'enregistrement.");
    } finally {
      setEnvoi(false);
    }
  };

  const openEditEquipe = (equipe) => {
    setEditingEquipe({
      nomOriginal: equipe.nom_equipe,
      heureDebutOriginale: equipe.heure_debut || Object.values(equipe.parJour)[0]?.heure_debut?.substring(0, 5) || '08:00',
      nom_equipe: equipe.nom_equipe,
      heure_debut: equipe.heure_debut || Object.values(equipe.parJour)[0]?.heure_debut?.substring(0, 5) || '08:00',
      heure_fin: equipe.heure_fin || Object.values(equipe.parJour)[0]?.heure_fin?.substring(0, 5) || '16:00',
      tolerance_retard_minutes: equipe.tolerance_retard_minutes,
      is_active: equipe.is_active,
      jours: Object.keys(equipe.parJour),
      // Tous les IDs existants (pour les supprimer proprement)
      idsParJour: Object.fromEntries(Object.entries(equipe.parJour).map(([j, h]) => [j, h.id])),
    });
  };

  const toggleJourEdit = (jourKey) => {
    setEditingEquipe((prev) => {
      const dejaCoche = prev.jours.includes(jourKey);
      return { ...prev, jours: dejaCoche ? prev.jours.filter((j) => j !== jourKey) : [...prev.jours, jourKey] };
    });
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      // 1. Supprimer TOUS les anciens enregistrements de cette équipe (peu importe le nom actuel)
      const idsOriginaux = Object.values(editingEquipe.idsParJour);
      await Promise.all(
        idsOriginaux.map((id) => shiftScheduleService.delete(id))
      );

      // 2. Recréer les jours sélectionnés avec les valeurs à jour (nom, horaires, tolérance)
      if (editingEquipe.jours.length > 0) {
        await api.post('/shifts/bulk-create', {
          poste: posteFiltre,
          nom_equipe: editingEquipe.nom_equipe,
          heure_debut: editingEquipe.heure_debut,
          heure_fin: editingEquipe.heure_fin,
          tolerance_retard_minutes: editingEquipe.tolerance_retard_minutes,
          is_active: editingEquipe.is_active,
          jours: editingEquipe.jours,
        });
      }

      setEditingEquipe(null);
      fetchHoraires();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de l'equipe.");
    }
  };

  const handleDeleteEquipe = async (equipe) => {
    if (!confirm('Supprimer entierement l equipe ' + equipe.nom_equipe + ' (tous les jours) ?')) return;
    try {
      await Promise.all(Object.values(equipe.parJour).map((h) => shiftScheduleService.delete(h.id)));
      fetchHoraires();
    } catch (err) {
      console.error(err);
      alert('Impossible de supprimer cette equipe.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Horaires de reference</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Confidentiel -- la tolerance de retard n est jamais visible par les employes
          </p>
        </div>
        <button
          onClick={openBuilder}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" /> Construire les equipes
        </button>
      </div>

      <div className="flex gap-2">
        {['serveur', 'caissier'].map((poste) => (
          <button
            key={poste}
            onClick={() => setPosteFiltre(poste)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              posteFiltre === poste
                ? 'bg-primary text-white'
                : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)]'
            }`}
          >
            {poste === 'serveur' ? 'Serveurs' : 'Caissiers'}
          </button>
        ))}
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-sm overflow-x-auto">
        <table className="text-left" style={{ minWidth: '760px', width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-[var(--card-border)]">
              <th className="px-4 py-3 text-xs font-medium text-[var(--text-muted)]" style={{ width: '110px' }}>Equipe</th>
              {JOURS.map(([key, label]) => (
                <th key={key} className="px-1 py-3 text-xs font-medium text-[var(--text-muted)] text-center">{label}</th>
              ))}
              <th style={{ width: '70px' }}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {loading ? (
              <tr><td colSpan="9" className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Chargement...</td></tr>
            ) : equipesGroupees.length > 0 ? equipesGroupees.map((eq) => (
              <tr key={eq.nom_equipe} className="hover:bg-[var(--background)] transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">{eq.nom_equipe}</td>
                {JOURS.map(([jourKey]) => {
                  const horaireJour = eq.parJour[jourKey];
                  return (
                    <td key={jourKey} className="px-1 py-2 text-center">
                      {horaireJour ? (
                        <span className="inline-block text-[11px] font-medium bg-primary/10 text-primary rounded-md px-1.5 py-1 w-full">
                          {horaireJour.heure_debut?.substring(0, 5)}-{horaireJour.heure_fin?.substring(0, 5)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-right space-x-1 whitespace-nowrap">
                  <button onClick={() => openEditEquipe(eq)} className="p-1.5 inline-flex rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-primary transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteEquipe(eq)} className="p-1.5 inline-flex rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-rose-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Aucune equipe pour ce poste.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isBuilderOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsBuilderOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-3xl bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  Construire les equipes -- {posteFiltre === 'serveur' ? 'Serveurs' : 'Caissiers'}
                </h3>
                <button onClick={() => setIsBuilderOpen(false)} className="p-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Ajoutez autant d equipes que necessaire et enregistrez-les toutes en un seul clic.
              </p>

              {erreur && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {erreur}
                </div>
              )}

              <form onSubmit={handleSubmitBuilder} className="space-y-5">
                {equipesDraft.map((eq, idx) => (
                  <div key={eq._id} className="border border-[var(--card-border)] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-muted)]">Equipe #{idx + 1}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => dupliquerLigneEquipe(eq._id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-primary" title="Dupliquer">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {equipesDraft.length > 1 && (
                          <button type="button" onClick={() => supprimerLigneEquipe(eq._id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500" title="Retirer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text" required placeholder="Nom (ex: Matin)"
                        value={eq.nom_equipe}
                        onChange={(e) => majLigneEquipe(eq._id, 'nom_equipe', e.target.value)}
                        className="col-span-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                      />
                      <input
                        type="time" required value={eq.heure_debut}
                        onChange={(e) => majLigneEquipe(eq._id, 'heure_debut', e.target.value)}
                        className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                      />
                      <input
                        type="time" required value={eq.heure_fin}
                        onChange={(e) => majLigneEquipe(eq._id, 'heure_fin', e.target.value)}
                        className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs text-[var(--text-muted)] whitespace-nowrap">Tolerance (min)</label>
                      <input
                        type="number" min="0" value={eq.tolerance_retard_minutes}
                        onChange={(e) => majLigneEquipe(eq._id, 'tolerance_retard_minutes', parseInt(e.target.value) || 0)}
                        className="w-20 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-1.5 text-sm text-[var(--foreground)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => toggleTouteLaSemaineLigne(eq._id)}
                        className="ml-auto text-xs font-medium text-primary hover:underline"
                      >
                        {eq.jours.length === JOURS.length ? 'Tout decocher' : 'Toute la semaine'}
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {JOURS.map(([key, label]) => {
                        const isChecked = eq.jours.includes(key);
                        return (
                          <label
                            key={key}
                            className={`flex items-center justify-center text-xs font-medium rounded-lg py-1.5 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-primary/10 text-primary border border-primary/30'
                                : 'bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)]'
                            }`}
                          >
                            <input type="checkbox" checked={isChecked} onChange={() => toggleJourLigne(eq._id, key)} className="hidden" />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={ajouterLigneEquipe}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[var(--card-border)] rounded-xl text-sm font-medium text-[var(--text-muted)] hover:border-primary/40 hover:text-primary transition-all"
                >
                  <Plus className="w-4 h-4" /> Ajouter une autre equipe
                </button>

                <button
                  type="submit"
                  disabled={envoi}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-md shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                  {envoi ? 'Enregistrement...' : `Enregistrer les ${equipesDraft.length} equipe${equipesDraft.length > 1 ? 's' : ''}`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingEquipe && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingEquipe(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Modifier l equipe</h3>
                <button onClick={() => setEditingEquipe(null)} className="p-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <input
                  type="text" required value={editingEquipe.nom_equipe}
                  onChange={(e) => setEditingEquipe({ ...editingEquipe, nom_equipe: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="time" required value={editingEquipe.heure_debut}
                    onChange={(e) => setEditingEquipe({ ...editingEquipe, heure_debut: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] outline-none"
                  />
                  <input
                    type="time" required value={editingEquipe.heure_fin}
                    onChange={(e) => setEditingEquipe({ ...editingEquipe, heure_fin: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] outline-none"
                  />
                </div>
                <input
                  type="number" min="0" required value={editingEquipe.tolerance_retard_minutes}
                  onChange={(e) => setEditingEquipe({ ...editingEquipe, tolerance_retard_minutes: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] outline-none"
                />
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">Jours actifs</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {JOURS.map(([key, label]) => {
                      const isChecked = editingEquipe.jours.includes(key);
                      return (
                        <label
                          key={key}
                          className={`flex items-center justify-center text-xs font-medium rounded-lg py-1.5 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-muted)]'
                          }`}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => toggleJourEdit(key)} className="hidden" />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-md shadow-primary/20 hover:bg-primary-hover transition-all">
                  Enregistrer les modifications
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
