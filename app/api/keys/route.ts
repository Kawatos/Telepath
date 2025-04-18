import { type NextRequest, NextResponse } from "next/server"

// In-memory key store (in a real app, this would be a database)
let keyStore: {
  userId: string
  keyId: string
  publicKey: string
  createdAt: Date
}[] = []

export async function POST(request: NextRequest) {
  try {
    const { userId, publicKey } = await request.json()

    if (!userId || !publicKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const keyId = Date.now().toString()

    // Store the public key
    keyStore.push({
      userId,
      keyId,
      publicKey,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      keyId,
    })
  } catch (error) {
    console.error("Error registering key:", error)
    return NextResponse.json({ error: "Failed to register key" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Find keys for this user
    const userKeys = keyStore.filter((key) => key.userId === userId)

    return NextResponse.json({
      keys: userKeys.map((key) => ({
        keyId: key.keyId,
        publicKey: key.publicKey,
        createdAt: key.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error retrieving keys:", error)
    return NextResponse.json({ error: "Failed to retrieve keys" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const keyId = url.searchParams.get("keyId")

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 })
    }

    // Remove the key from the store
    keyStore = keyStore.filter((key) => key.keyId !== keyId)

    return NextResponse.json({
      success: true,
      message: "Key deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting key:", error)
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 })
  }
}
