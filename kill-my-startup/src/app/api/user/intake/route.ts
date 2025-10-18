import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const IntakeSchema = z.object({
  startupName: z.string().min(1, "Startup name is required"),
  startupDescription: z.string().min(1, "Description is required"),
  industry: z.string().min(1, "Industry is required"),
  stage: z.enum(["IDEA", "VALIDATING", "BUILDING_MVP", "LAUNCHED", "SCALING", "ESTABLISHED"]),
  teamSize: z.number().min(1),
  monthlyRevenue: z.string(),
  fundingRaised: z.string(),
  targetMarket: z.string().min(1, "Target market is required"),
  keyCompetitors: z.array(z.string()).min(1, "At least one competitor is required"),
  primaryGoals: z.array(z.string()).min(1, "At least one goal is required"),
  alertKeywords: z.array(z.string()).min(1, "At least one keyword is required"),
  website: z.string().optional(),
  linkedinUrl: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional()
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = IntakeSchema.parse(body)

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      // Create user if doesn't exist
      const clerkUser = await currentUser()
      
      if (!clerkUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName
        }
      })
    }

    // Create user profile
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        startupName: validatedData.startupName,
        startupDescription: validatedData.startupDescription,
        industry: validatedData.industry,
        stage: validatedData.stage,
        teamSize: validatedData.teamSize,
        monthlyRevenue: validatedData.monthlyRevenue,
        fundingRaised: validatedData.fundingRaised,
        targetMarket: validatedData.targetMarket,
        keyCompetitors: validatedData.keyCompetitors,
        primaryGoals: validatedData.primaryGoals,
        alertKeywords: validatedData.alertKeywords,
        website: validatedData.website || null,
        linkedinUrl: validatedData.linkedinUrl || null,
        location: validatedData.location || null,
        timezone: validatedData.timezone || null
      }
    })

    // Mark intake as completed
    await prisma.user.update({
      where: { id: user.id },
      data: { hasCompletedIntake: true }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Intake completed successfully",
      profile 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error processing intake:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}