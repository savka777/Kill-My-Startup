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

    // Trigger competitor discovery in the background for the user's industry
    // Use setTimeout to avoid blocking the response and handle it asynchronously
    setTimeout(async () => {
      try {
        console.log(`Triggering competitor discovery for ${validatedData.industry} industry`)
        
        // Import competitor cache to check if discovery is needed
        const { CompetitorCache } = await import('@/lib/competitor-cache')
        
        // Check if we already have recent competitors for this industry
        const cachedCompetitors = await CompetitorCache.getCachedCompetitors({
          industry: validatedData.industry,
          context: validatedData.startupDescription,
          userInfo: validatedData.startupName,
          ttlHours: 12
        })

        // Only trigger discovery if no recent cached data exists
        if (!cachedCompetitors || cachedCompetitors.competitors.length === 0) {
          // Make the API call in a non-blocking way
          const baseUrl = process.env.NEXTAUTH_URL || 
                         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          const response = await fetch(`${baseUrl}/api/competitors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              industry: validatedData.industry,
              context: validatedData.startupDescription,
              userInfo: validatedData.startupName,
              max_results: 8,
              forceRefresh: false,
              updateType: 'discovery'
            })
          })
          
          if (response.ok) {
            console.log(`Successfully triggered competitor discovery for ${validatedData.industry}`)
          } else {
            console.warn('Failed to trigger competitor discovery:', await response.text())
          }
        } else {
          console.log(`Using existing cached competitors for ${validatedData.industry}`)
        }
      } catch (error) {
        console.warn('Error in background competitor discovery:', error)
      }
    }, 100) // Small delay to ensure response is sent first

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