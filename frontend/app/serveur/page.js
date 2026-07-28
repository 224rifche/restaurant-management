'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { pointageService, planningService } from '@/lib/serveur/api';

export default function ServeurDashboard() {
  const [mesPointages, setMesPointages] = useState([]);
  const [monPlanning, setMonPlanning] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Promise.all : les 2 requêtes partent EN PARALLÈLE,
        // pas l'une après l'autre → dashboard qui charge plus vite
        const [pointages, planning] = await Promise.all([
          pointageService.getMesPointages(),
          planningService.getMonPlanning(),
        ]);
        setMesPointages(pointages);
        setMonPlanning(planning);
      } catch (err) {
        console.error('Erreur chargement dashboard serveur:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // A-t-on déjà pointé aujourd'hui ?
  const todayStr = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD
  const pointageAujourdhui = mesPointages.find((p) => p.date === todayStr);

  // Prochain shift à venir (le premier planning avec une date >= aujourd'hui)
  const prochainShift = monPlanning
    .filter((s) => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{greeting} 👋</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* CARTE STATUT POINTAGE DU JOUR */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              pointageAujourdhui ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              {pointageAujourdhui
                ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                : <Clock className="w-6 h-6 text-amber-500" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {pointageAujourdhui ? 'Pointage effectué' : 'Pas encore pointé aujourd\'hui'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {pointageAujourdhui
                  ? `Arrivée à ${pointageAujourdhui.heure_arrivee?.substring(0, 5) ?? '--:--'}`
                  : 'Rendez-vous sur la page Pointage'}
              </p>
            </div>
          </div>
          <Link href="/serveur/pointage">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-all">
              Pointer <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </motion.div>

      {/* CARTE PROCHAIN SHIFT */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Prochain shift</h3>
        </div>

        {prochainShift ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {new Date(prochainShift.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {prochainShift.heure_debut?.substring(0, 5)} - {prochainShift.heure_fin?.substring(0, 5)} · {prochainShift.fonction_label}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Aucun shift prévu pour le moment.</p>
        )}

        <Link href="/serveur/planning" className="text-xs font-medium text-primary hover:underline mt-4 inline-block">
          Voir tout mon planning →
        </Link>
      </motion.div>
    </div>
  );
}