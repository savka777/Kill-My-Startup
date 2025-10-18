"use client"
import Image from "next/image"

export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Kill My Startup logo"
              width={40}
              height={40}
              priority
              className="mix-blend-difference"
            />
            {/* <span className="text-lg font-medium text-white mix-blend-difference select-none">
              Kill My Startup
            </span> */}
          </div>
          <nav className="flex items-center gap-2">
            <a href="#how" className="px-3 py-1.5 text-sm text-white mix-blend-difference hover:opacity-80 transition-opacity">How it works</a>
            <a href="#why" className="px-3 py-1.5 text-sm text-white mix-blend-difference hover:opacity-80 transition-opacity">Why us</a>
            <a href="#pricing" className="px-3 py-1.5 text-sm text-white mix-blend-difference hover:opacity-80 transition-opacity">Pricing</a>
            {/* <a
              href="#get-started"
              className="ml-2 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-white mix-blend-difference transition-opacity"
              style={{ backgroundColor: "var(--brand-accent)" }}
            >
              Get Started
            </a> */}
          </nav>
        </div>
      </div>
    </header>
  )
}
