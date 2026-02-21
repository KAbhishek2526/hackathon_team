"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative z-10 px-6 py-32">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-balance font-mono text-3xl font-bold text-foreground sm:text-5xl">
            Ready to take control of your time?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-pretty text-muted-foreground">
            Join thousands of people who are already making the most of their
            free hours. Start your journey today.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
                  Get Started for Free
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-border bg-secondary/50 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_hsla(270,80%,60%,0.15)]"
              >
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
