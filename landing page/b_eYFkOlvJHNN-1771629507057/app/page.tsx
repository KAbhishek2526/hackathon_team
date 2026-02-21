"use client"

import { ParticleBackground } from "@/components/particle-background"
import { GlowOrbs } from "@/components/glow-orbs"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"

import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <ParticleBackground />
      <GlowOrbs />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
