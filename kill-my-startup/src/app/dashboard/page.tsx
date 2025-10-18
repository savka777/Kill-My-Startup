import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Get user and check if they've completed intake
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true }
  })

  if (!user || !user.hasCompletedIntake) {
    redirect("/intake")
  }

  return <DashboardClient user={user} />
}


