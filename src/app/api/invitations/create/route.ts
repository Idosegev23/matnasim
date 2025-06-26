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

    const { questionnaireId, managerEmail, managerName } = await request.json()

    if (!questionnaireId || !managerEmail || !managerName) {
      return NextResponse.json({ 
        error: 'Missing required fields: questionnaireId, managerEmail, managerName' 
      }, { status: 400 })
    }

    // בדיקה שהשאלון קיים - נחפש לפי ID או לפי קטגוריה
    let questionnaire = null
    let questionnaireError = null

    // אם questionnaireId הוא מספר, נחפש לפי ID
    if (!isNaN(Number(questionnaireId))) {
      const result = await supabase
        .from('questionnaires')
        .select('id, title, category')
        .eq('id', questionnaireId)
        .single()
      questionnaire = result.data
      questionnaireError = result.error
    } else {
      // אחרת, נחפש לפי קטגוריה
      const result = await supabase
        .from('questionnaires')
        .select('id, title, category')
        .eq('category', questionnaireId)
        .eq('is_active', true)
        .single()
      questionnaire = result.data
      questionnaireError = result.error
    }

    if (questionnaireError || !questionnaire) {
      console.log('❌ Questionnaire not found:', questionnaireError)
      return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 })
    }

    // יצירת טוקן ייחודי להזמנה
    const token = crypto.randomBytes(32).toString('hex')

    // שמירת ההזמנה במסד הנתונים
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        token,
        questionnaire_id: questionnaire.id,
        manager_email: managerEmail,
        manager_name: managerName,
        organization_name: decoded.organizationName || 'מתנ"ס',
        invited_by_user_id: decoded.userId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 ימים
        status: 'pending'
      })
      .select()
      .single()

    if (invitationError) {
      console.log('❌ Error creating invitation:', invitationError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    console.log('✅ Invitation created successfully')

    // יצירת קישור להזמנה
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/questionnaire/${questionnaire.category}?token=${token}`

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        managerEmail: invitation.manager_email,
        managerName: invitation.manager_name,
        questionnaire: {
          id: questionnaire.id,
          title: questionnaire.title,
          category: questionnaire.category
        },
        invitationLink,
        expiresAt: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('❌ Error in invitation creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 