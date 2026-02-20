'use client';
import { useState } from 'react';
import { api, saveToken } from '@/lib/api';

type Role = 'student' | 'global_client';

export default function RegisterPage() {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', skill_tags: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedRole) return;
        setError('');
        setLoading(true);
        try {
            const body: Record<string, unknown> = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: selectedRole,
            };
            if (selectedRole === 'student') {
                body.skill_tags = form.skill_tags.split(',').map((s) => s.trim()).filter(Boolean);
            }
            const res = await api.register(body) as { token: string; user: { role: string } };
            saveToken(res.token, res.user);
            window.location.href = res.user.role === 'global_client' ? '/pro-dashboard' : '/dashboard';
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    // Step 1: role selection
    if (!selectedRole) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="w-full max-w-lg">
                    <h1 className="text-3xl font-bold text-white text-center mb-2">Join MicroTask</h1>
                    <p className="text-slate-400 text-center mb-10">Who are you?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Student Card */}
                        <button
                            id="role-student"
                            onClick={() => setSelectedRole('student')}
                            className="group bg-slate-900 border-2 border-slate-700 hover:border-indigo-500 rounded-2xl p-7 text-left transition-all"
                        >
                            <div className="text-4xl mb-4">🎓</div>
                            <h2 className="text-white font-bold text-lg mb-2 group-hover:text-indigo-300">Student</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">You have a college email. You can post tasks, accept tasks, earn money, and participate in the full micro-economy.</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {['Post Tasks', 'Accept Tasks', 'Earn', 'Escrow Protected'].map((tag) => (
                                    <span key={tag} className="text-xs px-2.5 py-1 bg-indigo-900/40 border border-indigo-800 text-indigo-300 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </button>

                        {/* Professional Card */}
                        <button
                            id="role-professional"
                            onClick={() => setSelectedRole('global_client')}
                            className="group bg-slate-900 border-2 border-slate-700 hover:border-purple-500 rounded-2xl p-7 text-left transition-all"
                        >
                            <div className="text-4xl mb-4">💼</div>
                            <h2 className="text-white font-bold text-lg mb-2 group-hover:text-purple-300">Professional</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">You are a business or professional. You can post tasks for students to complete. Any email works.</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {['Post Tasks', 'Hire Students', 'Chat', 'Escrow Protected'].map((tag) => (
                                    <span key={tag} className="text-xs px-2.5 py-1 bg-purple-900/40 border border-purple-800 text-purple-300 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </button>
                    </div>
                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Login</a>
                    </p>
                </div>
            </div>
        );
    }

    const isStudent = selectedRole === 'student';
    const accent = isStudent ? 'indigo' : 'purple';

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8">
                <button onClick={() => setSelectedRole(null)} className="text-slate-500 text-sm hover:text-white mb-4 block">← Back</button>

                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">{isStudent ? '🎓' : '💼'}</span>
                    <div>
                        <h1 className="text-xl font-bold text-white">{isStudent ? 'Student Account' : 'Professional Account'}</h1>
                        <p className="text-slate-400 text-xs">{isStudent ? 'College email required' : 'Any email accepted'}</p>
                    </div>
                </div>

                {error && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                        <input id="name" type="text" required value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="Your name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {isStudent ? 'College Email' : 'Email'}
                        </label>
                        <input id="email" type="email" required value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder={isStudent ? 'you@college.edu' : 'you@company.com'} />
                        {isStudent && <p className="text-xs text-slate-500 mt-1">Use a .edu, .ac.in, .ac.uk or similar college email</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input id="password" type="password" required value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="••••••••" />
                    </div>
                    {isStudent && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Skill Tags</label>
                            <input id="skill_tags" type="text" value={form.skill_tags}
                                onChange={(e) => setForm({ ...form, skill_tags: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                placeholder="design, coding, writing (comma separated)" />
                        </div>
                    )}
                    {!isStudent && (
                        <div className="p-3 bg-purple-900/20 border border-purple-800 rounded-lg text-purple-300 text-xs">
                            💡 Professional accounts need a minimum wallet balance of ₹2,000 before posting tasks. You can deposit after registration.
                        </div>
                    )}
                    <button id="register-btn" type="submit" disabled={loading}
                        className={`w-full ${accent === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'} disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors`}>
                        {loading ? 'Creating account…' : `Create ${isStudent ? 'Student' : 'Professional'} Account`}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-500">
                    Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Login</a>
                </p>
            </div>
        </div>
    );
}
