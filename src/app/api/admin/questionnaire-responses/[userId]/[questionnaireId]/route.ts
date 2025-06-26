export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; questionnaireId: string } }
) {
  try {
    console.log('📋 Admin questionnaire responses API called for user:', params.userId, 'questionnaire:', params.questionnaireId)
    
    // בדיקת אימות
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.payload) {
      console.log('❌ Token verification failed:', authResult.error)
      return NextResponse.json({ error: 'לא מורשה לגשת לעמוד זה' }, { status: 401 })
    }

    const payload = authResult.payload
    console.log('✅ Token verified for:', payload.email, 'Type:', payload.userType)

    // בדיקת הרשאות אדמין
    if (payload.userType !== 'admin') {
      console.log('❌ Access denied. User type:', payload.userType, 'Email:', payload.email)
      return NextResponse.json({ error: 'אין הרשאה לגשת לעמוד זה' }, { status: 403 })
    }

    console.log('✅ Admin access verified for:', payload.email)

    // שליפת פרטי המשתמש
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.userId)
      .single()

    if (userError || !user) {
      console.log('❌ User not found:', userError)
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
    }

    // שליפת פרטי השאלון
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('id', params.questionnaireId)
      .single()

    if (questionnaireError || !questionnaire) {
      console.log('❌ Questionnaire not found:', questionnaireError)
      return NextResponse.json({ error: 'שאלון לא נמצא' }, { status: 404 })
    }

    // שליפת השאלות והתשובות
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', params.questionnaireId)
      .order('question_number')

    if (questionsError) {
      console.log('❌ Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'שגיאה בשליפת השאלות' }, { status: 500 })
    }

    // שליפת התשובות
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', params.userId)
      .eq('questionnaire_id', params.questionnaireId)

    if (responsesError) {
      console.log('❌ Error fetching responses:', responsesError)
      return NextResponse.json({ error: 'שגיאה בשליפת התשובות' }, { status: 500 })
    }

    // שליפת פרטי ההשלמה
    const { data: completion, error: completionError } = await supabase
      .from('questionnaire_completions')
      .select('*')
      .eq('user_id', params.userId)
      .eq('questionnaire_id', params.questionnaireId)
      .single()

    if (completionError) {
      console.log('⚠️ Completion data not found:', completionError)
    }

    // מיפוי התשובות לשאלות
    const responseMap = responses.reduce((acc: any, response) => {
      acc[response.question_id] = response
      return acc
    }, {})

    // עיבוד הנתונים
    const questionsWithAnswers = questions.map(question => {
      const response = responseMap[question.id]
      return {
        ...question,
        response: response ? {
          radio_answer: response.radio_answer,
          text_answer: response.text_answer,
          created_at: response.created_at,
          updated_at: response.updated_at
        } : null
      }
    })

    // סטטיסטיקות
    const stats = {
      total_questions: questions.length,
      answered_questions: responses.length,
      completion_percentage: completion?.progress_percentage || 0,
      completion_date: completion?.completed_at || null,
      is_completed: completion?.is_completed || false
    }

    console.log(`✅ Retrieved ${questions.length} questions with ${responses.length} responses`)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        organization: user.organization_name
      },
      questionnaire: {
        id: questionnaire.id,
        title: questionnaire.title,
        category: questionnaire.category,
        description: questionnaire.description
      },
      questions: questionsWithAnswers,
      stats,
      completion_info: completion
    })

  } catch (error) {
    console.error('❌ Admin questionnaire responses error:', error)
    return NextResponse.json({ error: 'שגיאה פנימית בשרת' }, { status: 500 })
  }
} 