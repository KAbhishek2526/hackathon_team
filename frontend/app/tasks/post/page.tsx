'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// Category/subcategory structure (mirrors backend categories.js)
const CATEGORIES: Record<string, string[]> = {
    Design: ['Poster', 'Meme', 'Reel', 'Logo', 'Banner'],
    Coding: ['Debugging', 'Frontend', 'Backend', 'Assignment', 'DSA'],
    Writing: ['Notes', 'Assignment', 'Resume', 'Report'],
    Editing: ['Video', 'Photo', 'Audio'],
    Delivery: ['Campus', 'Nearby', 'Errand'],
    Marketing: ['SocialMedia', 'Campaign', 'Analytics'],
    Tutoring: ['Math', 'Programming', 'Physics', 'ExamPrep'],
};

interface PriceSuggestion {
    aiSuggestedPrice: number;
    deterministicPrice: number;
    mlPrediction: number | null;
    demandScore: number;
    inflationFactor: number;
}

interface TaskResult {
    task: { _id: string; title: string; category: string; subcategory: string; estimatedHours: number; status: string };
    aiSuggestedPrice: number;
    deterministicPrice: number;
    mlPrediction: number | null;
    finalPrice: number;
    isPriceEdited: boolean;
    assigned_to: { name: string } | null;
}

export default function PostTaskPage() {
    const [form, setForm] = useState({
        title: '',
        description: '',
        digital_or_physical: 'digital',
        category: '',
        subcategory: '',
        estimatedHours: 1,
    });
    const [customPrice, setCustomPrice] = useState('');
    const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [result, setResult] = useState<TaskResult | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const categoryList = Object.keys(CATEGORIES);
    const subcategoryList = form.category ? CATEGORIES[form.category] || [] : [];

    // Fetch AI price suggestion whenever category + subcategory + hours change
    const fetchPrice = useCallback(async () => {
        if (!form.category || !form.subcategory || form.estimatedHours <= 0) {
            setPriceSuggestion(null);
            return;
        }
        setPriceLoading(true);
        try {
            const suggestion = await api.suggestPrice({
                category: form.category,
                subcategory: form.subcategory,
                hours: form.estimatedHours,
            });
            setPriceSuggestion(suggestion);
            // Pre-fill custom price with AI suggestion if not set yet
            setCustomPrice((prev) => prev === '' ? String(suggestion.aiSuggestedPrice) : prev);
        } catch {
            // Silently ignore — suggest endpoint failing shouldn't block the form
            setPriceSuggestion(null);
        } finally {
            setPriceLoading(false);
        }
    }, [form.category, form.subcategory, form.estimatedHours]);

    useEffect(() => {
        const timer = setTimeout(fetchPrice, 400); // debounce 400ms
        return () => clearTimeout(timer);
    }, [fetchPrice]);

    // Reset subcategory when category changes
    function handleCategoryChange(cat: string) {
        setForm({ ...form, category: cat, subcategory: '' });
        setCustomPrice('');
        setPriceSuggestion(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);
        try {
            const body: Record<string, unknown> = {
                title: form.title,
                description: form.description,
                digital_or_physical: form.digital_or_physical,
                category: form.category,
                subcategory: form.subcategory,
                estimatedHours: form.estimatedHours,
            };
            if (customPrice !== '') {
                body.userPrice = Number(customPrice);
            }
            const res = await api.postTask(body) as TaskResult;
            setResult(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to post task');
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setResult(null);
        setForm({ title: '', description: '', digital_or_physical: 'digital', category: '', subcategory: '', estimatedHours: 1 });
        setCustomPrice('');
        setPriceSuggestion(null);
        setError('');
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Post a Task</h1>
            <p className="text-slate-400 text-sm mb-6">
                Select a category, describe your task, and let the AI suggest a fair price.
            </p>

            {error && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

            {result ? (
                /* ── Success Card ── */
                <div className="bg-slate-900 border border-green-800 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-green-400 text-xl">✓</span>
                        <h2 className="text-lg font-semibold text-white">Task Posted Successfully</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Category</p>
                            <p className="text-white font-medium">{result.task.category}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Subcategory</p>
                            <p className="text-white font-medium">{result.task.subcategory}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">AI Suggested Price</p>
                            <p className="text-slate-300 font-medium">₹{result.aiSuggestedPrice}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Deterministic</p>
                            <p className="text-slate-400 font-medium text-sm">₹{result.deterministicPrice}</p>
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-indigo-800 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Final Price (Escrowed)</p>
                            <p className="text-indigo-400 font-bold text-2xl">₹{result.finalPrice}</p>
                        </div>
                        {result.isPriceEdited && (
                            <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-800 px-2.5 py-1 rounded-full">
                                Custom price
                            </span>
                        )}
                    </div>

                    <button onClick={resetForm} className="text-sm text-indigo-400 hover:underline">
                        Post another task
                    </button>
                </div>
            ) : (
                /* ── Post Form ── */
                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">

                    {/* Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                            <select
                                id="category"
                                required
                                value={form.category}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">Select category…</option>
                                {categoryList.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subcategory — dynamic */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Subcategory</label>
                            <select
                                id="subcategory"
                                required
                                value={form.subcategory}
                                disabled={!form.category}
                                onChange={(e) => { setForm({ ...form, subcategory: e.target.value }); setCustomPrice(''); }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                            >
                                <option value="">Select subcategory…</option>
                                {subcategoryList.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Estimated Hours */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Estimated Hours <span className="text-slate-500 font-normal">({form.estimatedHours}h)</span>
                        </label>
                        <input
                            id="estimated-hours"
                            type="range"
                            min={1}
                            max={10}
                            step={0.5}
                            value={form.estimatedHours}
                            onChange={(e) => { setForm({ ...form, estimatedHours: Number(e.target.value) }); setCustomPrice(''); }}
                            className="w-full accent-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>1h</span><span>10h</span>
                        </div>
                    </div>

                    {/* Task Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Task Type</label>
                        <select
                            id="digital_or_physical"
                            value={form.digital_or_physical}
                            onChange={(e) => setForm({ ...form, digital_or_physical: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="digital">Digital</option>
                            <option value="physical">Physical</option>
                        </select>
                    </div>

                    {/* Title */}
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            required
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                            placeholder="Describe the task in detail…"
                        />
                    </div>

                    {/* ── AI Price Card ── */}
                    {(priceSuggestion || priceLoading) && (
                        <div className="border border-indigo-800 bg-indigo-950/40 rounded-xl p-4 space-y-3">
                            {priceLoading ? (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Calculating AI price…
                                </div>
                            ) : priceSuggestion && (
                                <>
                                    <div>
                                        <p className="text-xs text-indigo-300 uppercase tracking-wide font-medium mb-0.5">AI Suggested Price</p>
                                        <p className="text-3xl font-bold text-white">₹{priceSuggestion.aiSuggestedPrice}</p>
                                        <p className="text-xs text-slate-400 mt-1">Calculated using demand trends and pricing intelligence.</p>
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span>Deterministic: <span className="text-slate-300">₹{priceSuggestion.deterministicPrice}</span></span>
                                        {priceSuggestion.mlPrediction !== null && (
                                            <span>ML model: <span className="text-slate-300">₹{priceSuggestion.mlPrediction}</span></span>
                                        )}
                                        <span>Demand: <span className="text-slate-300">{priceSuggestion.demandScore}×</span></span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Editable Price Input — no restriction ── */}
                    {priceSuggestion && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Your Price <span className="text-slate-500 font-normal">(advisory — enter any amount)</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">₹</span>
                                <input
                                    id="custom-price-input"
                                    type="number"
                                    min={1}
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-lg font-semibold"
                                    placeholder={String(priceSuggestion.aiSuggestedPrice)}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5">
                                AI suggestion is advisory. You may enter any amount — no restrictions.
                            </p>
                        </div>
                    )}

                    <button
                        id="post-task-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? 'Posting…' : 'Post Task'}
                    </button>
                </form>
            )}
        </div>
    );
}
