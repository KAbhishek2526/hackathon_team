'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Task {
    _id: string;
    title: string;
    description: string;
    category: string;
    complexity_level: string;
    estimated_time_hours: number;
    price: number;
    digital_or_physical: string;
    posted_by: { name: string; college_domain: string };
    created_at: string;
}

const complexityColor: Record<string, string> = {
    Low: 'text-green-400 bg-green-900/30 border-green-800',
    Medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
    High: 'text-red-400 bg-red-900/30 border-red-800',
};

export default function AvailableTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getOpenTasks()
            .then((data) => setTasks(data as Task[]))
            .catch(() => setError('Failed to load tasks. Please login.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Available Tasks</h1>
                <p className="text-slate-400 text-sm mt-1">Open tasks not yet matched to a student.</p>
            </div>

            {error && <p className="text-red-400">{error}</p>}
            {loading && <p className="text-slate-400">Loading…</p>}

            {!loading && tasks.length === 0 && (
                <div className="text-center py-16 text-slate-500">No open tasks right now.</div>
            )}

            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="font-semibold text-white">{task.title}</h2>
                                <p className="text-slate-400 text-sm mt-1 leading-relaxed">{task.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-indigo-400 font-bold text-xl">₹{task.price}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{task.estimated_time_hours}h</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-300">{task.category}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${complexityColor[task.complexity_level]}`}>{task.complexity_level}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-300">{task.digital_or_physical}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-400">By {task.posted_by?.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
