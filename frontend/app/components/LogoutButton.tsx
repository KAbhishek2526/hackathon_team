'use client';

export default function LogoutButton() {
    function handleLogout(e: React.MouseEvent) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    return (
        <a
            href="/login"
            id="logout-btn"
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
            Logout
        </a>
    );
}
