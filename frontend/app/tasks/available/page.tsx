'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface Task {
    _id: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    complexity_level: string;
    estimated_time_hours: number;
    estimatedHours: number;
    price: number;
    finalPrice: number;
    digital_or_physical: string;
    posted_by: { name: string; college_domain: string };
    created_at: string;
}

interface ChatMessage {
    _id?: string;
    senderId: string;
    message: string;
    timestamp: string;
}

interface InquiryModalState {
    taskId: string;
    taskTitle: string;
    chatId: string;
    messages: ChatMessage[];
    status: string;
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
    const [accepting, setAccepting] = useState<string | null>(null);
    const [openingChat, setOpeningChat] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState('');
    const [actionError, setActionError] = useState('');
    const [modal, setModal] = useState<InquiryModalState | null>(null);
    const [msgInput, setMsgInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUser = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const currentUserId = currentUser?.id || currentUser?._id || '';

    useEffect(() => {
        // Role guard: global_clients cannot access available tasks
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser?.role === 'global_client') return; // blocked — we show the guard below

        api.getOpenTasks()
            .then((data) => setTasks(data as Task[]))
            .catch(() => setError('Failed to load tasks. Please login.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!modal) return;

        const socket = getSocket();
        socket.emit('join_chat', { chatId: modal.chatId });

        socket.on('receive_message', (msg: ChatMessage) => {
            setModal((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
        });

        socket.on('chat_closed', () => {
            setModal((prev) => prev ? { ...prev, status: 'closed' } : prev);
        });

        return () => {
            socket.off('receive_message');
            socket.off('chat_closed');
        };
    }, [modal?.chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [modal?.messages]);

    async function handleOpenChat(task: Task) {
        setOpeningChat(task._id);
        setActionError('');
        try {
            const res = await api.openInquiryChat(task._id);
            setModal({
                taskId: task._id,
                taskTitle: task.title,
                chatId: res.chatId,
                messages: (res.messages as ChatMessage[]) || [],
                status: res.status,
            });
            setMsgInput('');
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Could not open chat');
        } finally {
            setOpeningChat(null);
        }
    }

    function sendMessage() {
        if (!msgInput.trim() || !modal) return;
        if (modal.status === 'closed') return;
        const socket = getSocket();
        socket.emit('send_message', { chatId: modal.chatId, message: msgInput.trim() });
        setMsgInput('');
    }

    function closeModal() {
        const socket = getSocket();
        socket.off('receive_message');
        socket.off('chat_closed');
        setModal(null);
    }

    async function handleAccept(id: string) {
        setAccepting(id);
        setActionMsg('');
        setActionError('');
        try {
            await api.acceptTask(id);
            setTasks((prev) => prev.filter((t) => t._id !== id));
            setActionMsg('Task accepted! Go to My Tasks to view and chat.');
            closeModal();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Failed to accept task');
        } finally {
            setAccepting(null);
        }
    }

    return (
        <div>
            {/* Global client block */}
            {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user') || '{}')?.role === 'global_client' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-5xl mb-4">🚫</div>
                    <h2 className="text-xl font-bold text-white mb-2">Not Available for Professionals</h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-sm">Professional accounts cannot accept tasks or see the Available Tasks board. You can post tasks and hire students instead.</p>
                    <a href="/pro-dashboard" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">← Go to Pro Dashboard</a>
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Available Tasks</h1>
                <p className="text-slate-400 text-sm mt-1">Open tasks posted by students and professionals. Chat with the client or accept a task to start working.</p>
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}
            {actionMsg && <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded text-green-300 text-sm">{actionMsg}</div>}
            {actionError && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{actionError}</div>}
            {loading && <p className="text-slate-400">Loading…</p>}

            {!loading && tasks.length === 0 && (
                <div className="text-center py-16 text-slate-500">No open tasks right now. Check back later.</div>
            )}

            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="font-semibold text-white">{task.title}</h2>
                                <p className="text-slate-400 text-sm mt-1 leading-relaxed">{task.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-indigo-400 font-bold text-xl">₹{task.finalPrice || task.price}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{task.estimatedHours || task.estimated_time_hours}h</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-300">{task.category}{task.subcategory ? ` / ${task.subcategory}` : ''}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${complexityColor[task.complexity_level] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>{task.complexity_level}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 border-slate-700 text-slate-400">By {task.posted_by?.name}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                id={`chat-${task._id}`}
                                onClick={() => handleOpenChat(task)}
                                disabled={openingChat === task._id}
                                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                {openingChat === task._id ? 'Opening…' : '💬 Chat with Client'}
                            </button>
                            <button
                                id={`accept-${task._id}`}
                                onClick={() => handleAccept(task._id)}
                                disabled={accepting === task._id}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                {accepting === task._id ? 'Accepting…' : 'Accept Task'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Inquiry Chat Modal ── */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                            <div>
                                <h3 className="text-white font-semibold text-sm">Inquiry Chat</h3>
                                <p className="text-slate-400 text-xs truncate max-w-xs mt-0.5">{modal.taskTitle}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {modal.status === 'inquiry' && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-900/40 border border-yellow-800 text-yellow-400 rounded-full">Inquiry</span>
                                )}
                                {modal.status === 'active' && (
                                    <span className="text-xs px-2 py-0.5 bg-green-900/40 border border-green-800 text-green-400 rounded-full">Active</span>
                                )}
                                {modal.status === 'closed' && (
                                    <span className="text-xs px-2 py-0.5 bg-red-900/40 border border-red-800 text-red-400 rounded-full">Closed</span>
                                )}
                                <button onClick={closeModal} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
                            </div>
                        </div>

                        {/* Closed banner */}
                        {modal.status === 'closed' && (
                            <div className="mx-4 mt-3 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-xs">
                                This inquiry has been closed — the task was accepted by another worker.
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {modal.messages.length === 0 && (
                                <p className="text-slate-500 text-sm text-center py-8">No messages yet. Introduce yourself!</p>
                            )}
                            {modal.messages.map((msg, i) => {
                                const isMine = String(msg.senderId) === String(currentUserId);
                                return (
                                    <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                                            }`}>
                                            <p>{msg.message}</p>
                                            <p className={`text-xs mt-1 ${isMine ? 'text-indigo-300' : 'text-slate-500'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 border-t border-slate-800 shrink-0">
                            {modal.status === 'closed' ? (
                                <p className="text-slate-600 text-xs text-center py-1">Chat is closed</p>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        id="inquiry-chat-input"
                                        type="text"
                                        value={msgInput}
                                        onChange={(e) => setMsgInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        placeholder="Type a message…"
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                                    />
                                    <button
                                        id="inquiry-send-btn"
                                        onClick={sendMessage}
                                        disabled={!msgInput.trim()}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
