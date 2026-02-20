'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface Notification {
    _id: string;
    type: string;
    message: string;
    relatedTaskId?: { _id: string; title: string } | null;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    async function loadNotifications() {
        try {
            const data = await api.getNotifications() as Notification[];
            setNotifications(data);
        } catch {
            // silently ignore — user may not be logged in
        }
    }

    useEffect(() => {
        loadNotifications();

        // Subscribe to real-time notifications via Socket.IO
        const socket = getSocket();
        socket.on('new_notification', (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
        });

        return () => {
            socket.off('new_notification');
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleMarkRead(id: string) {
        try {
            await api.markNotificationRead(id);
            setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
        } catch { /* ignore */ }
    }

    async function handleMarkAllRead() {
        try {
            await api.markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch { /* ignore */ }
    }

    const typeIcon: Record<string, string> = {
        task_accepted: '🤝',
        task_completed: '✅',
        task_approved: '💳',
        dispute_raised: '⚠️',
        price_increased: '💰',
        new_message: '💬',
        general: '🔔',
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id="notification-bell"
                onClick={() => setOpen(!open)}
                className="relative p-1.5 text-slate-300 hover:text-white transition-colors"
                aria-label="Notifications"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">No notifications yet</p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleMarkRead(n._id)}
                                    className={`px-4 py-3 border-b border-slate-800/60 cursor-pointer hover:bg-slate-800/50 transition-colors ${!n.isRead ? 'bg-indigo-950/30' : ''}`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span className="text-base shrink-0 mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                                                {n.message}
                                            </p>
                                            {n.relatedTaskId && (
                                                <a
                                                    href={`/tasks/${n.relatedTaskId._id}`}
                                                    className="text-xs text-indigo-400 hover:underline mt-0.5 block"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    → {n.relatedTaskId.title}
                                                </a>
                                            )}
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
