"use client"

import { useMemo, useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"

type Question = {
  id: string
  label: string
  type: "text" | "textarea" | "select"
  placeholder?: string
  options?: string[]
}

const QUESTIONS: Question[] = [
  { id: "startupName", label: "What's your startup name?", type: "text", placeholder: "e.g., Kill My Startup" },
  { id: "startupDescription", label: "What are you building?", type: "textarea", placeholder: "Briefly describe your startup idea..." },
  { id: "industry", label: "What industry are you in?", type: "select", options: [
    "AI/Machine Learning", "SaaS/Software", "E-commerce", "FinTech", "HealthTech", 
    "EdTech", "MarTech", "PropTech", "CleanTech", "BioTech", "Gaming", 
    "Social Media", "Consumer Apps", "Enterprise Software", "Hardware/IoT", "Other"
  ]},
  { id: "stage", label: "What stage are you at?", type: "select", options: ["Idea", "Validating", "Building MVP", "Launched", "Scaling", "Established"] },
  { id: "targetMarket", label: "Who is your target market?", type: "textarea", placeholder: "Describe your ideal customers..." }
]

export function IntakeForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const total = QUESTIONS.length
  const progress = useMemo(() => Math.round(((step) / total) * 100), [step, total])
  const q = QUESTIONS[step]

  const canNext = Boolean(answers[q?.id ?? ""]?.trim?.() || (q?.type === "select" && answers[q.id]))

  const handleNext = async () => {
    if (step < total - 1) {
      setStep((s) => s + 1)
    } else {
      // Submit form
      setLoading(true)
      try {
        // Transform answers to match API format
        const formData = {
          startupName: answers.startupName || "",
          startupDescription: answers.startupDescription || "",
          industry: answers.industry || "",
          stage: mapStageToEnum(answers.stage || ""),
          teamSize: 1, // Default value
          monthlyRevenue: "$0", // Default value
          fundingRaised: "None", // Default value
          targetMarket: answers.targetMarket || "",
          keyCompetitors: ["TBD"], // We'll identify competitors for them
          primaryGoals: ["Market Intelligence"], // Default goal
          alertKeywords: [answers.startupName || "startup"], // Use startup name as keyword
          website: "",
          linkedinUrl: "",
          location: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }

        const response = await fetch("/api/user/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })

        console.log("Submitting form data:", formData)
        console.log("Response status:", response.status)
        
        if (response.ok) {
          router.push("/dashboard")
        } else {
          const errorText = await response.text()
          console.error("Failed to submit intake form. Status:", response.status)
          console.error("Response text:", errorText)
          
          try {
            const errorData = JSON.parse(errorText)
            console.error("Error data:", errorData)
          } catch {
            console.error("Could not parse error response as JSON")
          }
          
          alert("Failed to save your information. Please try again.")
        }
      } catch (error) {
        console.error("Error submitting intake form:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const mapStageToEnum = (stage: string) => {
    const stageMap: Record<string, string> = {
      "Idea": "IDEA",
      "Validating": "VALIDATING", 
      "Building MVP": "BUILDING_MVP",
      "Launched": "LAUNCHED",
      "Scaling": "SCALING",
      "Established": "ESTABLISHED"
    }
    return stageMap[stage] || "IDEA"
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (canNext && !loading) handleNext()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [canNext, loading])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Heading */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Welcome to Kill My Startup</h1>
          <p className="text-white/60 text-sm md:text-base mt-1">Real-time market intelligence for founders.</p>
        </header>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-white/60">Step {step + 1} of {total}</div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <label className="block text-lg md:text-xl font-medium">{q.label}</label>
              <div className="mt-4">
                {q.type === "text" && (
                  <input
                    autoFocus
                    type="text"
                    placeholder={q.placeholder}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    className="w-full rounded-lg bg-black text-white border border-white/15 px-4 py-3 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                )}

                {q.type === "textarea" && (
                  <textarea
                    placeholder={q.placeholder}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    rows={5}
                    className="w-full rounded-lg bg-black text-white border border-white/15 px-4 py-3 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                )}

                {q.type === "select" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {q.options!.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`rounded-lg px-3 py-2 text-sm border transition-colors ${
                          answers[q.id] === opt
                            ? "bg-white text-black border-white"
                            : "bg-black text-white border-white/15 hover:border-white/40"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="rounded-full px-5 py-2 text-sm border border-white/20 text-white/80 hover:text-white hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canNext || loading}
                  className="rounded-full px-6 py-2 text-sm bg-white text-black font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Setting up..." : step < total - 1 ? "Next" : "Complete Setup"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}