'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Task {
    _id: string;
    title: string;
    category: string;
    complexity_level: string;
    estimated_time_hours: number;
    price: number;
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
        setActionError('');
        setActionMsg('');
        try {
            await api.completeTask(id);
            setActionMsg('Task marked complete! Wallet credited.');
            loadTasks();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Action failed');
        }
    }

    async function handleCancel(id: string) {
        setActionError('');
        setActionMsg('');
        try {
            await api.cancelTask(id);
            setActionMsg('Task cancelled. Funds refunded to your wallet.');
            loadTasks();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Action failed');
        }
    }

    function TaskCard({ task, role }: { task: Task; role: 'poster' | 'assignee' }) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-white">{task.title}</h3>
                        <p className="text-slate-400 text-sm mt-0.5">{task.category} · {task.complexity_level} · {task.estimated_time_hours}h</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-indigo-400 font-bold">₹{task.price}</p>
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
            {actionMsg && (
                <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded text-green-300 text-sm">{actionMsg}</div>
            )}
            {actionError && (
                <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{actionError}</div>
            )}
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
