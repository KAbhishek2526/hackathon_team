'use client';
import { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';
import NotificationBell from './NotificationBell';

type Role = 'student' | 'global_client' | null;

function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <a href={href} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            {label}
        </a>
    );
}

export default function ClientNav() {
    const [role, setRole] = useState<Role>(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setRole(user?.role || 'student');
    }, []);

    const isGlobalClient = role === 'global_client';

    return (
        <nav className="border-b border-slate-800 bg-slate-900">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href={isGlobalClient ? '/pro-dashboard' : '/dashboard'} className="font-bold text-lg tracking-tight">
                    <span className={isGlobalClient ? 'text-purple-400' : 'text-indigo-400'}>MicroTask</span>
                    {isGlobalClient && <span className="ml-2 text-xs font-medium text-purple-500 bg-purple-900/30 border border-purple-800 px-2 py-0.5 rounded-full">Pro</span>}
                </a>

                <div className="flex gap-5 items-center">
                    {isGlobalClient ? (
                        /* Global client nav */
                        <>
                            <NavLink href="/pro-dashboard" label="Dashboard" />
                            <NavLink href="/tasks/post" label="Post Task" />
                            <NavLink href="/tasks/my" label="My Tasks" />
                            <NavLink href="/wallet" label="Wallet" />
                        </>
                    ) : (
                        /* Student nav */
                        <>
                            <NavLink href="/dashboard" label="Dashboard" />
                            <NavLink href="/tasks/post" label="Post Task" />
                            <NavLink href="/tasks/available" label="Available Tasks" />
                            <NavLink href="/tasks/my" label="My Tasks" />
                            <NavLink href="/profile" label="Profile" />
                            <NavLink href="/wallet" label="Wallet" />
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <NotificationBell />
                    <LogoutButton />
                </div>
            </div>
        </nav>
    );
}
