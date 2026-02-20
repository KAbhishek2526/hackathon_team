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
    created_at: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getMe()
            .then((data) => setUser(data as UserProfile))
            .catch(() => setError('Failed to load profile.'));
    }, []);

    if (error) return <p className="text-red-400">{error}</p>;
    if (!user) return <p className="text-slate-400">Loading…</p>;

    const tierLabels: Record<number, string> = { 1: 'Starter', 2: 'Skilled', 3: 'Expert' };
    const joinDate = new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                        {user.name[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{user.name}</h2>
                        <p className="text-slate-400">{user.email}</p>
                        <p className="text-slate-500 text-sm">{user.college_domain} · Joined {joinDate}</p>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-5 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Skill Tier</p>
                        <p className="text-white font-semibold">Tier {user.skill_tier} — {tierLabels[user.skill_tier] || 'Expert'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Reliability Score</p>
                        <p className="text-white font-semibold">{user.reliability_score}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Weekly Hours</p>
                        <p className="text-white font-semibold">{user.weekly_hours_completed} / 6</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Wallet Balance</p>
                        <p className="text-indigo-400 font-bold">₹{user.wallet_balance}</p>
                    </div>
                </div>

                {user.skill_tags.length > 0 && (
                    <div className="border-t border-slate-800 pt-5">
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                            {user.skill_tags.map((tag) => (
                                <span key={tag} className="text-sm px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                )}

                {user.badges.length > 0 && (
                    <div className="border-t border-slate-800 pt-5">
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Badges</p>
                        <div className="flex flex-wrap gap-2">
                            {user.badges.map((badge) => (
                                <span key={badge} className="text-sm px-3 py-1.5 bg-indigo-900/50 border border-indigo-700 text-indigo-300 rounded-full font-medium">
                                    🏅 {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
