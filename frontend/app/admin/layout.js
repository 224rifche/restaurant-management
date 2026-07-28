'use client';

import { LayoutDashboard, Clock, Calendar, Users, FileText } from 'lucide-react';
import RoleLayout from '@/components/shared/RoleLayout';

// SEUL contenu propre a l'Admin : sa liste de liens.
const MENU_ADMIN = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Horaires',  icon: Clock,            path: '/admin/horaires' },
  { name: 'Planning',  icon: Calendar,         path: '/admin/planning' },
  { name: 'Employes',  icon: Users,            path: '/dashboard/employees' },
  { name: 'Depenses',  icon: FileText,         path: '/dashboard/expenses' },
];

export default function AdminLayout({ children }) {
  return (
    <RoleLayout role="admin" title="Espace Admin" menuItems={MENU_ADMIN}>
      {children}
    </RoleLayout>
  );
}
