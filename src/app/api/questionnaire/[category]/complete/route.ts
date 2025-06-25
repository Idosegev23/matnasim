import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, extractTokenFromHeaders } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    console.log('✅ API Route: Completing questionnaire for category:', params.category);

    // בדיקת אימות
    const token = extractTokenFromHeaders(request);
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.log('❌ Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ Token verified for user:', decoded.userId);

    // קבלת השאלון לפי קטגוריה
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('category', params.category)
      .eq('is_active', true)
      .single();

    if (questionnaireError || !questionnaire) {
      console.log('❌ Questionnaire not found:', questionnaireError);
      return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 });
    }

    // בדיקה שכל השאלות נענו
    const { data: totalQuestions, error: totalError } = await supabase
      .from('questions')
      .select('id')
      .eq('questionnaire_id', questionnaire.id);

    const { data: userResponses, error: responsesError } = await supabase
      .from('responses')
      .select('question_id')
      .eq('user_id', decoded.userId)
      .eq('questionnaire_id', questionnaire.id);

    if (totalError || responsesError) {
      console.log('❌ Error checking completion status');
      return NextResponse.json({ error: 'Error checking completion status' }, { status: 500 });
    }

    const totalCount = totalQuestions?.length || 0;
    const answeredCount = userResponses?.length || 0;

    if (answeredCount < totalCount) {
      console.log(`❌ Questionnaire not fully completed: ${answeredCount}/${totalCount}`);
      return NextResponse.json({ 
        error: 'Questionnaire not fully completed',
        progress: {
          answered: answeredCount,
          total: totalCount,
          percentage: Math.round((answeredCount / totalCount) * 100)
        }
      }, { status: 400 });
    }

    // עדכון השלמת השאלון
    const completionData = {
      user_id: decoded.userId,
      questionnaire_id: questionnaire.id,
      year: new Date().getFullYear(),
      progress_percentage: 100,
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: completion, error: completionError } = await supabase
      .from('questionnaire_completions')
      .upsert(completionData, {
        onConflict: 'user_id,questionnaire_id,year'
      })
      .select()
      .single();

    if (completionError) {
      console.log('❌ Error marking questionnaire as completed:', completionError);
      return NextResponse.json({ error: 'Error completing questionnaire' }, { status: 500 });
    }

    console.log('✅ Questionnaire completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Questionnaire completed successfully',
      completion: completion,
      questionnaire: {
        title: questionnaire.title,
        category: questionnaire.category
      },
      stats: {
        total_questions: totalCount,
        answered_questions: answeredCount,
        completion_date: completion.completed_at
      }
    });

  } catch (error) {
    console.error('❌ Error in complete questionnaire API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 