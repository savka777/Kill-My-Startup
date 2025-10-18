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