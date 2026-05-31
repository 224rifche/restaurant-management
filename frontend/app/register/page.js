'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, User, ChevronRight, Loader2 } from 'lucide-react';
import { authService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      await authService.register({
        nom,
        telephone,
        password,
        password2: passwordConfirm,
        role: 'serveur' // Rôle par défaut
      });
      // Connexion automatique après inscription
      await authService.login(telephone, password);
      router.push('/dashboard');
    } catch (err) {
      setError("Erreur lors de l'inscription. Ce numéro existe peut-être déjà.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden py-10">
      {/* Background immersif */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
      </div>

      {/* Carte d'inscription */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card relative z-10 w-full max-w-[340px] p-6 flex flex-col items-center"
      >
        {/* Logo réduit */}
        <div className="relative w-16 h-16 mb-4 rounded-full border-2 border-primary/20 p-1 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <Image 
              src="/LOGO.png" 
              alt="SLM Logo" 
              fill 
              sizes="64px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Titre */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-black text-white tracking-widest uppercase">
            S'INSCRIRE
          </h1>
          <div className="h-0.5 w-6 bg-primary/40 mx-auto mt-1"></div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleRegister} className="w-full space-y-4">
          
          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-focus-within:border-primary/50 transition-all shrink-0">
              <User className="w-4 h-4 text-slate-500 group-focus-within:text-primary" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                className="w-full bg-transparent border-b border-white/10 py-1.5 text-white outline-none focus:border-primary transition-all placeholder:text-slate-700 text-sm"
                placeholder="Nom complet"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-focus-within:border-primary/50 transition-all shrink-0">
              <Phone className="w-4 h-4 text-slate-500 group-focus-within:text-primary" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                className="w-full bg-transparent border-b border-white/10 py-1.5 text-white outline-none focus:border-primary transition-all placeholder:text-slate-700 text-sm"
                placeholder="Téléphone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-focus-within:border-primary/50 transition-all shrink-0">
              <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-primary" />
            </div>
            <div className="flex-1">
              <input
                type="password"
                className="w-full bg-transparent border-b border-white/10 py-1.5 text-white outline-none focus:border-primary transition-all placeholder:text-slate-700 text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-focus-within:border-primary/50 transition-all shrink-0">
              <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-primary" />
            </div>
            <div className="flex-1">
              <input
                type="password"
                className="w-full bg-transparent border-b border-white/10 py-1.5 text-white outline-none focus:border-primary transition-all placeholder:text-slate-700 text-sm"
                placeholder="Confirmer le mot de passe"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-[10px] text-center font-bold bg-red-400/5 py-1.5 rounded-lg border border-red-400/10"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
              <>
                S&apos;inscrire <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-xs text-slate-400 hover:text-primary transition-colors">
            Déjà un compte ? Se connecter
          </Link>
        </div>

        <p className="mt-6 text-[8px] text-slate-600 font-bold tracking-[0.4em] uppercase">
          &copy; SLM 2026
        </p>
      </motion.div>
    </div>
  );
}
