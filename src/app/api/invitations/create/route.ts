import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Creating invitation...')

    // בדיקת אימות
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = authResult.payload
    console.log('✅ Token verified for user:', decoded.userId)

    // בדיקת הרשאות אדמין
    if (decoded.userType !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 })
    }

    const { managerEmail, managerName, deadline } = await request.json()

    if (!managerEmail || !managerName) {
      return NextResponse.json({ 
        error: 'Missing required fields: managerEmail, managerName' 
      }, { status: 400 })
    }

    // יצירת טוקן ייחודי להזמנה
    const token = crypto.randomBytes(32).toString('hex')

    // בדיקה אם קיימת הזמנה קודמת למנהל זה
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', managerEmail)
      .single()

    if (existingInvitation) {
      console.log('⚠️ Invitation already exists')
      return NextResponse.json({ 
        error: 'Invitation already exists for this manager' 
      }, { status: 409 })
    }

    // שמירת ההזמנה במסד הנתונים - גישה לכל השאלונים
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email: managerEmail,
        invited_by: decoded.userId,
        invited_to_role: 'viewer', // או 'manager' אם קיים
        invitation_token: token,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 ימים
        status: 'pending',
        message: `הזמנה למנהל ${managerName} למילוי שאלונים שנתיים`
      })
      .select()
      .single()

    if (invitationError) {
      console.log('❌ Error creating invitation:', invitationError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    console.log('✅ Invitation created successfully')

    // יצירת קישור להזמנה - גישה לכל השאלונים דרך הדשבורד
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/dashboard?token=${token}`

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.invitation_token,
        managerEmail: invitation.email,
        managerName: managerName,
        invitationLink,
        message: 'הזמנה לגישה לכל השאלונים במערכת'
      }
    })

  } catch (error) {
    console.error('❌ Error in invitation creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 