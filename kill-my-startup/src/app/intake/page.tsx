import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { IntakeForm } from "@/components/intake-form"

export default async function IntakePage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Check if user has already completed intake
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { hasCompletedIntake: true }
  })

  if (user?.hasCompletedIntake) {
    redirect("/dashboard")
  }

  return <IntakeForm />
}

