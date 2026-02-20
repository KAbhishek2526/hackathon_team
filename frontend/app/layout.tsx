import type { Metadata } from 'next';
import './globals.css';
import LogoutButton from './components/LogoutButton';

export const metadata: Metadata = {
  title: 'MicroTask — Student Micro-Economy Platform',
  description: 'AI-governed micro-task economy exclusively for verified college students.',
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
      {label}
    </a>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <nav className="border-b border-slate-800 bg-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/dashboard" className="font-bold text-lg text-indigo-400 tracking-tight">MicroTask</a>
            <div className="flex gap-6">
              <NavLink href="/dashboard" label="Dashboard" />
              <NavLink href="/tasks/post" label="Post Task" />
              <NavLink href="/tasks/available" label="Available Tasks" />
              <NavLink href="/tasks/my" label="My Tasks" />
              <NavLink href="/profile" label="Profile" />
              <NavLink href="/wallet" label="Wallet" />
            </div>
            <LogoutButton />
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
