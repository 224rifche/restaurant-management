'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import SelfieCapture from '@/components/shared/SelfieCapture';
import { pointageService } from '@/lib/serveur/api';

export default function PointagePage() {
  // ============================================================
  // ETATS
  // ============================================================
  // Le mode determine si on affiche le formulaire d'ARRIVEE ou de DEPART.
  // On le determine automatiquement en regardant si un pointage
  // "ouvert" existe deja aujourd'hui (arrivee sans depart enregistre).
  const [mode, setMode] = useState(null); // 'arrivee' | 'depart' | null (chargement)
  const [selfieFile, setSelfieFile] = useState(null);
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState(null); // { type: 'success'|'error', text }

  // ============================================================
  // DETERMINER LE MODE (arrivee ou depart) AU CHARGEMENT
  // ============================================================
  useEffect(() => {
    const determineMode = async () => {
      try {
        const mesPointages = await pointageService.getMesPointages();
        const todayStr = new Date().toISOString().split('T')[0];
        const pointageAujourdhui = mesPointages.find((p) => p.date === todayStr);

        // Si un pointage existe aujourd'hui ET qu'il n'a pas encore d'heure de depart
        // -> on est en mode DEPART. Sinon -> mode ARRIVEE.
        if (pointageAujourdhui && !pointageAujourdhui.heure_depart) {
          setMode('depart');
        } else if (pointageAujourdhui && pointageAujourdhui.heure_depart) {
          // Deja pointe arrivee ET depart aujourd'hui -> journee terminee
          setMode('termine');
        } else {
          setMode('arrivee');
        }
      } catch (err) {
        console.error('Erreur determination mode:', err);
        setMode('arrivee'); // par defaut, on suppose arrivee
      }
    };
    determineMode();
  }, []);

  // ============================================================
  // RECUPERER LA POSITION GPS AU CHARGEMENT
  // ============================================================
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("La geolocalisation n'est pas supportee par ce navigateur.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      (err) => {
        console.error('Erreur GPS:', err);
        setGpsError("Impossible de recuperer votre position. Vous pouvez continuer sans, mais le controle de distance ne pourra pas etre effectue.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ============================================================
  // SOUMISSION DU POINTAGE
  // ============================================================
  const handleSubmit = async () => {
    if (!selfieFile) {
      setResultMessage({ type: 'error', text: 'Veuillez capturer un selfie avant de continuer.' });
      return;
    }

    setSubmitting(true);
    setResultMessage(null);

    try {
      // 1. Recuperer le token QR actuel (genere cote serveur, expire vite)
      const { token: qrToken } = await pointageService.getQrToken();

      // 2. Construire le FormData : OBLIGATOIRE des qu'on envoie un fichier
      // Contrairement a un objet JS classique envoye en JSON, FormData
      // permet de melanger texte ET fichier binaire dans une seule requete.
      const formData = new FormData();
      formData.append('qr_token', qrToken);
      formData.append('selfie', selfieFile);
      if (gpsPosition) {
        formData.append('latitude', gpsPosition.latitude);
        formData.append('longitude', gpsPosition.longitude);
      }

      // 3. Appeler le bon endpoint selon le mode
      if (mode === 'arrivee') {
        await pointageService.checkIn(formData);
        setResultMessage({ type: 'success', text: 'Arrivee enregistree avec succes !' });
        setMode('depart'); // apres l'arrivee, la prochaine action possible est le depart
      } else if (mode === 'depart') {
        await pointageService.checkOut(formData);
        setResultMessage({ type: 'success', text: 'Depart enregistre avec succes ! Bonne fin de journee.' });
        setMode('termine');
      }

      setSelfieFile(null);
    } catch (err) {
      console.error('Erreur pointage:', err);
      // Le backend renvoie souvent {"detail": "message d'erreur clair"}
      const backendMessage = err.response?.data?.detail;
      setResultMessage({
        type: 'error',
        text: backendMessage || "Une erreur est survenue lors du pointage. Reessayez.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDU 
  // ============================================================
  if (mode === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
      </div>
    );
  }

  if (mode === 'termine') {
    return (
      <div className="max-w-lg mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Journee terminee</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Vous avez deja pointe votre arrivee et votre depart aujourd'hui. A demain !
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {mode === 'arrivee' ? 'Pointer mon arrivee' : 'Pointer mon depart'}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {mode === 'arrivee'
            ? 'Prenez un selfie pour confirmer votre presence'
            : 'Prenez un selfie pour confirmer votre depart'}
        </p>
      </div>

      {/* STATUT GPS */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${
        gpsLoading
          ? 'bg-[var(--card-bg)] border-[var(--card-border)]'
          : gpsPosition
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
      }`}>
        <MapPin className={`w-4 h-4 shrink-0 ${
          gpsLoading ? 'text-[var(--text-muted)]' : gpsPosition ? 'text-emerald-600' : 'text-amber-600'
        }`} />
        <p className="text-xs font-medium">
          {gpsLoading
            ? 'Localisation en cours...'
            : gpsPosition
              ? 'Position GPS recuperee'
              : gpsError}
        </p>
      </div>

      {/* CAPTURE SELFIE */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
        <SelfieCapture onCapture={setSelfieFile} />
      </div>

      {/* MESSAGE DE RESULTAT */}
      {resultMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          resultMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}>
          {resultMessage.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          }
          <p className={`text-sm ${resultMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {resultMessage.text}
          </p>
        </div>
      )}

      {/* BOUTON DE CONFIRMATION */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selfieFile || submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {mode === 'arrivee' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
        {submitting ? 'Envoi en cours...' : mode === 'arrivee' ? 'Confirmer mon arrivee' : 'Confirmer mon depart'}
      </button>
    </div>
  );
}
