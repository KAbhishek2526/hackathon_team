'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface UserProfile {
    name: string;
    email: string;
    college_domain: string;
    skill_tier: number;
    reliability_score: number;
    weekly_hours_completed: number;
    wallet_balance: number;
    badges: string[];
    skill_tags: string[];
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className={`bg-slate-900 border ${color} rounded-xl p-5`}>
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    );
}

export default function DashboardPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getMe()
            .then((data) => setUser(data as UserProfile))
            .catch(() => { setError('Session expired. Please login.'); window.location.href = '/login'; });
    }, []);

    if (error) return <p className="text-red-400">{error}</p>;
    if (!user) return <p className="text-slate-400">Loading…</p>;

    const tierLabels: Record<number, string> = { 1: 'Starter', 2: 'Skilled', 3: 'Expert' };
    const tierColors: Record<number, string> = { 1: 'border-slate-700', 2: 'border-indigo-700', 3: 'border-amber-600' };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Welcome back, {user.name}</h1>
                <p className="text-slate-400 mt-1">{user.email} · {user.college_domain}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Wallet Balance" value={`₹${user.wallet_balance}`} color="border-green-800" />
                <StatCard label="Skill Tier" value={`Tier ${user.skill_tier} — ${tierLabels[user.skill_tier] || 'Expert'}`} color={tierColors[user.skill_tier] || 'border-amber-600'} />
                <StatCard label="Reliability Score" value={user.reliability_score} color="border-blue-800" />
                <StatCard label="Weekly Hours" value={`${user.weekly_hours_completed} / 6`} color="border-purple-800" />
            </div>

            {user.badges.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-3">Your Badges</h2>
                    <div className="flex flex-wrap gap-2">
                        {user.badges.map((badge) => (
                            <span key={badge} className="px-3 py-1.5 bg-indigo-900/50 border border-indigo-700 text-indigo-300 rounded-full text-sm font-medium">
                                🏅 {badge}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {user.skill_tags.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-3">Your Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {user.skill_tags.map((tag) => (
                            <span key={tag} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { href: '/tasks/post', label: 'Post a Task', desc: 'AI classifies and prices it automatically', color: 'indigo' },
                    { href: '/tasks/available', label: 'Browse Open Tasks', desc: 'View tasks not yet assigned', color: 'sky' },
                    { href: '/tasks/my', label: 'My Tasks', desc: 'Manage posted and assigned tasks', color: 'violet' },
                    { href: '/profile', label: 'Profile', desc: 'View full profile and stats', color: 'teal' },
                    { href: '/wallet', label: 'Wallet', desc: 'View balance and transactions', color: 'emerald' },
                ].map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className="bg-slate-900 border border-slate-800 hover:border-indigo-700 rounded-xl p-5 block transition-colors group"
                    >
                        <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{link.label}</p>
                        <p className="text-slate-500 text-sm mt-1">{link.desc}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}
