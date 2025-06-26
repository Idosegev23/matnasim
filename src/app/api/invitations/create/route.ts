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

    // Check if invitation already exists for this email
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('manager_email', managerEmail.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      console.log('⚠️ Invitation already exists for this email')
      return NextResponse.json({ 
        error: 'Invitation already exists for this email',
        existingToken: existingInvitation.token
      }, { status: 409 })
    }

    // Try to get an existing questionnaire ID
    const { data: existingQuestionnaire } = await supabase
      .from('questionnaires')
      .select('id')
      .limit(1)
      .single()

    // Use existing questionnaire ID or create a temporary one
    let questionnaireId = existingQuestionnaire?.id

    // If no questionnaire exists, create a default one first
    if (!questionnaireId) {
      const { data: newQuestionnaire } = await supabase
        .from('questionnaires')
        .insert({
          title: 'מערכת השאלונים הכללית',
          category: 'general',
          description: 'שאלון כללי למערכת המתנסים',
          year: new Date().getFullYear(),
          is_active: true
        })
        .select('id')
        .single()
      
      questionnaireId = newQuestionnaire?.id
    }

    // Insert invitation into database with valid questionnaire_id
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        token: invitationToken,
        questionnaire_id: questionnaireId,
        manager_email: managerEmail.toLowerCase(),
        manager_name: managerName,
        organization_name: authResult.payload.organizationName || 'TriRoars Development',
        deadline: deadline,
        created_by: userId,
        status: 'pending'
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
        email: data.manager_email,
        token: data.token,
        deadline: data.deadline,
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