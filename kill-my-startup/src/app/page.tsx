"use client"

import { ShaderAnimation } from "@/components/ShaderAnimation"
import { Header } from "@/components/Header"
import { Reveal } from "@/components/Reveal"

export default function Page() {
  return (
    <>
      <Header />

      {/* Hero: animated background */}
      <section className="relative w-full h-screen">
        <ShaderAnimation />
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto -translate-y-8 text-center px-4">
            <h1 className="text-white mix-blend-difference text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight">
              whose killing your startup?
            </h1>
            <p className="mt-4 text-white mix-blend-difference text-lg md:text-2xl font-medium">
              powered by perplexity search
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="#get-started"
                className="inline-flex items-center rounded-full bg-white text-black px-6 py-2 text-sm md:text-base font-medium hover:bg-white/90 transition-colors"
              >
                Get Started →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main>
        {/* CTA strip */}
        <section id="get-started" className="bg-white text-black">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <Reveal className="text-center">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                Find answers, not noise.
              </h2>
              <p className="mt-4 text-base md:text-lg" style={{ color: "var(--brand-muted)" }}>
                A crisp lens on focus, velocity, and what actually moves the needle.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <a className="rounded-full text-white px-6 py-2 text-sm font-medium hover:opacity-90 transition-opacity" style={{ backgroundColor: "var(--brand-accent)" }} href="#pricing">
                  Get Started
                </a>
                <a className="px-6 py-2 text-sm font-medium underline underline-offset-4 decoration-black/30 hover:decoration-black" href="#how">
                  Learn more
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Alternating feature blocks */}
        <section id="how" className="bg-white text-black">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <Reveal className="order-2 md:order-1">
                <h3 className="text-2xl md:text-4xl font-semibold">Cut through the noise</h3>
                <p className="mt-4" style={{ color: "var(--brand-muted)" }}>
                  Pinpoint distractions. Replace meetings with decisive moves.
                </p>
              </Reveal>
              <Reveal className="order-1 md:order-2">
                <div className="h-64 md:h-80 w-full rounded-xl bg-[#f5f5f5]" />
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-white text-black">
          <div className="mx-auto max-w-6xl px-6 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <Reveal>
                <div className="h-64 md:h-80 w-full rounded-xl bg-[#f5f5f5]" />
              </Reveal>
              <Reveal>
                <h3 className="text-2xl md:text-4xl font-semibold">Focus like a pro</h3>
                <p className="mt-4" style={{ color: "var(--brand-muted)" }}>
                  Clear priorities. Crisp feedback. Momentum that compounds.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="pricing" className="bg-white text-black">
          <div className="mx-auto max-w-5xl px-6 pb-28">
            <Reveal className="rounded-2xl border border-black/10 p-10 md:p-14 text-center">
              <h3 className="text-2xl md:text-4xl font-semibold">Ready to ship with clarity?</h3>
              <p className="mt-3" style={{ color: "var(--brand-muted)" }}>Start free. Upgrade when it hurts to stop.</p>
              <div className="mt-6 flex justify-center">
                <a className="rounded-full text-white px-6 py-2 text-sm font-medium hover:opacity-90 transition-opacity" style={{ backgroundColor: "var(--brand-accent)" }} href="#get-started">
                  Get Started
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  )
}
