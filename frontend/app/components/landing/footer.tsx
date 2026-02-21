"use client"

import { motion } from "framer-motion"

export function LandingFooter() {
    return (
        <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative z-10 border-t border-border/30 px-6 py-12"
        >
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.png"
                        alt="FreeHour logo"
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="font-mono text-sm font-bold text-foreground">FreeHour</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span className="cursor-pointer transition-colors hover:text-foreground">Privacy</span>
                    <span className="cursor-pointer transition-colors hover:text-foreground">Terms</span>
                    <span className="cursor-pointer transition-colors hover:text-foreground">Contact</span>
                </div>
                <p className="text-xs text-muted-foreground/50">
                    © 2026 FreeHour. All rights reserved.
                </p>
            </div>
        </motion.footer>
    )
}
