import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Creating invitation...')
    
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.payload) {
      console.log('❌ Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userType, userId } = authResult.payload
    
    // Check if user is admin
    if (userType !== 'admin') {
      console.log('❌ Access denied - not admin')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse request body
    const { managerEmail, managerName, deadline } = await request.json()
    console.log('📝 Request data:', { managerEmail, managerName, deadline })

    if (!managerEmail || !managerName || !deadline) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ 
        error: 'Missing required fields: managerEmail, managerName, deadline' 
      }, { status: 400 })
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    console.log('🔑 Generated invitation token')

    // Calculate expiration date from deadline
    const expiresAt = new Date(deadline)
    console.log('⏰ Invitation expires at:', expiresAt.toISOString())

    // Store user details as JSON
    const userDetails = {
      managerName,
      invitedFor: 'questionnaire_system'
    }

    // Insert invitation into database with exact schema
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email: managerEmail.toLowerCase(), // Store email in lowercase
        invited_by: userId,
        invited_to_role: 'super_admin', // Use 'super_admin' - the valid enum value
        invited_to_projects: null, // No specific projects for questionnaire system
        status: 'pending',
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        user_details: userDetails,
        message: `You have been invited to access the questionnaire system by ${authResult.payload.fullName}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.log('❌ Error creating invitation:', error)
      return NextResponse.json({ 
        error: 'Failed to create invitation',
        details: error 
      }, { status: 500 })
    }

    console.log('✅ Invitation created successfully:', data.id)

    return NextResponse.json({
      success: true,
      invitation: {
        id: data.id,
        email: data.email,
        token: data.invitation_token,
        expiresAt: data.expires_at,
        status: data.status
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 