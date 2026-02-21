"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 top-0 z-50"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/images/logo.png"
            alt="FreeHour logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_12px_hsla(270,80%,60%,0.5)]"
          />
          <span className="font-mono text-lg font-bold tracking-tight text-foreground">
            FreeHour
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg border border-border bg-secondary/50 px-5 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-secondary hover:shadow-[0_0_20px_hsla(270,80%,60%,0.1)]"
            >
              Login
            </motion.button>
          </Link>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-[0_0_30px_hsla(270,80%,60%,0.4)]"
            >
              Register
            </motion.button>
          </Link>
        </div>
      </nav>
    </motion.header>
  )
}
