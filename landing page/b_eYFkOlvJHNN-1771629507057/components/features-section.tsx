"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Zap, Shield, BarChart3, Clock, Users, Layers } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Smart Scheduling",
    description:
      "Intelligently organize your free hours with AI-powered suggestions tailored to your preferences.",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "Real-time synchronization across all your devices. Your schedule is always up to date.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "End-to-end encryption keeps your data safe. We never sell your information to third parties.",
  },
  {
    icon: BarChart3,
    title: "Time Analytics",
    description:
      "Get deep insights into how you spend your free time with beautiful visual reports.",
  },
  {
    icon: Users,
    title: "Team Coordination",
    description:
      "Find overlapping free hours with friends and colleagues for effortless meetups.",
  },
  {
    icon: Layers,
    title: "Seamless Integration",
    description:
      "Connect with Google Calendar, Outlook, and 50+ other tools you already use.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
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
            Features
          </span>
          <h2 className="mt-4 text-balance font-mono text-3xl font-bold text-foreground sm:text-4xl">
            Everything you need to own your time
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
            Powerful tools designed to help you discover, plan, and maximize
            every free moment.
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
