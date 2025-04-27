import { type NextRequest, NextResponse } from "next/server"

// In-memory message store (in a real app, this would be a database)
// Messages are only stored temporarily until they are delivered
let messageStore: {
  id: string
  from: string
  to: string
  encryptedContent: string
  timestamp: Date
  delivered: boolean
}[] = []

export async function POST(request: NextRequest) {
  try {
    const { from, to, encryptedContent } = await request.json()

    if (!from || !to || !encryptedContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Store the message temporarily
    const message = {
      id: Date.now().toString(),
      from,
      to,
      encryptedContent,
      timestamp: new Date(),
      delivered: false,
    }

    messageStore.push(message)

    return NextResponse.json({
      success: true,
      messageId: message.id,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Find messages for this user
    const userMessages = messageStore.filter((msg) => msg.to === userId && !msg.delivered)

    // Mark messages as delivered
    messageStore = messageStore.map((msg) => (msg.to === userId && !msg.delivered ? { ...msg, delivered: true } : msg))

    // In a real app, we would schedule these messages for deletion after confirmation

    return NextResponse.json({
      messages: userMessages.map((msg) => ({
        id: msg.id,
        from: msg.from,
        encryptedContent: msg.encryptedContent,
        timestamp: msg.timestamp,
      })),
    })
  } catch (error) {
    console.error("Error retrieving messages:", error)
    return NextResponse.json({ error: "Failed to retrieve messages" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const messageId = url.searchParams.get("messageId")

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 })
    }

    // Remove the message from the store
    messageStore = messageStore.filter((msg) => msg.id !== messageId)

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
