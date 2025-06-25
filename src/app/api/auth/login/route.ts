import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, userType } = await request.json()

    if (!email || !password || !userType) {
      return NextResponse.json({ error: 'חסרים פרטים נדרשים' }, { status: 400 })
    }

    // כניסה רגילה דרך מסד הנתונים
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'שילוב אימייל וסיסמה לא נכון' }, { status: 401 })
    }

    // בדיקת סיסמה
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'שילוב אימייל וסיסמה לא נכון' }, { status: 401 })
    }

    // בדיקת סוג משתמש
    if (user.user_type !== userType) {
      return NextResponse.json({ error: 'סוג משתמש לא נכון' }, { status: 401 })
    }

    // יצירת טוקן
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      fullName: user.full_name,
      organizationName: user.organization_name
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        organizationName: user.organization_name
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'שגיאה בכניסה למערכת' }, { status: 500 })
  }
} 