"use client"

import { PropsWithChildren } from "react"
import { useInView } from "@/hooks/useInView"

type Props = PropsWithChildren<{
  className?: string
  delayMs?: number
}>

export function Reveal({ children, className = "", delayMs = 0 }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>()

  const style: React.CSSProperties = {
    transitionDelay: `${delayMs}ms`,
  }

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 will-change-transform ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  )
}

