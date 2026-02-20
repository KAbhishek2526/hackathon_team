'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface UserProfile {
    name: string;
    email: string;
    role: string;
    wallet_balance: number;
    badges: string[];
}

interface Task {
    _id: string;
    title: string;
    status: string;
    finalPrice: number;
    price: number;
    category: string;
    assigned_to: { name: string } | null;
}

const statusColor: Record<string, string> = {
    open: 'text-yellow-400',
    assigned: 'text-blue-400',
    in_progress: 'text-cyan-400',
    awaiting_approval: 'text-amber-400',
    completed: 'text-green-400',
    disputed: 'text-red-400',
};

export default function ProDashboardPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [postedTasks, setPostedTasks] = useState<Task[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getMe()
            .then((data) => {
                const u = data as UserProfile;
                if (u.role !== 'global_client') {
                    // Student accidentally on this page → send to normal dashboard
                    window.location.href = '/dashboard';
                    return;
                }
                setUser(u);
            })
            .catch(() => { setError('Session expired.'); window.location.href = '/login'; });

        api.getMyTasks()
            .then((data) => {
                const d = data as { posted: Task[] };
                setPostedTasks(d.posted || []);
            })
            .catch(() => { });
    }, []);

    if (error) return <p className="text-red-400">{error}</p>;
    if (!user) return <p className="text-slate-400">Loading…</p>;

    const MIN_DEPOSIT = 2000;
    const canPost = user.wallet_balance >= MIN_DEPOSIT;

    return (
        <div>
            {/* Header Banner */}
            <div className="mb-8 bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-800/40 rounded-2xl p-6 flex items-center gap-4">
                <div className="text-4xl">💼</div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Professional Dashboard</h1>
                    <p className="text-purple-300 text-sm mt-0.5">Welcome back, {user.name} — you are in <span className="font-semibold">Professional Mode</span> on FreeHour</p>
                    <p className="text-slate-400 text-xs mt-1">You can post tasks for students to complete.</p>
                </div>
            </div>

            {/* Wallet + Deposit Notice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <p className="text-slate-400 text-sm">Wallet Balance</p>
                    <p className="text-2xl font-bold text-white mt-1">₹{user.wallet_balance}</p>
                    {canPost ? (
                        <p className="text-green-400 text-xs mt-1">✓ Ready to post tasks</p>
                    ) : (
                        <div className="mt-2">
                            <p className="text-amber-400 text-xs">⚠ Minimum ₹{MIN_DEPOSIT} required to post tasks</p>
                            <a href="/wallet" className="mt-1 text-xs text-purple-400 hover:underline block">→ Deposit funds</a>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <p className="text-slate-400 text-sm">Posted Tasks</p>
                    <p className="text-2xl font-bold text-white mt-1">{postedTasks.length}</p>
                    <p className="text-slate-500 text-xs mt-1">{postedTasks.filter((t) => t.status === 'open').length} open · {postedTasks.filter((t) => t.status === 'completed').length} completed</p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-300 mb-3">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <a href="/tasks/post" className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${canPost ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none'}`}>
                        ＋ Post a Task {!canPost && '(deposit required)'}
                    </a>
                    <a href="/tasks/my" className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors">
                        📋 My Posted Tasks
                    </a>
                    <a href="/wallet" className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors">
                        💰 Wallet
                    </a>
                </div>
            </div>

            {/* Recent Tasks */}
            {postedTasks.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-300 mb-3">Recent Tasks</h2>
                    <div className="space-y-3">
                        {postedTasks.slice(0, 5).map((task) => (
                            <div key={task._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-white font-medium">{task.title}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        {task.category} · Worker: {task.assigned_to?.name || 'Not assigned'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-indigo-400 font-semibold">₹{task.finalPrice || task.price}</p>
                                    <p className={`text-xs ${statusColor[task.status] || 'text-slate-400'}`}>{task.status.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Restriction Notice */}
            <div className="mt-8 p-4 border border-slate-800 rounded-xl bg-slate-900/50 text-slate-500 text-sm">
                <p className="font-medium text-slate-400 mb-1">Professional Account Limits</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Cannot accept or work on tasks</li>
                    <li>Cannot earn from the platform</li>
                    <li>Must maintain ₹{MIN_DEPOSIT} minimum wallet balance to post</li>
                    <li>All student workers on the platform are college-verified</li>
                </ul>
            </div>
        </div>
    );
}
