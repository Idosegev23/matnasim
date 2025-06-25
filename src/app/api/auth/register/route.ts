import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, organizationName, token } = await request.json()

    if (!email || !password || !fullName || !organizationName || !token) {
      return NextResponse.json(
        { message: 'חסרים פרטים נדרשים' },
        { status: 400 }
      )
    }

    // בדיקת תוקף הטוקן וקבלת פרטי ההזמנה
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { message: 'קישור ההזמנה לא תקין או שפג תוקפו' },
        { status: 400 }
      )
    }

    // בדיקה שהמייל תואם להזמנה
    if (invitation.manager_email !== email) {
      return NextResponse.json(
        { message: 'כתובת המייל אינה תואמת להזמנה' },
        { status: 400 }
      )
    }

    // בדיקת דדליין
    const now = new Date()
    const deadline = new Date(invitation.deadline)
    if (now > deadline) {
      return NextResponse.json(
        { message: 'תוקף ההזמנה פג' },
        { status: 400 }
      )
    }

    // בדיקה אם המשתמש כבר קיים
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'משתמש עם כתובת מייל זו כבר קיים' },
        { status: 400 }
      )
    }

    // הצפנת סיסמה
    const hashedPassword = await hashPassword(password)

    // יצירת המשתמש
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        full_name: fullName,
        organization_name: organizationName,
        user_type: 'manager',
        is_verified: true
      })
      .select()
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json(
        { message: 'שגיאה ביצירת המשתמש' },
        { status: 500 }
      )
    }

    // עדכון סטטוס ההזמנה
    await supabase
      .from('invitations')
      .update({
        status: 'registered',
        registered_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    // יצירת JWT
    const jwtToken = await createToken({
      userId: newUser.id,
      email: newUser.email,
      userType: newUser.user_type,
      fullName: newUser.full_name,
      organizationName: newUser.organization_name
    })

    return NextResponse.json({
      message: 'הרשמה בוצעה בהצלחה',
      token: jwtToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        userType: newUser.user_type,
        organizationName: newUser.organization_name
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { message: 'שגיאת שרת פנימית' },
      { status: 500 }
    )
  }
} 