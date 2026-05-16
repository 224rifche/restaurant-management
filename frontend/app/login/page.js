'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { authService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login(telephone, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Identifiants incorrects.');
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {/* Background immersif */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
      </div>

      {/* Carte de connexion ultra-compacte */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card relative z-10 w-full max-w-[340px] p-6 flex flex-col items-center"
      >
        {/* Logo réduit */}
        <div className="relative w-20 h-20 mb-4 rounded-full border-2 border-primary/20 p-1 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <Image 
              src="/LOGO.png" 
              alt="SLM Logo" 
              fill 
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Titre serré */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-black text-white tracking-widest uppercase">
            RESTAURANT <span className="text-primary">SLM</span>
          </h1>
          <div className="h-0.5 w-6 bg-primary/40 mx-auto mt-1"></div>
        </div>

        {/* Formulaire optimisé verticalement */}
        <form onSubmit={handleLogin} className="w-full space-y-5">
          
          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-focus-within:border-primary/50 transition-all shrink-0">
              <Phone className="w-4 h-4 text-slate-500 group-focus-within:text-primary" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                className="w-full bg-transparent border-b border-white/10 py-1.5 text-white outline-none focus:border-primary transition-all placeholder:text-slate-700 text-base"
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
                className="w-full bg-transparent border-b border-white/10 py-1.5 text-white outline-none focus:border-primary transition-all placeholder:text-slate-700 text-base"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
              <>
                Se connecter <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-[8px] text-slate-600 font-bold tracking-[0.4em] uppercase">
          &copy; SLM 2026
        </p>
      </motion.div>
    </div>
  );
}
