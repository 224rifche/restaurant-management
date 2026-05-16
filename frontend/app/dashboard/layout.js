import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import CommandPalette from '@/components/CommandPalette';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Command Palette Global */}
      <CommandPalette />

      {/* Barre Latérale Fixe */}
      <Sidebar />
      
      {/* Zone de Contenu Principale */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
