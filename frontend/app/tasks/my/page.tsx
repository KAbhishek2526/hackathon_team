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
    posted_by: { _id: string; name: string };
    assigned_to: { _id: string; name: string } | null;
    created_at: string;
}

const statusColor: Record<string, string> = {
    open: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
    assigned: 'text-blue-400 bg-blue-900/30 border-blue-800',
    completed: 'text-green-400 bg-green-900/30 border-green-800',
    cancelled: 'text-red-400 bg-red-900/30 border-red-800',
};

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [userId, setUserId] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) setUserId(JSON.parse(user).id || JSON.parse(user)._id || '');
        api.getMyTasks()
            .then((data) => setTasks(data as Task[]))
            .catch(() => setError('Failed to load tasks.'))
            .finally(() => setLoading(false));
    }, []);

    async function handleComplete(id: string) {
        setActionError('');
        try {
            await api.completeTask(id);
            setTasks((prev) => prev.map((t) => t._id === id ? { ...t, status: 'completed' } : t));
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Action failed');
        }
    }

    async function handleCancel(id: string) {
        setActionError('');
        try {
            await api.cancelTask(id);
            setTasks((prev) => prev.map((t) => t._id === id ? { ...t, status: 'cancelled' } : t));
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Action failed');
        }
    }

    const posted = tasks.filter((t) => t.posted_by?._id === userId || String(t.posted_by) === userId);
    const assigned = tasks.filter((t) => t.assigned_to && (t.assigned_to._id === userId || String(t.assigned_to) === userId));

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
                        <span className={`text-xs px-2.5 py-1 rounded-full border mt-1 inline-block ${statusColor[task.status]}`}>{task.status}</span>
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                    {role === 'poster' ? `Assigned to: ${task.assigned_to?.name || 'Unmatched'}` : `Posted by: ${task.posted_by?.name}`}
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
            {actionError && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{actionError}</div>}
            {loading && <p className="text-slate-400">Loading…</p>}

            {!loading && (
                <>
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-300 mb-3">Tasks I Posted ({posted.length})</h2>
                        {posted.length === 0 ? <p className="text-slate-500 text-sm">None yet.</p> : (
                            <div className="space-y-4">{posted.map((t) => <TaskCard key={t._id} task={t} role="poster" />)}</div>
                        )}
                    </section>
                    <section>
                        <h2 className="text-lg font-semibold text-slate-300 mb-3">Tasks Assigned to Me ({assigned.length})</h2>
                        {assigned.length === 0 ? <p className="text-slate-500 text-sm">None yet.</p> : (
                            <div className="space-y-4">{assigned.map((t) => <TaskCard key={t._id} task={t} role="assignee" />)}</div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
