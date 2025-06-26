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

    // Convert email to lowercase for case-insensitive matching
    const normalizedEmail = email.toLowerCase().trim()

    // בדיקת תוקף הטוקן וקבלת פרטי ההזמנה - using correct field name
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_token', token)  // Use correct field name
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { message: 'קישור ההזמנה לא תקין או שפג תוקפו' },
        { status: 400 }
      )
    }

    // בדיקה שהמייל תואם להזמנה - using correct field name
    if (invitation.email !== normalizedEmail) {
      return NextResponse.json(
        { message: 'כתובת המייל אינה תואמת להזמנה' },
        { status: 400 }
      )
    }

    // בדיקת דדליין - using correct field name
    const now = new Date()
    const deadline = new Date(invitation.expires_at)  // Use correct field name
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
      .eq('email', normalizedEmail)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'משתמש עם כתובת מייל זו כבר קיים' },
        { status: 400 }
      )
    }

    // הצפנת סיסמה
    const hashedPassword = await hashPassword(password)

    // יצירת המשתמש - with normalized email
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,  // Store normalized email
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

    // עדכון סטטוס ההזמנה - using correct field name
    await supabase
      .from('invitations')
      .update({
        status: 'accepted',  // Use 'accepted' status
        accepted_at: new Date().toISOString(),  // Use correct field name
        updated_at: new Date().toISOString()
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