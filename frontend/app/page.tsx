'use client';

import { useEffect, useState } from 'react';
import { ParticleBackground } from './components/landing/particle-background';
import { GlowOrbs } from './components/landing/glow-orbs';
import { LandingNavbar } from './components/landing/navbar';
import { HeroSection } from './components/landing/hero-section';
import { FeaturesSection } from './components/landing/features-section';
import { StatsSection } from './components/landing/stats-section';
import { CtaSection } from './components/landing/cta-section';
import { LandingFooter } from './components/landing/footer';

export default function LandingPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Auth redirect: send logged-in users straight to their dashboard
    const token = localStorage.getItem('token');
    const user = (() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}'); }
      catch { return {}; }
    })();

    if (token && user?.id) {
      const dest = user.role === 'global_client' ? '/pro-dashboard' : '/dashboard';
      window.location.replace(dest);
      return;
    }
    setChecking(false);
  }, []);

  // Render nothing while checking auth (avoids flash)
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(222, 47%, 5%)' }}>
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: 'hsl(222, 47%, 5%)' }}>
      <ParticleBackground />
      <GlowOrbs />
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
