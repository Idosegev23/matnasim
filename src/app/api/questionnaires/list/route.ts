import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching questionnaires list...')

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

    // קבלת כל השאלונים הפעילים
    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('questionnaires')
      .select('id, title, category, description, year, is_active')
      .eq('is_active', true)
      .order('category')

    if (questionnairesError) {
      console.log('❌ Error fetching questionnaires:', questionnairesError)
      return NextResponse.json({ error: 'Failed to fetch questionnaires' }, { status: 500 })
    }

    console.log('✅ Found questionnaires:', questionnaires?.length || 0)

    return NextResponse.json({
      success: true,
      questionnaires: questionnaires || []
    })

  } catch (error) {
    console.error('❌ Error in questionnaires list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 