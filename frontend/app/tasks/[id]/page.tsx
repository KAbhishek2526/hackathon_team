'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface TaskData {
    _id: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    estimatedHours: number;
    estimated_time_hours: number;
    status: string;
    finalPrice: number;
    price: number;
    aiSuggestedPrice: number;
    posted_by: { _id: string; name: string; email: string };
    assigned_to: { _id: string; name: string; email: string } | null;
    created_at: string;
}

interface ChatDoc {
    _id: string;
    taskId: string;
    clientId: { _id: string; name: string } | string;
    participantId: { _id: string; name: string } | string;
    status: 'inquiry' | 'active' | 'closed';
    messages: ChatMessage[];
}

interface ChatMessage {
    _id?: string;
    senderId: string;
    message: string;
    timestamp: string;
}

const statusColors: Record<string, string> = {
    open: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
    assigned: 'text-blue-400 bg-blue-900/30 border-blue-800',
    in_progress: 'text-cyan-400 bg-cyan-900/30 border-cyan-800',
    awaiting_approval: 'text-amber-400 bg-amber-900/30 border-amber-800',
    completed: 'text-green-400 bg-green-900/30 border-green-800',
    disputed: 'text-red-400 bg-red-900/30 border-red-800',
    cancelled: 'text-slate-400 bg-slate-800 border-slate-700',
    expired: 'text-orange-400 bg-orange-900/30 border-orange-800',
};

const chatStatusPill: Record<string, string> = {
    inquiry: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
    active: 'text-green-400 bg-green-900/30 border-green-800',
    closed: 'text-slate-500 bg-slate-800 border-slate-700',
};

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params?.id as string;

    const [task, setTask] = useState<TaskData | null>(null);
    const [chat, setChat] = useState<ChatDoc | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatStatus, setChatStatus] = useState<string>('');
    const [msgInput, setMsgInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [actionError, setActionError] = useState('');
    const [increasePriceInput, setIncreasePriceInput] = useState('');
    const [showIncreasePrice, setShowIncreasePrice] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUser = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const currentUserId = currentUser?.id || currentUser?._id || '';

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    useEffect(() => {
        if (!taskId) return;

        api.getTask(taskId)
            .then(async (taskData) => {
                const t = taskData as TaskData;
                setTask(t);
                setIncreasePriceInput(String(t.finalPrice || t.price));

                // Find the relevant chat for this user
                try {
                    const chats = await api.getTaskChats(taskId) as ChatDoc[];
                    let relevantChat: ChatDoc | undefined;

                    const isClient = String(t.posted_by?._id || t.posted_by) === String(currentUserId);
                    if (isClient) {
                        // Client sees the active chat first, otherwise the first inquiry
                        relevantChat = chats.find((c) => c.status === 'active') || chats[0];
                    } else {
                        // Worker sees their own chat
                        relevantChat = chats.find((c) => {
                            const pid = typeof c.participantId === 'object' ? c.participantId._id : c.participantId;
                            return String(pid) === String(currentUserId);
                        });
                    }

                    if (relevantChat) {
                        setChat(relevantChat);
                        setChatId(String(relevantChat._id));
                        setMessages(relevantChat.messages || []);
                        setChatStatus(relevantChat.status);
                    }
                } catch {
                    // No chat yet — that's fine
                }
            })
            .catch((err) => setActionError(err.message || 'Failed to load task'))
            .finally(() => setLoading(false));
    }, [taskId]);

    // Set up socket for the chat room
    useEffect(() => {
        if (!chatId) return;

        const socket = getSocket();
        socket.emit('join_chat', { chatId });

        socket.on('receive_message', (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('joined_chat', ({ status }: { status: string }) => {
            setChatStatus(status);
        });

        socket.on('chat_closed', () => {
            setChatStatus('closed');
        });

        return () => {
            socket.off('receive_message');
            socket.off('joined_chat');
            socket.off('chat_closed');
        };
    }, [chatId]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    async function handleAction(action: string, apiFn: () => Promise<unknown>) {
        setActionLoading(action);
        setActionMsg('');
        setActionError('');
        try {
            const res = await apiFn() as { message?: string };
            setActionMsg(res?.message || 'Action successful');
            const updated = await api.getTask(taskId) as TaskData;
            setTask(updated);
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActionLoading('');
        }
    }

    function sendMessage() {
        if (!msgInput.trim() || !chatId) return;
        if (chatStatus === 'closed') return;
        const socket = getSocket();
        socket.emit('send_message', { chatId, message: msgInput.trim() });
        setMsgInput('');
    }

    if (loading) return <div className="text-slate-400">Loading task…</div>;
    if (!task) return <div className="text-red-400">Task not found.</div>;

    const isClient = String(task.posted_by?._id || task.posted_by) === String(currentUserId);
    const isWorker = task.assigned_to && String(task.assigned_to._id || task.assigned_to) === String(currentUserId);
    const isParticipant = isClient || isWorker;
    const hasChat = !!chatId;
    const displayPrice = task.finalPrice || task.price;
    const activeStatuses = ['assigned', 'in_progress', 'awaiting_approval'];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <button onClick={() => router.back()} className="text-slate-400 text-sm hover:text-white mb-2 block">← Back</button>
                    <h1 className="text-2xl font-bold text-white">{task.title}</h1>
                    <p className="text-slate-400 text-sm mt-1">{task.category}{task.subcategory ? ` / ${task.subcategory}` : ''} · {task.estimatedHours || task.estimated_time_hours}h</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-indigo-400 font-bold text-2xl">₹{displayPrice}</p>
                    {task.aiSuggestedPrice > 0 && <p className="text-slate-500 text-xs">AI: ₹{task.aiSuggestedPrice}</p>}
                    <span className={`text-xs px-2.5 py-1 rounded-full border mt-1 inline-block ${statusColors[task.status] || 'text-slate-400'}`}>
                        {task.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <p className="text-slate-300 mb-2">{task.description}</p>
            <div className="text-sm text-slate-500 mb-6 flex gap-4">
                <span>Client: <span className="text-slate-300">{task.posted_by?.name}</span></span>
                <span>Worker: <span className="text-slate-300">{task.assigned_to?.name || 'Not assigned yet'}</span></span>
            </div>

            {/* Action Messages */}
            {actionMsg && <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded text-green-300 text-sm">{actionMsg}</div>}
            {actionError && <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">{actionError}</div>}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
                {isWorker && ['assigned', 'in_progress'].includes(task.status) && (
                    <button id="mark-complete-btn" disabled={actionLoading === 'complete'}
                        onClick={() => handleAction('complete', () => api.completeTask(taskId))}
                        className="px-5 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                        {actionLoading === 'complete' ? 'Submitting…' : '✓ Mark Complete'}
                    </button>
                )}
                {isClient && task.status === 'awaiting_approval' && (
                    <button id="approve-btn" disabled={actionLoading === 'approve'}
                        onClick={() => handleAction('approve', () => api.approveTask(taskId))}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                        {actionLoading === 'approve' ? 'Approving…' : '💳 Approve & Release Payment'}
                    </button>
                )}
                {isClient && activeStatuses.includes(task.status) && (
                    <button id="increase-price-btn" onClick={() => setShowIncreasePrice(!showIncreasePrice)}
                        className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
                        💰 Increase Price
                    </button>
                )}
                {isParticipant && activeStatuses.includes(task.status) && (
                    <button id="dispute-btn" disabled={actionLoading === 'dispute'}
                        onClick={() => { if (!confirm('Raise a dispute? This will freeze the task.')) return; handleAction('dispute', () => api.disputeTask(taskId)); }}
                        className="px-5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                        {actionLoading === 'dispute' ? 'Raising…' : '⚠ Raise Dispute'}
                    </button>
                )}
                {isClient && task.status === 'open' && (
                    <button id="cancel-task-btn" disabled={actionLoading === 'cancel'}
                        onClick={() => { if (!confirm('Cancel this task? Escrow will be refunded to your wallet.')) return; handleAction('cancel', () => api.cancelTask(taskId)); }}
                        className="px-5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                        {actionLoading === 'cancel' ? 'Cancelling…' : '✕ Cancel Task'}
                    </button>
                )}
            </div>

            {/* Increase Price Panel */}
            {showIncreasePrice && (
                <div className="mb-6 bg-slate-900 border border-amber-800 rounded-xl p-5">
                    <h3 className="text-slate-200 font-semibold mb-3">Increase Task Price</h3>
                    <p className="text-slate-500 text-sm mb-3">Current: ₹{displayPrice} — enter a higher amount only</p>
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">New Price (₹)</label>
                            <input id="increase-price-input" type="number" min={displayPrice + 1} value={increasePriceInput}
                                onChange={(e) => setIncreasePriceInput(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-600" />
                        </div>
                        <button disabled={actionLoading === 'increasePrice' || Number(increasePriceInput) <= displayPrice}
                            onClick={() => handleAction('increasePrice', () => api.increasePrice(taskId, Number(increasePriceInput)))}
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                            {actionLoading === 'increasePrice' ? 'Updating…' : 'Confirm Increase'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Chat Panel ── */}
            {hasChat ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                        <span className="text-slate-200 font-semibold">Task Chat</span>
                        {chatStatus && (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${chatStatusPill[chatStatus] || ''}`}>
                                {chatStatus}
                            </span>
                        )}
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto" />
                    </div>

                    {chatStatus === 'closed' && (
                        <div className="mx-4 mt-3 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-xs">
                            This chat has been closed — another worker was assigned.
                        </div>
                    )}

                    <div className="h-72 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <p className="text-slate-500 text-sm text-center py-8">No messages yet. Start the conversation!</p>
                        )}
                        {messages.map((msg, i) => {
                            const isMine = String(msg.senderId) === String(currentUserId);
                            return (
                                <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
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

                    <div className="px-4 py-3 border-t border-slate-800 flex gap-3">
                        {chatStatus === 'closed' ? (
                            <p className="text-slate-600 text-xs w-full text-center py-1">Chat is closed</p>
                        ) : (
                            <>
                                <input id="chat-input" type="text" value={msgInput}
                                    onChange={(e) => setMsgInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    placeholder="Type a message…"
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
                                <button id="send-message-btn" onClick={sendMessage} disabled={!msgInput.trim()}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
                                    Send
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                !isClient && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                        <p className="text-slate-400 text-sm mb-3">No active chat yet. Start an inquiry from the Available Tasks page.</p>
                        <a href="/tasks/available" className="text-indigo-400 hover:underline text-sm">Browse Available Tasks →</a>
                    </div>
                )
            )}
        </div>
    );
}
