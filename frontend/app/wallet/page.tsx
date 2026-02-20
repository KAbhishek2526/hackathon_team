'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Transaction {
    _id: string;
    task_id: { title: string } | null;
    payer_id: { name: string };
    receiver_id: { name: string } | null;
    amount: number;
    status: string;
    created_at: string;
}

interface WalletData {
    wallet_balance: number;
    transactions: Transaction[];
}

const statusColor: Record<string, string> = {
    escrow: 'text-yellow-400',
    released: 'text-green-400',
    refunded: 'text-blue-400',
};

export default function WalletPage() {
    const [data, setData] = useState<WalletData | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getWallet()
            .then((d) => setData(d as WalletData))
            .catch(() => setError('Failed to load wallet.'));
    }, []);

    if (error) return <p className="text-red-400">{error}</p>;
    if (!data) return <p className="text-slate-400">Loading…</p>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-6">Wallet</h1>

            <div className="bg-slate-900 border border-green-800 rounded-xl p-6 mb-6 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Available Balance</p>
                    <p className="text-4xl font-bold text-white mt-1">₹{data.wallet_balance}</p>
                </div>
                <div className="text-green-400 text-4xl">₹</div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>

                {data.transactions.length === 0 && (
                    <p className="text-slate-500 text-sm">No transactions yet.</p>
                )}

                <div className="space-y-3">
                    {data.transactions.map((tx) => {
                        const date = new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        return (
                            <div key={tx._id} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-white text-sm font-medium">{tx.task_id?.title || 'Unknown Task'}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        {tx.payer_id?.name} → {tx.receiver_id?.name || 'Unassigned'} · {date}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-white font-semibold">₹{tx.amount}</p>
                                    <p className={`text-xs ${statusColor[tx.status]}`}>{tx.status}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
