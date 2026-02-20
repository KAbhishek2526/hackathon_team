import type { Metadata } from 'next';
import './globals.css';
import ClientNav from './components/ClientNav';

export const metadata: Metadata = {
  title: 'FreeHour — Student Micro-Economy Platform',
  description: 'AI-governed task economy for verified college students and professionals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <ClientNav />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
