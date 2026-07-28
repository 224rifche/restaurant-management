'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CommandPalette from '@/components/CommandPalette';

export default function DashboardLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('access_token');
    const role  = Cookies.get('user_role');
    const rolesValides = ['admin', 'caissier', 'serveur', 'cuisine'];
    if (!token || !role || !rolesValides.includes(role)) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <CommandPalette />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
