"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Zap, Shield, BarChart3, Clock, Users, Layers } from "lucide-react"

const features = [
    {
        icon: Clock,
        title: "AI Pricing Engine",
        description:
            "Hybrid AI pricing automatically sets fair rates based on category, complexity, demand, and market conditions.",
    },
    {
        icon: Zap,
        title: "Escrow Protection",
        description:
            "Funds are locked in escrow at task creation and only released to workers after client approval. Zero risk.",
    },
    {
        icon: Shield,
        title: "Verified Students",
        description:
            "College email verification ensures you work with real, trusted students from verified institutions.",
    },
    {
        icon: BarChart3,
        title: "Reputation System",
        description:
            "Build your reliability score with every completed task. Earn badges and unlock higher-tier opportunities.",
    },
    {
        icon: Users,
        title: "Real-Time Chat",
        description:
            "Inquiry-based chat system lets clients and workers coordinate before and during task execution.",
    },
    {
        icon: Layers,
        title: "Weekly Cap",
        description:
            "Smart weekly hour limit keeps student work-life balance healthy while ensuring consistent quality.",
    },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
}

export function FeaturesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section ref={ref} className="relative z-10 px-6 py-32">
            <div className="mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Platform Features
                    </span>
                    <h2 className="mt-4 text-balance font-mono text-3xl font-bold text-foreground sm:text-4xl">
                        Built for trust. Designed for students.
                    </h2>
                    <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
                        Every feature is engineered to protect workers, ensure fair payment, and keep the economy honest.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={feature.title}
                                variants={cardVariants}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-card/50 hover:shadow-[0_0_40px_hsla(270,80%,60%,0.08)]"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/15 group-hover:shadow-[0_0_20px_hsla(270,80%,60%,0.2)]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 font-mono text-sm font-semibold text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {feature.description}
                                </p>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}
