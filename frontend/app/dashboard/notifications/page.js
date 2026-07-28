'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Trash2, CheckCheck, AlertCircle, Clock, DollarSign, ChevronRight } from 'lucide-react';
import { notificationService } from '@/lib/api';
import Cookies from 'js-cookie';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('all');
  const [search, setSearch]               = useState('');
  const [userRole, setUserRole]           = useState('');

  useEffect(() => {
    setUserRole(Cookies.get('user_role') || '');
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [search, activeTab, userRole]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.search(search);
      let final = Array.isArray(data) ? data : (data?.results || []);

      // Caissier : voir toutes ses notifs mais pas les alertes RH
      if (userRole === 'caissier') {
        final = final.filter(n => n.type !== 'rh');
      }

      if (activeTab === 'unread') final = final.filter(n => !n.is_read);
      if (activeTab === 'alerts') final = final.filter(n => n.type === 'alert');

      setNotifications(final);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try { await notificationService.markAllRead(); fetchNotifications(); }
    catch (err) { console.error(err); }
  };

  const handleMarkAsRead = async (id) => {
    try { await notificationService.markAsRead(id); fetchNotifications(); }
    catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="dashboard-content max-w-3xl mx-auto space-y-8 pb-16">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Notifications</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-primary hover:border-primary/40 transition-all">
            <CheckCheck className="w-4 h-4" /> Tout marquer lu
          </button>
        </div>
      </div>

      {/* TABS + RECHERCHE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-1 w-fit">
          {['all', 'unread', 'alerts'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab ? 'bg-primary text-white' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}>
              {tab === 'all' ? 'Tous' : tab === 'unread' ? 'Non lus' : 'Alertes'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-all w-56 text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* LISTE */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif, i) => {
            const Icon = notif.type === 'alert' ? AlertCircle : notif.type === 'expense' ? DollarSign : Bell;
            const colorClass = notif.type === 'alert' ? 'text-rose-500 bg-rose-50 border-rose-100'
              : notif.type === 'expense' ? 'text-amber-500 bg-amber-50 border-amber-100'
              : 'text-primary bg-emerald-50 border-emerald-100';

            return (
              <motion.div key={notif.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                className={`flex gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                  !notif.is_read
                    ? 'bg-primary/[0.03] border-primary/20 hover:border-primary/40'
                    : 'bg-[var(--card-bg)] border-[var(--card-border)] opacity-75 hover:opacity-100'
                }`}>
                <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                      {notif.type === 'alert' ? 'Alerte système' : notif.type === 'expense' ? 'Finance' : 'Notification'}
                      {!notif.is_read && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                    </p>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                      {new Date(notif.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.length === 0 && !loading && (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-[var(--text-muted)] opacity-40" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">Aucune notification pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
