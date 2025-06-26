export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin completed questionnaires API called')
    
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

    // שליפת שאלונים מושלמים עם פרטי המשתמשים
    const { data: completedQuestionnaires, error: completedError } = await supabase
      .from('questionnaire_completions')
      .select(`
        *,
        users!inner(
          id,
          full_name,
          email,
          organization_name
        ),
        questionnaires!inner(
          id,
          title,
          category,
          description
        )
      `)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })

    if (completedError) {
      console.log('❌ Error fetching completed questionnaires:', completedError)
      return NextResponse.json({ error: 'שגיאה בשליפת שאלונים מושלמים' }, { status: 500 })
    }

    console.log(`✅ Found ${completedQuestionnaires?.length || 0} completed questionnaires`)

    // עיבוד הנתונים להצגה
    const processedData = (completedQuestionnaires || []).map(completion => ({
      id: completion.id,
      completion_date: completion.completed_at,
      year: completion.year,
      progress_percentage: completion.progress_percentage,
      user: {
        id: completion.users.id,
        name: completion.users.full_name,
        email: completion.users.email,
        organization: completion.users.organization_name
      },
      questionnaire: {
        id: completion.questionnaires.id,
        title: completion.questionnaires.title,
        category: completion.questionnaires.category,
        description: completion.questionnaires.description
      }
    }))

    // קיבוץ לפי קטגוריות
    const byCategory = processedData.reduce((acc: any, item) => {
      const category = item.questionnaire.category
      if (!acc[category]) {
        acc[category] = {
          category,
          title: item.questionnaire.title,
          completions: []
        }
      }
      acc[category].completions.push(item)
      return acc
    }, {})

    // סטטיסטיקות
    const stats = {
      total_completed: processedData.length,
      unique_users: new Set(processedData.map(item => item.user.id)).size,
      categories_completed: Object.keys(byCategory).length,
      completion_rate_this_month: processedData.filter(item => {
        const completionDate = new Date(item.completion_date)
        const thisMonth = new Date()
        return completionDate.getMonth() === thisMonth.getMonth() && 
               completionDate.getFullYear() === thisMonth.getFullYear()
      }).length
    }

    return NextResponse.json({
      success: true,
      stats,
      completed_questionnaires: processedData,
      by_category: Object.values(byCategory)
    })

  } catch (error) {
    console.error('❌ Admin completed questionnaires error:', error)
    return NextResponse.json({ error: 'שגיאה פנימית בשרת' }, { status: 500 })
  }
} 