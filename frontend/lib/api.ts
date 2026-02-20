const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data as T;
}

export const api = {
    register: (body: object) => apiFetch<{ token: string; user: object }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: object) => apiFetch<{ token: string; user: object }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => apiFetch<object>('/api/users/me'),
    getWallet: () => apiFetch<object>('/api/users/wallet'),
    getOpenTasks: () => apiFetch<object[]>('/api/tasks'),
    getMyTasks: () => apiFetch<object>('/api/tasks/my'),
    postTask: (body: object) => apiFetch<object>('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
    acceptTask: (id: string) => apiFetch<object>(`/api/tasks/${id}/accept`, { method: 'POST' }),
    completeTask: (id: string) => apiFetch<object>(`/api/tasks/${id}/complete`, { method: 'POST' }),
    cancelTask: (id: string) => apiFetch<object>(`/api/tasks/${id}/cancel`, { method: 'POST' }),
    resetWeek: () => apiFetch<object>('/api/reset-week', { method: 'POST' }),
};

export function saveToken(token: string, user: object) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}
