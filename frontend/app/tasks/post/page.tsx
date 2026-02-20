'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

interface TaskResult {
    task: {
        _id: string;
        title: string;
        category: string;
        complexity_level: string;
        estimated_time_hours: number;
        status: string;
        digital_or_physical: string;
    };
    price: number;
    assigned_to: { name: string } | null;
}

export default function PostTaskPage() {
    const [form, setForm] = useState({ title: '', description: '', digital_or_physical: 'digital' });
    const [result, setResult] = useState<TaskResult | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);
        try {
            const res = await api.postTask(form) as TaskResult;
            setResult(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to post task');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Post a Task</h1>
            <p className="text-slate-400 text-sm mb-6">
                Describe the task. Our AI will classify it and set a fair price automatically.
            </p>

            {error && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

            {result ? (
                <div className="bg-slate-900 border border-green-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-green-400 text-xl">✓</span>
                        <h2 className="text-lg font-semibold text-white">Task Posted Successfully</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Category</p>
                            <p className="text-white font-medium">{result.task.category}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Complexity</p>
                            <p className="text-white font-medium">{result.task.complexity_level}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Estimated Hours</p>
                            <p className="text-white font-medium">{result.task.estimated_time_hours}h</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Price (Auto-set)</p>
                            <p className="text-indigo-400 font-bold text-xl">₹{result.price}</p>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Assigned To</p>
                        <p className="text-white font-medium">
                            {result.assigned_to ? result.assigned_to.name : '⏳ No eligible student found — task is open'}
                        </p>
                    </div>
                    <button
                        onClick={() => { setResult(null); setForm({ title: '', description: '', digital_or_physical: 'digital' }); }}
                        className="text-sm text-indigo-400 hover:underline"
                    >
                        Post another task
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Task Title</label>
                        <input
                            id="title"
                            type="text"
                            required
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. Design a poster for our club event"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            required
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                            placeholder="Describe the task in detail…"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Task Type</label>
                        <select
                            id="digital_or_physical"
                            value={form.digital_or_physical}
                            onChange={(e) => setForm({ ...form, digital_or_physical: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="digital">Digital</option>
                            <option value="physical">Physical</option>
                        </select>
                    </div>
                    <p className="text-xs text-slate-500">
                        ⚠️ Price is set automatically by AI. You cannot modify it.
                    </p>
                    <button
                        id="post-task-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? 'Classifying & Posting…' : 'Post Task'}
                    </button>
                </form>
            )}
        </div>
    );
}
