"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, ArrowLeft, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, hsla(270, 90%, 55%, 0.2) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-8 backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <span className="font-mono text-lg font-bold text-foreground">FreeHour</span>
          </div>

          <h1 className="font-mono text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>

          {/* Form */}
          <form className="mt-8 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-input/50 px-4 py-3 transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_0_20px_hsla(270,80%,60%,0.1)]">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-input/50 px-4 py-3 transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_0_20px_hsla(270,80%,60%,0.1)]">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:shadow-[0_0_30px_hsla(270,80%,60%,0.4)]"
              style={{
                background:
                  "linear-gradient(135deg, hsl(270, 80%, 55%) 0%, hsl(300, 70%, 50%) 100%)",
              }}
            >
              Sign In
            </motion.button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/register" className="text-primary transition-colors hover:text-primary/80">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  )
}
