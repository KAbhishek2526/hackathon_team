"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* Center glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, hsla(270, 90%, 55%, 0.15) 0%, hsla(280, 80%, 50%, 0.05) 40%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8 flex justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium tracking-wide text-primary">
              Your time, maximized
            </span>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="font-mono text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-7xl lg:text-8xl"
        >
          <span className="text-balance">Free</span>
          <span
            className="text-balance bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(270, 80%, 65%) 0%, hsl(330, 80%, 60%) 50%, hsl(240, 80%, 65%) 100%)",
            }}
          >
            Hour
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl"
        >
          Got Free Time? Use FreeHour
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-3 max-w-md text-pretty text-sm text-muted-foreground/70"
        >
          Discover, organize, and make the most of every free moment. Built for
          people who value their time.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden rounded-xl border border-border bg-secondary/50 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_hsla(270,80%,60%,0.15)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Login
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </motion.button>
          </Link>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden rounded-xl px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:shadow-[0_0_40px_hsla(270,80%,60%,0.4)]"
              style={{
                background:
                  "linear-gradient(135deg, hsl(270, 80%, 55%) 0%, hsl(300, 70%, 50%) 100%)",
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              </span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          variants={itemVariants}
          className="mt-20 flex items-center justify-center gap-6 text-xs text-muted-foreground/50"
        >
          {["No Credit Card", "Free Forever", "Instant Setup"].map((text, i) => (
            <motion.span
              key={text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 + i * 0.2 }}
              className="flex items-center gap-1.5"
            >
              <span className="h-1 w-1 rounded-full bg-primary/50" />
              {text}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
