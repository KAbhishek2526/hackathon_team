'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Task {
    _id: string;
    title: string;
    category: string;
    subcategory: string;
    complexity_level: string;
    estimated_time_hours: number;
    estimatedHours: number;
    price: number;
    aiSuggestedPrice: number;
    deterministicPrice: number;
    mlPrediction: number | null;
    finalPrice: number;
    isPriceEdited: boolean;
    status: string;
    posted_by: { name: string } | null;
    assigned_to: { name: string } | null;
    created_at: string;
}

interface MyTasksData {
    posted: Task[];
    assigned: Task[];
}

const statusColor: Record<string, string> = {
    open: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
    assigned: 'text-blue-400 bg-blue-900/30 border-blue-800',
    completed: 'text-green-400 bg-green-900/30 border-green-800',
    cancelled: 'text-red-400 bg-red-900/30 border-red-800',
};

export default function MyTasksPage() {
    const [data, setData] = useState<MyTasksData>({ posted: [], assigned: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    function loadTasks() {
        return api.getMyTasks()
            .then((res) => setData(res as MyTasksData))
            .catch(() => setError('Failed to load tasks. Please login.'))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadTasks(); }, []);

    async function handleComplete(id: string) {
        setActionError(''); setActionMsg('');
        try {
            await api.completeTask(id);
            setActionMsg('Task marked complete! Wallet credited.');
            loadTasks();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Action failed');
        }
    }

    async function handleCancel(id: string) {
        setActionError(''); setActionMsg('');
        try {
            await api.cancelTask(id);
            setActionMsg('Task cancelled. Funds refunded to your wallet.');
            loadTasks();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Action failed');
        }
    }

    function TaskCard({ task, role }: { task: Task; role: 'poster' | 'assignee' }) {
        const [editingPrice, setEditingPrice] = useState(false);
        const [priceInput, setPriceInput] = useState(String(task.finalPrice || task.price));
        const [priceLoading, setPriceLoading] = useState(false);
        const [priceError, setPriceError] = useState('');
        const [priceSuccess, setPriceSuccess] = useState('');

        const parsedInput = Number(priceInput);
        const inputInvalid = priceInput !== '' && (isNaN(parsedInput) || parsedInput <= 0);

        const canEditPrice = role === 'poster' && task.status === 'open' && task.assigned_to === null;
        const isPriceLocked = role === 'poster' && (task.status !== 'open' || task.assigned_to !== null);

        async function handleUpdatePrice() {
            setPriceError(''); setPriceSuccess('');
            setPriceLoading(true);
            try {
                await api.updateTaskPrice(task._id, parsedInput);
                setPriceSuccess('Price updated successfully.');
                setEditingPrice(false);
                loadTasks();
            } catch (err: unknown) {
                setPriceError(err instanceof Error ? err.message : 'Failed to update price');
            } finally {
                setPriceLoading(false);
            }
        }

        const displayPrice = task.finalPrice || task.price;

        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-white">{task.title}</h3>
                        <p className="text-slate-400 text-sm mt-0.5">
                            {task.category}{task.subcategory ? ` / ${task.subcategory}` : ''} · {task.estimatedHours || task.estimated_time_hours}h
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="flex items-center gap-2 justify-end">
                            <p className="text-indigo-400 font-bold">₹{displayPrice}</p>
                            {task.isPriceEdited && (
                                <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-800 px-2 py-0.5 rounded-full">edited</span>
                            )}
                        </div>
                        {task.aiSuggestedPrice > 0 && task.aiSuggestedPrice !== displayPrice && (
                            <p className="text-slate-500 text-xs mt-0.5">AI: ₹{task.aiSuggestedPrice}</p>
                        )}
                        <span className={`text-xs px-2.5 py-1 rounded-full border mt-1 inline-block ${statusColor[task.status]}`}>
                            {task.status}
                        </span>
                    </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                    {role === 'poster'
                        ? `Assigned to: ${task.assigned_to?.name || 'Not yet accepted'}`
                        : `Posted by: ${task.posted_by?.name || '?'}`}
                </div>

                {/* Inline price edit — no restriction */}
                {canEditPrice && (
                    <div className="mt-3">
                        {!editingPrice ? (
                            <button
                                id={`edit-price-${task._id}`}
                                onClick={() => { setEditingPrice(true); setPriceInput(String(displayPrice)); setPriceError(''); setPriceSuccess(''); }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                ✏️ Edit Price
                            </button>
                        ) : (
                            <div className="mt-2 space-y-2 border border-slate-700 rounded-lg p-3">
                                <p className="text-xs text-slate-400 font-medium">Update Price</p>
                                {task.aiSuggestedPrice > 0 && (
                                    <p className="text-xs text-slate-500">AI suggested: ₹{task.aiSuggestedPrice} — you may enter any amount</p>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm">₹</span>
                                    <input
                                        id={`price-input-${task._id}`}
                                        type="number"
                                        min={1}
                                        value={priceInput}
                                        onChange={(e) => setPriceInput(e.target.value)}
                                        className={`flex-1 bg-slate-800 border rounded-md px-2.5 py-1.5 text-white text-sm focus:outline-none ${inputInvalid ? 'border-red-700' : 'border-slate-600 focus:border-indigo-500'}`}
                                    />
                                </div>
                                {inputInvalid && <p className="text-xs text-red-400">Please enter a valid positive amount</p>}
                                {priceError && <p className="text-xs text-red-400">{priceError}</p>}
                                {priceSuccess && <p className="text-xs text-green-400">{priceSuccess}</p>}
                                <div className="flex gap-2">
                                    <button
                                        id={`update-price-btn-${task._id}`}
                                        onClick={handleUpdatePrice}
                                        disabled={priceLoading || inputInvalid || priceInput === ''}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs rounded-md transition-colors"
                                    >
                                        {priceLoading ? 'Updating…' : 'Update Price'}
                                    </button>
                                    <button
                                        onClick={() => { setEditingPrice(false); setPriceError(''); }}
                                        className="px-3 py-1.5 text-slate-400 hover:text-white text-xs rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isPriceLocked && (
                    <p className="text-xs text-slate-500 mt-3">🔒 Price locked after assignment</p>
                )}

                <div className="flex gap-2 mt-4">
                    {role === 'assignee' && task.status === 'assigned' && (
                        <button
                            onClick={() => handleComplete(task._id)}
                            className="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                        >
                            Mark Complete
                        </button>
                    )}
                    {role === 'poster' && (task.status === 'open' || task.status === 'assigned') && (
                        <button
                            onClick={() => handleCancel(task._id)}
                            className="px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                            Cancel Task
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-6">My Tasks</h1>

            {error && <p className="text-red-400 mb-4">{error}</p>}
            {actionMsg && <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded text-green-300 text-sm">{actionMsg}</div>}
            {actionError && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{actionError}</div>}
            {loading && <p className="text-slate-400">Loading…</p>}

            {!loading && (
                <>
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-300 mb-3">
                            Tasks I Posted <span className="text-slate-500 font-normal text-sm">({data.posted.length})</span>
                        </h2>
                        {data.posted.length === 0
                            ? <p className="text-slate-500 text-sm">You haven&apos;t posted any tasks yet.</p>
                            : <div className="space-y-4">{data.posted.map((t) => <TaskCard key={t._id} task={t} role="poster" />)}</div>
                        }
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-300 mb-3">
                            Tasks Assigned to Me <span className="text-slate-500 font-normal text-sm">({data.assigned.length})</span>
                        </h2>
                        {data.assigned.length === 0
                            ? <p className="text-slate-500 text-sm">No tasks assigned to you yet. Browse Available Tasks to accept one.</p>
                            : <div className="space-y-4">{data.assigned.map((t) => <TaskCard key={t._id} task={t} role="assignee" />)}</div>
                        }
                    </section>
                </>
            )}
        </div>
    );
}
