'use client';
import { useState } from 'react';
import { api, saveToken } from '@/lib/api';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', skill_tags: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const tags = form.skill_tags.split(',').map((s) => s.trim()).filter(Boolean);
            const res = await api.register({ ...form, skill_tags: tags }) as { token: string; user: object };
            saveToken(res.token, res.user);
            window.location.href = '/dashboard';
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8">
                <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                <p className="text-slate-400 text-sm mb-6">Use your college email — any <span className="text-indigo-300">.edu</span>, <span className="text-indigo-300">.ac.in</span>, <span className="text-indigo-300">.ac.uk</span> or similar domain.</p>

                {error && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">College Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="you@college.edu"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Skill Tags</label>
                        <input
                            id="skill_tags"
                            type="text"
                            value={form.skill_tags}
                            onChange={(e) => setForm({ ...form, skill_tags: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="design, coding, writing (comma separated)"
                        />
                    </div>
                    <button
                        id="register-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? 'Creating account…' : 'Register'}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-500">
                    Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Login</a>
                </p>
            </div>
        </div>
    );
}
