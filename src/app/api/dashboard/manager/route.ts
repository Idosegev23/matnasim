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
      const progressPercentage = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0

      let status: 'not_started' | 'in_progress' | 'completed'
      if (completion?.is_completed) {
        status = 'completed'
      } else if (answeredCount > 0) {
        status = 'in_progress'
      } else {
        status = 'not_started'
      }

      return {
        id: q.id,
        category: q.category,
        title: q.title,
        description: q.description,
        year: new Date().getFullYear(),
        progress_percentage: progressPercentage,
        is_completed: completion?.is_completed || false,
        completed_at: completion?.completed_at || null,
        updated_at: completion?.updated_at || null,
        question_count: questionCount,
        answered_count: answeredCount,
        estimated_minutes: Math.ceil(questionCount * 1.5),
        status,
        // Keep backward compatibility
        questionCount,
        answeredQuestions: answeredCount,
        progress: progressPercentage,
        isCompleted: completion?.is_completed || false,
        estimatedTime: Math.ceil(questionCount * 1.5)
      }
    })

    console.log('✅ Manager dashboard data processed successfully')

    const completedCount = processedQuestionnaires.filter(q => q.isCompleted).length
    const inProgressCount = processedQuestionnaires.filter(q => q.progress > 0 && !q.isCompleted).length
    const notStartedCount = processedQuestionnaires.filter(q => q.progress === 0).length
    const totalQuestions = processedQuestionnaires.reduce((sum, q) => sum + q.questionCount, 0)
    const answeredQuestions = processedQuestionnaires.reduce((sum, q) => sum + q.answeredQuestions, 0)
    const overallProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    const estimatedRemainingMinutes = processedQuestionnaires.reduce((sum, q) => {
      const remaining = q.questionCount - q.answeredQuestions
      return sum + (remaining * 1.5)
    }, 0)

    return NextResponse.json({
      success: true,
      user: {
        name: user.full_name,
        email: user.email,
        organization: user.organization_name,
        user_type: user.user_type
      },
      questionnaires: processedQuestionnaires,
      stats: {
        total: processedQuestionnaires.length,
        completed: completedCount,
        in_progress: inProgressCount,
        not_started: notStartedCount,
        overall_progress: overallProgress,
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        estimated_remaining_minutes: Math.round(estimatedRemainingMinutes)
      },
      year: new Date().getFullYear()
    })

  } catch (error) {
    console.error('❌ Manager dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 