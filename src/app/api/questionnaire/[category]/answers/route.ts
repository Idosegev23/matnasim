import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, extractTokenFromHeaders } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    console.log('💾 API Route: Saving answers for category:', params.category);
    console.log('💾 Headers received:', Object.fromEntries(request.headers.entries()));

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

    // קבלת נתוני הבקשה
    const body = await request.json();
    const { answers, question_id } = body;

    console.log('📝 Saving answer for question:', question_id);
    console.log('📝 Full request body:', body);
    console.log('📝 Answer data:', answers);
    console.log('📝 Answers type:', typeof answers);
    console.log('📝 Answers.radio:', answers?.radio);
    console.log('📝 Answers.text:', answers?.text);

    // קבלת השאלון לפי קטגוריה
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('category', params.category)
      .eq('is_active', true)
      .single();

    if (questionnaireError || !questionnaire) {
      console.log('❌ Questionnaire not found:', questionnaireError);
      return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 });
    }

    // בדיקה אם יש תשובה קיימת
    const { data: existingResponse, error: fetchError } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('questionnaire_id', questionnaire.id)
      .eq('question_id', question_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.log('❌ Error fetching existing response:', fetchError);
      return NextResponse.json({ error: 'Error fetching existing response' }, { status: 500 });
    }

    const responseData = {
      user_id: decoded.userId,
      questionnaire_id: questionnaire.id,
      question_id: question_id,
      radio_answer: answers.radio || null,
      text_answer: answers.text || null,
      is_completed: true,
      updated_at: new Date().toISOString()
    };

    console.log('📝 Creating response data...');
    console.log('📝 answers.radio value:', answers.radio);
    console.log('📝 answers.text value:', answers.text);
    console.log('📝 Processing: answers.radio || null =', answers.radio || null);
    console.log('📝 Processing: answers.text || null =', answers.text || null);
    console.log('📝 Response data to save:', responseData);

    let result;
    if (existingResponse) {
      // עדכון תשובה קיימת
      console.log('🔄 Updating existing response with ID:', existingResponse.id);
      const { data, error } = await supabase
        .from('responses')
        .update(responseData)
        .eq('id', existingResponse.id)
        .select()
        .single();
      
      result = { data, error };
      console.log('🔄 Update result:', { data, error });
    } else {
      // יצירת תשובה חדשה
      console.log('➕ Creating new response');
      const { data, error } = await supabase
        .from('responses')
        .insert(responseData)
        .select()
        .single();
      
      result = { data, error };
      console.log('➕ Insert result:', { data, error });
    }

    if (result.error) {
      console.log('❌ Error saving response:', result.error);
      return NextResponse.json({ error: 'Error saving response' }, { status: 500 });
    }

    console.log('✅ Response saved successfully with data:', result.data);

    // חישוב אחוז השלמה מעודכן
    const { data: allResponses, error: progressError } = await supabase
      .from('responses')
      .select('question_id')
      .eq('user_id', decoded.userId)
      .eq('questionnaire_id', questionnaire.id);

    const { data: totalQuestions, error: totalError } = await supabase
      .from('questions')
      .select('id')
      .eq('questionnaire_id', questionnaire.id);

    let progressPercentage = 0;
    if (!progressError && !totalError && totalQuestions && allResponses) {
      const answeredCount = allResponses.length;
      const totalCount = totalQuestions.length;
      progressPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
      
      console.log(`📊 Updated progress: ${answeredCount}/${totalCount} (${progressPercentage}%)`);
    }

    // עדכון טבלת questionnaire_completions
    const { error: completionError } = await supabase
      .from('questionnaire_completions')
      .upsert({
        user_id: decoded.userId,
        questionnaire_id: questionnaire.id,
        year: new Date().getFullYear(),
        progress_percentage: progressPercentage,
        is_completed: progressPercentage === 100,
        completed_at: progressPercentage === 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,questionnaire_id,year'
      });

    if (completionError) {
      console.log('⚠️ Error updating completion status:', completionError);
    }

    return NextResponse.json({
      success: true,
      response: result.data,
      progress: {
        percentage: progressPercentage,
        is_completed: progressPercentage === 100
      }
    });

  } catch (error) {
    console.error('❌ Error in save answers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 