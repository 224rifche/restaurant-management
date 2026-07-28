'use client';

export default function AdminDashboard() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard Admin</h1>
      <p className="text-sm text-[var(--text-muted)] mt-2">
        Ce dashboard sera enrichi progressivement. Pour l'instant, utilisez le menu
        "Horaires" et "Planning" pour gerer le planning hebdomadaire.
      </p>
    </div>
  );
}
