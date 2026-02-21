"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function LandingNavbar() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            <motion.header
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-0 right-0 top-0 z-50 h-16 border-b"
                style={{
                    borderColor: "hsla(217, 33%, 18%, 0.4)",
                    background: "hsla(222, 47%, 5%, 0.85)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                }}
            >
                <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt="FreeHour logo"
                            width={36}
                            height={36}
                            className="h-9 w-9 object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsla(270,80%,60%,0.6)]"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <span
                            className="font-mono text-lg font-bold tracking-tight"
                            style={{ color: "hsl(var(--foreground))" }}
                        >
                            FreeHour
                        </span>
                    </Link>

                    {/* Desktop buttons */}
                    <div className="hidden sm:flex items-center gap-3">
                        <Link href="/login">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="rounded-lg px-5 py-2 text-sm font-medium transition-all duration-300"
                                style={{
                                    border: "1px solid hsla(217, 33%, 18%, 1)",
                                    background: "hsla(217, 33%, 12%, 0.5)",
                                    color: "hsl(var(--foreground))",
                                }}
                            >
                                Login
                            </motion.button>
                        </Link>
                        <Link href="/register">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="rounded-lg px-5 py-2 text-sm font-medium transition-all duration-300"
                                style={{
                                    background: "linear-gradient(135deg, hsl(270, 80%, 55%) 0%, hsl(300, 70%, 50%) 100%)",
                                    color: "white",
                                    boxShadow: "0 0 20px hsla(270, 80%, 60%, 0.2)",
                                }}
                            >
                                Register
                            </motion.button>
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="sm:hidden flex flex-col gap-1.5 p-2"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <motion.span
                            animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                            className="block h-0.5 w-5 rounded-full"
                            style={{ background: "hsl(var(--foreground))" }}
                        />
                        <motion.span
                            animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                            className="block h-0.5 w-5 rounded-full"
                            style={{ background: "hsl(var(--foreground))" }}
                        />
                        <motion.span
                            animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                            className="block h-0.5 w-5 rounded-full"
                            style={{ background: "hsl(var(--foreground))" }}
                        />
                    </button>
                </div>
            </motion.header>

            {/* Mobile menu dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed left-0 right-0 top-16 z-40 overflow-hidden sm:hidden"
                        style={{
                            background: "hsla(222, 47%, 5%, 0.97)",
                            borderBottom: "1px solid hsla(217, 33%, 18%, 0.4)",
                        }}
                    >
                        <div className="flex flex-col gap-3 px-6 py-5">
                            <Link href="/login" onClick={() => setMobileOpen(false)}>
                                <button
                                    className="w-full rounded-lg px-5 py-2.5 text-sm font-medium text-left transition-all duration-200"
                                    style={{
                                        border: "1px solid hsla(217, 33%, 18%, 1)",
                                        background: "hsla(217, 33%, 12%, 0.5)",
                                        color: "hsl(var(--foreground))",
                                    }}
                                >
                                    Login
                                </button>
                            </Link>
                            <Link href="/register" onClick={() => setMobileOpen(false)}>
                                <button
                                    className="w-full rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                                    style={{
                                        background: "linear-gradient(135deg, hsl(270, 80%, 55%) 0%, hsl(300, 70%, 50%) 100%)",
                                        color: "white",
                                    }}
                                >
                                    Register
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
