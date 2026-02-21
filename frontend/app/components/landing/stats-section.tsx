"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const stats = [
    { value: "Escrow", label: "Protected Payments" },
    { value: "AI", label: "Hybrid Pricing" },
    { value: "72h", label: "Auto-Refund Expiry" },
    { value: "4.9★", label: "Student Rating" },
]

export function StatsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section ref={ref} className="relative z-10 px-6 py-20">
            <div className="mx-auto max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="overflow-hidden rounded-2xl border border-border/50 bg-card/20 backdrop-blur-xl"
                >
                    <div className="grid grid-cols-2 gap-px bg-border/20 lg:grid-cols-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                                className="flex flex-col items-center justify-center bg-card/30 px-6 py-10 backdrop-blur-sm"
                            >
                                <span
                                    className="bg-clip-text font-mono text-3xl font-bold text-transparent sm:text-4xl"
                                    style={{
                                        backgroundImage:
                                            "linear-gradient(135deg, hsl(270, 80%, 65%) 0%, hsl(330, 80%, 60%) 100%)",
                                    }}
                                >
                                    {stat.value}
                                </span>
                                <span className="mt-2 text-center text-sm text-muted-foreground">
                                    {stat.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
