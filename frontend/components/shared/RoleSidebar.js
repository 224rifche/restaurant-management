'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { authService } from '@/lib/auth';
import Image from 'next/image';

/**
 * Coquille visuelle COMMUNE a tous les roles (Serveur, Admin, Caissier...).
 *
 * Ce composant ne connait AUCUNE logique metier -- il ne sait pas
 * ce qu'est un "pointage" ou une "depense". Il sait juste dessiner :
 * un logo, une liste de liens (fournie par le parent), et un bouton
 * deconnexion. Chaque role fournit SA PROPRE liste de liens (menuItems)
 * et SON PROPRE titre (title) -- c'est la SEULE chose qui change.
 *
 * @param {string} title - ex: "Espace Serveur", "Espace Admin"
 * @param {Array} menuItems - [{ name, icon, path }] -- propre a chaque role
 * @param {string} userNom - nom de l'utilisateur connecte
 * @param {string} navHighlightId - identifiant unique pour l'animation
 *   (evite un conflit visuel si jamais 2 sidebars different existaient
 *   en meme temps sur la meme page, ce qui n'arrive pas en pratique
 *   mais reste une bonne precaution)
 */
export default function RoleSidebar({ title, menuItems, userNom, navHighlightId = 'nav-highlight' }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 flex flex-col p-5 sidebar">
      {/* Logo -- identique pour tous les roles */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[var(--card-border)]">
          <Image src="/LOGO.png" alt="Logo" fill sizes="36px" className="object-cover" />
        </div>
        <div>
          <h2 className="text-[var(--sidebar-text)] font-black text-sm tracking-tight uppercase">
            Restaurant <span className="text-primary">SLM</span>
          </h2>
          <p className="text-[var(--sidebar-muted)] text-[10px] font-medium">{title}</p>
        </div>
      </div>

      {/* Navigation -- le CONTENU (menuItems) vient du role, pas d'ici */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} className="relative block">
              {isActive && (
                <motion.div
                  layoutId={navHighlightId}
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.97 }}
                className={[
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl z-10',
                  'transition-colors duration-200 text-sm font-semibold',
                  isActive
                    ? 'text-white'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'
                ].join(' ')}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout -- identique pour tous les roles */}
      <div className="mt-auto pt-4 border-t border-[var(--card-border)] space-y-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--sidebar-hover-bg)]">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-black text-xs uppercase">{userNom.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[var(--sidebar-text)] text-xs font-bold truncate">{userNom}</p>
            <p className="text-primary text-[10px] font-bold uppercase tracking-wider">{title.replace('Espace ', '')}</p>
          </div>
        </div>

        <button
          onClick={() => authService.logout()}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[var(--sidebar-text)] hover:text-rose-500 hover:bg-rose-50 transition-all text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Deconnexion
        </button>
      </div>
    </aside>
  );
}
