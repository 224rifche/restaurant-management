'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Trash2, 
  CheckCheck, 
  AlertCircle, 
  Clock, 
  UserPlus, 
  DollarSign,
  ChevronRight,
  Filter
} from 'lucide-react';

// Les notifications sont chargées depuis l'API

import { notificationService } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [search, activeTab]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.search(search);
      let final = Array.isArray(data) ? data : (data?.results || []);
      
      if (activeTab === 'unread') final = final.filter(n => !n.is_read);
      if (activeTab === 'alerts') final = final.filter(n => n.type === 'alert');

      setNotifications(final);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            Centre de <span className="text-primary">Messages</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">
            Restez informé des activités du restaurant
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary transition-all"
          >
            <CheckCheck className="w-4 h-4" /> Tout lire
          </button>
          <button className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500 transition-all hover:text-black">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-1 w-fit">
            {['all', 'unread', 'alerts'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-primary text-black' : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {tab === 'all' ? 'Tous' : tab === 'unread' ? 'Non lus' : 'Alertes'}
              </button>
            ))}
         </div>

         <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary/50 transition-all w-full sm:w-64"
            />
         </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence mode='popLayout'>
          {notifications.map((notif, i) => {
            const Icon = notif.type === 'alert' ? AlertCircle : notif.type === 'expense' ? DollarSign : Bell;
            const colorClass = notif.type === 'alert' ? 'text-rose-500' : notif.type === 'expense' ? 'text-amber-400' : 'text-primary';
            
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                className={`glass-card p-6 border group relative cursor-pointer transition-all duration-300 ${
                  !notif.is_read 
                  ? 'bg-primary/[0.03] border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]' 
                  : 'bg-[var(--card-bg)] border-[var(--card-border)] opacity-80'
                }`}
              >
                <div className="flex gap-6">
                   <div className={`shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                   </div>
                   
                   <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-tight flex items-center gap-2">
                            {notif.type === 'alert' ? 'ALERTE SYSTÈME' : notif.type === 'expense' ? 'FINANCE' : 'NOTIFICATION'}
                            {!notif.is_read && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>}
                         </h3>
                         <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                           {new Date(notif.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[var(--text-muted)] font-medium max-w-2xl">
                         {notif.message}
                      </p>
                   </div>

                   <div className="hidden sm:flex items-center">
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-primary transition-all" />
                   </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8 text-[var(--text-muted)] opacity-20" />
             </div>
             <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">Aucune notification pour le moment</p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
         <button className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] hover:text-white transition-all py-8">
            Charger les notifications anciennes
         </button>
      </div>
    </div>
  );
}
