'use client';

import { useRoleGuard } from '@/hooks/useRoleGuard';
import RoleSidebar from './RoleSidebar';
import TopBar from '@/components/TopBar';

/**
 * Layout COMMUN a tous les roles.
 *
 * Gere la verification de role (useRoleGuard) + l'affichage de la
 * sidebar + le spinner de chargement -- exactement le meme mecanisme
 * pour Serveur, Admin, ou un futur Caissier. Seul le CONTENU
 * (menuItems, title, role) change, fourni par le layout specifique
 * de chaque role (ex: app/serveur/layout.js).
 *
 * @param {string} role - 'serveur' | 'admin' | 'caissier' -- utilise par useRoleGuard
 * @param {string} title - ex: "Espace Serveur"
 * @param {Array} menuItems - liste des liens du menu, propre au role
 * @param {ReactNode} children - le contenu de la page
 */
export default function RoleLayout({ role, title, menuItems, children }) {
  const { nom, ready } = useRoleGuard(role);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <RoleSidebar title={title} menuItems={menuItems} userNom={nom} navHighlightId={`nav-highlight-${role}`} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
