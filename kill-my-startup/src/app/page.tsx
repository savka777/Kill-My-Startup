"use client"

import { ShaderAnimation } from "@/components/ShaderAnimation"
import Prism from "@/components/Prism"
import { Header } from "@/components/Header"
import { Reveal } from "@/components/Reveal"
import { GlowingEffect } from "@/components/GlowingEffect"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import Link from "next/link"

export default function Page() {
  return (
    <>
      <Header />

      {/* Hero: animated background */}
      <section className="relative w-full h-screen">
        <ShaderAnimation />
        {/* <Prism /> */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto -translate-y-8 text-center px-4">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="text-white/80 mix-blend-difference text-sm md:text-base">
                Reality check for founders
              </span>
              <span className="text-[10px] md:text-xs uppercase tracking-wide text-black bg-white/90 mix-blend-difference rounded-full px-2.5 py-1">
                Powered by Perplexity
              </span>
            </div>
            <h1 className="text-white mix-blend-difference text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight">
              whose killing your startup?
            </h1>
            <p className="mt-4 text-white/90 mix-blend-difference text-lg md:text-2xl font-medium">
              Real-time industry intelligence and competitor tracking
            </p>
            <div className="mt-8 flex justify-center">
              <SignedOut>
                <SignInButton mode="redirect" forceRedirectUrl="/intake">
                  <button className="inline-flex items-center rounded-full bg-white text-black border border-black px-6 py-2 text-sm md:text-base font-medium hover:bg-white/90 transition-colors">
                    Get Started
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-full bg-white text-black border border-black px-6 py-2 text-sm md:text-base font-medium hover:bg-white/90 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main>
        {/* CTA strip */}
        <section id="get-started" className="bg-black text-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <Reveal className="text-center">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                Filter noise, find answers, repeat.
              </h2>
              <p className="mt-4 text-base md:text-lg text-white/60">
                Live updates every 24 hours so you're never behind on your industry.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <SignedOut>
                  <SignInButton mode="redirect" forceRedirectUrl="/intake">
                    <button className="inline-flex items-center rounded-full bg-white text-black border border-black px-6 py-2 text-sm font-medium hover:bg-white/90 transition-colors">
                      Get Started
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-full bg-white text-black border border-black px-6 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </SignedIn>
                <a className="px-6 py-2 text-sm font-medium underline underline-offset-4 decoration-white/30 hover:decoration-white" href="#how">
                  Learn more
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Alternating feature blocks */}
        <section id="how" className="bg-black text-white">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <Reveal className="order-2 md:order-1">
                <h3 className="text-2xl md:text-4xl font-semibold">Cut through the noise</h3>
                <p className="mt-4 text-white/60">
                  Real-time news related to your industry and what you're building.
                </p>
              </Reveal>
              <Reveal className="order-1 md:order-2">
                <div className="relative h-64 md:h-80 w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  <GlowingEffect variant="white" glow proximity={160} inactiveZone={0.2} blur={12} borderWidth={1} movementDuration={0.9} disabled={false} />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-black text-white">
          <div className="mx-auto max-w-6xl px-6 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <Reveal>
                <div className="relative h-64 md:h-80 w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  <GlowingEffect variant="white" glow proximity={160} inactiveZone={0.2} blur={12} borderWidth={1} movementDuration={0.9} disabled={false} />
                </div>
              </Reveal>
              <Reveal>
                <h3 className="text-2xl md:text-4xl font-semibold">Focus like a pro</h3>
                <p className="mt-4 text-white/60">
                  View real-time competitors in your industry and track their moves.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-black text-white">
          <div className="mx-auto max-w-6xl px-6 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <Reveal className="order-2 md:order-1">
                <h3 className="text-2xl md:text-4xl font-semibold">Get the sentiment that matters</h3>
                <p className="mt-4 text-white/60">
                  Track social conversations and market sentiment around your industry and competitors.
                </p>
              </Reveal>
              <Reveal className="order-1 md:order-2">
                <div className="relative h-64 md:h-80 w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  <GlowingEffect variant="white" glow proximity={160} inactiveZone={0.2} blur={12} borderWidth={1} movementDuration={0.9} disabled={false} />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-black text-white">
          <div className="mx-auto max-w-6xl px-6 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <Reveal>
                <div className="relative h-64 md:h-80 w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  <GlowingEffect variant="white" glow proximity={160} inactiveZone={0.2} blur={12} borderWidth={1} movementDuration={0.9} disabled={false} />
                </div>
              </Reveal>
              <Reveal>
                <h3 className="text-2xl md:text-4xl font-semibold">Collaborate, email results</h3>
                <p className="mt-4 text-white/60">
                  Updates every 24hrs, share with your founders and team effortlessly.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="pricing" className="bg-black text-white">
          <div className="mx-auto max-w-5xl px-6 pb-28">
            <Reveal className="relative overflow-hidden rounded-2xl border border-white/10 p-10 md:p-14 text-center bg-white/5">
              <GlowingEffect variant="white" glow proximity={160} inactiveZone={0.2} blur={14} borderWidth={1} movementDuration={0.9} disabled={false} />
              <h3 className="text-2xl md:text-4xl font-semibold">Ready to ship with clarity?</h3>
              <p className="mt-3 text-white/60">Start free. Upgrade when it hurts to stop.</p>
              <div className="mt-6 flex justify-center">
                <SignedOut>
                  <SignInButton mode="redirect" forceRedirectUrl="/intake">
                    <button className="inline-flex items-center rounded-full bg-white text-black border border-black px-6 py-2 text-sm font-medium hover:bg-white/90 transition-colors">
                      Get Started
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-full bg-white text-black border border-black px-6 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </SignedIn>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  )
}




