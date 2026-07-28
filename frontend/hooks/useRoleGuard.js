'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

/**
 * Hook de protection de route PAR RÔLE STRICT.
 *
 * Différence avec l'ancien système (dashboard/layout.js) :
 * L'ancien guard vérifiait juste "es-tu connecté avec un rôle VALIDE ?"
 * Celui-ci vérifie "es-tu connecté avec LE BON rôle pour CETTE interface ?"
 *
 * @param {string|string[]} allowedRoles - le ou les rôles autorisés sur cette route
 * @returns {{ role: string, nom: string, ready: boolean }}
 *          ready = false tant qu'on n'a pas fini de vérifier (évite le flash de contenu)
 */
export function useRoleGuard(allowedRoles) {
  const router = useRouter();
  const [state, setState] = useState({ role: '', nom: '', ready: false });

  // On accepte soit une string ('admin') soit un tableau (['admin', 'caissier'])
  // .flat() pour normaliser les deux cas en tableau
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  useEffect(() => {
    const token = Cookies.get('access_token');
    const role = Cookies.get('user_role');
    const nom = Cookies.get('user_nom') || '';

    // Cas 1 : pas connecté du tout → login
    if (!token || !role) {
      router.replace('/login');
      return;
    }

    // Cas 2 : connecté mais MAUVAIS rôle pour cette interface
    // Ex: un serveur qui tape /admin/employees directement dans l'URL
    if (!roles.includes(role)) {
      // On le redirige vers SA PROPRE interface, pas vers /login
      // (il est bien authentifié, juste au mauvais endroit)
      router.replace(`/${role}`);
      return;
    }

    // Cas 3 : tout est bon
    setState({ role, nom, ready: true });
  }, [router]);

  return state;
}