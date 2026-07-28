'use client';

import { LayoutDashboard, Clock, Calendar, User } from 'lucide-react';
import RoleLayout from '@/components/shared/RoleLayout';

// SEUL contenu propre au Serveur : sa liste de liens.
// Rien d'autre a ecrire ici -- toute la mecanique (sidebar, guard,
// spinner) vient de RoleLayout, partagee avec les autres roles.
const MENU_SERVEUR = [
  { name: 'Accueil',    icon: LayoutDashboard, path: '/serveur' },
  { name: 'Pointage',   icon: Clock,            path: '/serveur/pointage' },
  { name: 'Planning',   icon: Calendar,         path: '/serveur/planning' },
  { name: 'Mon Profil', icon: User,             path: '/serveur/profil' },
];

export default function ServeurLayout({ children }) {
  return (
    <RoleLayout role="serveur" title="Espace Serveur" menuItems={MENU_SERVEUR}>
      {children}
    </RoleLayout>
  );
}
