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
    in_progress: 'text-cyan-400 bg-cyan-900/30 border-cyan-800',
    awaiting_approval: 'text-amber-400 bg-amber-900/30 border-amber-800',
    completed: 'text-green-400 bg-green-900/30 border-green-800',
    disputed: 'text-red-400 bg-red-900/30 border-red-800',
    cancelled: 'text-slate-400 bg-slate-800 border-slate-700',
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

        const canEditPrice = role === 'poster' && task.status === 'open' && task.assigned_to === null;
        const isPriceLocked = role === 'poster' && task.status !== 'open';
        const isActiveTask = ['assigned', 'in_progress', 'awaiting_approval'].includes(task.status);
        const displayPrice = task.finalPrice || task.price;

        async function handleUpdatePrice() {
            setPriceError('');
            setPriceLoading(true);
            try {
                await api.updateTaskPrice(task._id, Number(priceInput));
                setEditingPrice(false);
                loadTasks();
            } catch (err: unknown) {
                setPriceError(err instanceof Error ? err.message : 'Failed to update price');
            } finally {
                setPriceLoading(false);
            }
        }

        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
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
                        <span className={`text-xs px-2.5 py-1 rounded-full border mt-1 inline-block ${statusColor[task.status] || 'text-slate-400'}`}>
                            {task.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                    {role === 'poster'
                        ? `Worker: ${task.assigned_to?.name || 'Not yet accepted'}`
                        : `Client: ${task.posted_by?.name || '?'}`}
                </div>

                {/* Open task price edit */}
                {canEditPrice && (
                    <div className="mt-3">
                        {!editingPrice ? (
                            <button
                                id={`edit-price-${task._id}`}
                                onClick={() => { setEditingPrice(true); setPriceError(''); }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                ✏️ Edit Price
                            </button>
                        ) : (
                            <div className="mt-2 space-y-2 border border-slate-700 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm">₹</span>
                                    <input
                                        type="number" min={1} value={priceInput}
                                        onChange={(e) => setPriceInput(e.target.value)}
                                        className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                {priceError && <p className="text-xs text-red-400">{priceError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdatePrice}
                                        disabled={priceLoading || !priceInput || Number(priceInput) <= 0}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs rounded-md transition-colors"
                                    >
                                        {priceLoading ? 'Updating…' : 'Update'}
                                    </button>
                                    <button onClick={() => setEditingPrice(false)} className="px-3 py-1.5 text-slate-400 hover:text-white text-xs">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isPriceLocked && task.status !== 'open' && (
                    <p className="text-xs text-slate-500 mt-2">🔒 {task.status === 'completed' ? 'Task completed' : task.status === 'disputed' ? 'Disputed — frozen' : 'Price locked after assignment'}</p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {/* View Details / Chat for active tasks */}
                    {(isActiveTask || task.status === 'awaiting_approval') && (
                        <a
                            href={`/tasks/${task._id}`}
                            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                        >
                            💬 View Details & Chat
                        </a>
                    )}

                    {/* Poster can cancel open/assigned tasks */}
                    {role === 'poster' && ['open', 'assigned', 'in_progress'].includes(task.status) && (
                        <button
                            onClick={() => handleCancel(task._id)}
                            className="px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                            Cancel
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
                            ? <p className="text-slate-500 text-sm">No tasks assigned to you yet.</p>
                            : <div className="space-y-4">{data.assigned.map((t) => <TaskCard key={t._id} task={t} role="assignee" />)}</div>
                        }
                    </section>
                </>
            )}
        </div>
    );
}
