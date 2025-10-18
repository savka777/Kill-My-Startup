import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { profile: true }
    })

    if (!user) {
      // Create user if doesn't exist
      const clerkUser = await currentUser()
      
      if (!clerkUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const newUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName
        },
        include: { profile: true }
      })

      return NextResponse.json({ user: newUser })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { startupName, description, industry, keywords } = await req.json()
    
    if (!startupName) {
      return NextResponse.json({ error: 'startupName is required' }, { status: 400 })
    }

    // Get user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { profile: true }
    })

    if (!user || !user.profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Try to find existing project for this user
    let project = await prisma.project.findFirst({
      where: {
        name: startupName
      }
    })

    // If not found, create a new project
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: startupName,
          description: description || `Social media tracking for ${startupName}`,
          keywords: keywords || [startupName]
        }
      })
    } else {
      // Update existing project with latest user data
      project = await prisma.project.update({
        where: { id: project.id },
        data: {
          description: description || project.description,
          keywords: keywords || project.keywords
        }
      })
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        keywords: project.keywords
      }
    })

  } catch (error) {
    console.error('Error creating/getting user project:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}