import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, createBroadcast } from '@/lib/broadcasts'

export async function POST(req: NextRequest) {
  try {
    const { title, body, sentBy, channels } = await req.json()

    // Validate required fields
    if (!title || !body || !sentBy) {
      return NextResponse.json({ 
        error: 'Title, body, and sentBy are required' 
      }, { status: 400 })
    }

    // Validate admin status
    if (!isAdmin(sentBy)) {
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required' 
      }, { status: 403 })
    }

    // Validate channels
    const validChannels = ['telegram', 'email']
    const selectedChannels = channels || ['telegram', 'email']
    
    if (!Array.isArray(selectedChannels) || 
        selectedChannels.length === 0 || 
        !selectedChannels.every(c => validChannels.includes(c))) {
      return NextResponse.json({ 
        error: 'Invalid channels. Must be array with telegram and/or email' 
      }, { status: 400 })
    }

    // Create broadcast
    const broadcastId = await createBroadcast(title, body, sentBy, selectedChannels)

    if (!broadcastId) {
      return NextResponse.json({ 
        error: 'Failed to create broadcast' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      broadcastId,
      message: 'Broadcast queued successfully'
    })

  } catch (error) {
    console.error('Broadcast creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}