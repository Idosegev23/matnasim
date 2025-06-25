export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Manager dashboard API called')
    
    // בדיקת אימות
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.payload) {
      console.log('❌ Token verification failed:', authResult.error)
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const decoded = authResult.payload
    console.log('✅ Token verified for:', decoded.email)

    // שליפת נתוני המשתמש
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      console.log('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // בדיקת הרשאות - רק מנהלים
    if (user.user_type !== 'manager') {
      console.log('❌ Access denied. User type:', user.user_type, 'Email:', decoded.email)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('✅ Manager access verified for:', decoded.email)

    // שליפת שאלונים
    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('questionnaires')
      .select(`
        id,
        category,
        title,
        description,
        questions (
          id,
          question_text,
          question_type,
          options,
          is_required
        )
      `)
      .order('category')

    if (questionnairesError) {
      console.log('❌ Error fetching questionnaires:', questionnairesError)
      return NextResponse.json({ error: 'Failed to fetch questionnaires' }, { status: 500 })
    }

    // שליפת התקדמות השאלונים
    const { data: completions, error: completionsError } = await supabase
      .from('questionnaire_completions')
      .select('*')
      .eq('user_id', user.id)

    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', user.id)

    // עיבוד הנתונים
    const processedQuestionnaires = (questionnaires || []).map(q => {
      const completion = completions?.find(c => c.questionnaire_id === q.id)
      const questionCount = q.questions?.length || 0
      const answeredCount = responses?.filter(r => 
        q.questions?.some(question => question.id === r.question_id)
      ).length || 0

      return {
        id: q.id,
        category: q.category,
        title: q.title,
        description: q.description,
        questionCount,
        answeredQuestions: answeredCount,
        progress: questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0,
        isCompleted: completion?.is_completed || false,
        estimatedTime: Math.ceil(questionCount * 1.5) // 1.5 דקות לשאלה
      }
    })

    console.log('✅ Manager dashboard data processed successfully')

    return NextResponse.json({
      success: true,
      user: {
        name: user.full_name,
        email: user.email,
        organization: user.organization_name
      },
      questionnaires: processedQuestionnaires,
      summary: {
        totalQuestionnaires: processedQuestionnaires.length,
        completedQuestionnaires: processedQuestionnaires.filter(q => q.isCompleted).length,
        averageProgress: Math.round(
          processedQuestionnaires.reduce((sum, q) => sum + q.progress, 0) / 
          (processedQuestionnaires.length || 1)
        )
      }
    })

  } catch (error) {
    console.error('❌ Manager dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 