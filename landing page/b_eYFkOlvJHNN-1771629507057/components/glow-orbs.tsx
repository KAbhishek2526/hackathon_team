"use client"

import { motion } from "framer-motion"

export function GlowOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsla(270, 80%, 60%, 0.4) 0%, transparent 70%)",
        }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-48 -right-32 h-[600px] w-[600px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, hsla(330, 80%, 55%, 0.4) 0%, transparent 70%)",
        }}
        animate={{
          x: [0, -60, 50, 0],
          y: [0, 50, -60, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, hsla(240, 80%, 60%, 0.4) 0%, transparent 70%)",
        }}
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}
