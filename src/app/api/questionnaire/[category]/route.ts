import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, extractTokenFromHeaders } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    console.log('📋 API Route: Getting questionnaire for category:', params.category);
    console.log('📋 Headers received:', Object.fromEntries(request.headers.entries()));

    // בדיקת אימות
    const token = extractTokenFromHeaders(request);
    console.log('🔑 Token extracted:', token ? 'Token exists' : 'No token');
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decodedResult = await verifyToken(token);
    if (!decodedResult.success || !decodedResult.payload) {
      console.log('❌ Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const decoded = decodedResult.payload;
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

    console.log('✅ Found questionnaire:', questionnaire.title);

    // קבלת השאלות לשאלון
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('questionnaire_id', questionnaire.id)
      .order('question_number');

    if (questionsError) {
      console.log('❌ Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Error fetching questions' }, { status: 500 });
    }

    console.log(`✅ Found ${questions.length} questions`);

    // קבלת תשובות קיימות של המשתמש
    console.log('🔍 Looking for existing responses for user:', decoded.userId, 'questionnaire:', questionnaire.id);
    const { data: existingResponses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('questionnaire_id', questionnaire.id);

    console.log('📝 Found responses:', existingResponses);
    console.log('📝 Responses error:', responsesError);

    if (responsesError) {
      console.log('⚠️ Error fetching existing responses:', responsesError);
    }

    // מיפוי התשובות הקיימות
    const responseMap = (existingResponses || []).reduce((acc: any, response: any) => {
      console.log('🔄 Processing response:', response);
      console.log('🔄 Response details - question_id:', response.question_id, 'radio:', response.radio_answer, 'text:', response.text_answer);
      acc[response.question_id] = {
        radio_answer: response.radio_answer,
        text_answer: response.text_answer
      };
      return acc;
    }, {});

    console.log('📋 Final response map:', responseMap);
    console.log('📋 Total existing responses found:', existingResponses?.length || 0);

    // חישוב אחוז השלמה
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(responseMap).length;
    const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

    console.log(`📊 Progress: ${answeredQuestions}/${totalQuestions} (${progressPercentage}%)`);

    return NextResponse.json({
      questionnaire: {
        ...questionnaire,
        questions: questions.map((question: any) => ({
          ...question,
          existing_answer: responseMap[question.id] || null
        }))
      },
      progress: {
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        percentage: progressPercentage
      }
    });

  } catch (error) {
    console.error('❌ Error in questionnaire API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 