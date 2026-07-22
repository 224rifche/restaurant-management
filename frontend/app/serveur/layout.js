'use client';

import { useRoleGuard } from '@/hooks/useRoleGuard';
import ServeurSidebar from '@/components/serveur/ServeurSidebar';
import TopBar from '@/components/TopBar';

export default function ServeurLayout({ children }) {
  // useRoleGuard s'occupe de TOUT :
  // - pas connecté → redirige vers /login
  // - connecté mais mauvais rôle (ex: un caissier qui tape /serveur dans l'URL)
  //   → redirige automatiquement vers /caissier
  // - connecté avec le bon rôle → laisse passer
  const { role, nom, ready } = useRoleGuard('serveur');

  // TRÈS IMPORTANT : tant que ready === false, on n'affiche RIEN.
  // Sans ce garde-fou, il y aurait une fraction de seconde où le contenu
  // de la page (avec les données d'un employé) pourrait s'afficher
  // AVANT que la vérification de rôle soit terminée → fuite visuelle.
  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <ServeurSidebar userNom={nom} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}