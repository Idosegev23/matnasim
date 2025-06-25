export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin dashboard API called')
    
    // בדיקת אימות
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.payload) {
      console.log('❌ Token verification failed:', authResult.error)
      return NextResponse.json({ message: 'לא מורשה לגשת לעמוד זה' }, { status: 401 })
    }

    const payload = authResult.payload
    console.log('✅ Token verified for:', payload.email, 'Type:', payload.userType)

    // בדיקת הרשאות אדמין
    if (payload.userType !== 'admin') {
      console.log('❌ Access denied. User type:', payload.userType, 'Email:', payload.email)
      return NextResponse.json({ message: 'אין הרשאה לגשת לעמוד זה' }, { status: 403 })
    }

    console.log('✅ Admin access verified for:', payload.email)

    // שליפת נתוני האדמין
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .eq('user_type', 'admin')
      .single()

    if (adminError || !admin) {
      console.log('❌ Admin not found:', adminError)
      return NextResponse.json({ message: 'משתמש לא נמצא' }, { status: 404 })
    }

    // שליפת סטטיסטיקות למערכת
    const { data: managers, error: managersError } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'manager')

    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('questionnaires')
      .select('id')

    const { data: completions, error: completionsError } = await supabase
      .from('questionnaire_completions')
      .select('id')
      .eq('is_completed', true)

    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('✅ Admin dashboard data retrieved successfully')

    return NextResponse.json({
      success: true,
      admin: {
        name: admin.full_name,
        email: admin.email,
        organization: admin.organization_name
      },
      stats: {
        totalManagers: managers?.length || 0,
        totalQuestionnaires: questionnaires?.length || 0,
        completedQuestionnaires: completions?.length || 0,
        recentInvitations: invitations?.length || 0
      },
      recentActivity: invitations || []
    })

  } catch (error) {
    console.error('❌ Admin dashboard error:', error)
    return NextResponse.json({ message: 'שגיאה בטעינת נתוני הדשבורד' }, { status: 500 })
  }
} 