'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique vers le login au chargement
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Chargement...</p>
      </div>
    </div>
  );
}
