'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Question {
  id: string;
  question_text: string;
  question_number: number;
  section_title: string | null;
  question_type: string;
  is_required: boolean;
  existing_answer?: {
    radio_answer: string | null;
    text_answer: string | null;
  } | null;
}

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  questions: Question[];
}

interface QuestionnaireData {
  questionnaire: Questionnaire;
  progress: {
    total_questions: number;
    answered_questions: number;
    percentage: number;
  };
}

interface Answers {
  [questionId: string]: {
    radio: string;
    text: string;
  };
}

export default function QuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  
  console.log('🚀 QuestionnairePage started for category:', category);

  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>(''); // סטטוס שמירה אוטומטית

  useEffect(() => {
    fetchQuestionnaire();
  }, [category]);

  // שמירה אוטומטית לפני יציאה מהדף
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      // שמירת כל התשובות הפתוחות
      const pendingAnswers = Object.keys(answers);
      if (pendingAnswers.length > 0) {
        for (const questionId of pendingAnswers) {
          if (answers[questionId]?.radio || answers[questionId]?.text) {
            try {
              await saveAnswer(questionId);
            } catch (error) {
              console.error('Error auto-saving before unload:', error);
            }
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [answers]);

  // שמירה אוטומטית כל 30 שניות
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      const pendingAnswers = Object.keys(answers);
      for (const questionId of pendingAnswers) {
        if (answers[questionId]?.radio || answers[questionId]?.text) {
          try {
            await saveAnswer(questionId, false); // שמירה ללא הצגת סטטוס
            console.log('🔄 Auto-saved answer for question:', questionId);
          } catch (error) {
            console.error('Error auto-saving:', error);
          }
        }
      }
    }, 30000); // כל 30 שניות

    return () => clearInterval(autoSaveInterval);
  }, [answers]);

  const fetchQuestionnaire = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/questionnaire/${category}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch questionnaire');
      }

      const data: QuestionnaireData = await response.json();
      setQuestionnaireData(data);

      // טעינת תשובות קיימות
      const existingAnswers: Answers = {};
      console.log('🔍 Starting to load existing answers...');
      console.log('📋 Questions data:', data.questionnaire.questions);
      
      data.questionnaire.questions.forEach(question => {
        console.log(`🔍 Question ${question.question_number} (ID: ${question.id}):`, question.existing_answer);
        
        if (question.existing_answer) {
          // בדיקה גמישה יותר לתשובות קיימות
          const radioAnswer = question.existing_answer.radio_answer;
          const textAnswer = question.existing_answer.text_answer;
          
          // אם יש כל סוג של תשובה, נטען אותה
          if (radioAnswer !== null || textAnswer !== null) {
            existingAnswers[question.id] = {
              radio: radioAnswer || '',
              text: textAnswer || ''
            };
            console.log(`✅ Loading existing answer for question ${question.question_number}:`, {
              questionId: question.id,
              radio: radioAnswer,
              text: textAnswer
            });
          } else {
            console.log(`ℹ️ No existing answer for question ${question.question_number}`);
          }
        } else {
          console.log(`ℹ️ No existing answer for question ${question.question_number}`);
        }
      });
      console.log('📊 All existing answers loaded:', existingAnswers);
      setAnswers(existingAnswers);

      // קביעת הסקשן הראשון
      if (data.questionnaire.questions.length > 0) {
        setCurrentSection(data.questionnaire.questions[0].section_title);
      }

    } catch (err) {
      console.error('Error fetching questionnaire:', err);
      setError('שגיאה בטעינת השאלון');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, field: 'radio' | 'text', value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const saveAnswer = async (questionId: string, showStatus: boolean = true) => {
    try {
      setSaving(true);
      if (showStatus) setAutoSaveStatus('שומר...');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/questionnaire/${category}/answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          answers: answers[questionId] || {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save answer');
      }

      console.log('Answer saved successfully');
      if (showStatus) {
        setAutoSaveStatus('נשמר ✓');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      if (showStatus) {
        setAutoSaveStatus('שגיאה בשמירה ✗');
        setTimeout(() => setAutoSaveStatus(''), 3000);
      } else {
        alert('שגיאה בשמירת התשובה');
      }
    } finally {
      setSaving(false);
    }
  };

  const completeQuestionnaire = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/questionnaire/${category}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete questionnaire');
      }

      alert('השאלון הושלם בהצלחה!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error completing questionnaire:', err);
      alert('שגיאה בהשלמת השאלון');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'accessibility': '#8b5cf6',
      'accounting': '#3b82f6', 
      'budget': '#10b981',
      'community': '#ec4899',
      'financial': '#059669',
      'hr': '#f97316',
      'inventory': '#06b6d4',
      'legal': '#6366f1',
      'salary': '#eab308',
      'security': '#ef4444',
      'sgarot': '#14b8a6',
      'general': '#6b7280'
    }
    return colorMap[category] || '#6b7280'
  }

  const getCategoryGradient = (category: string) => {
    const gradientMap: { [key: string]: string } = {
      'accessibility': 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)',
      'accounting': 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', 
      'budget': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      'community': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      'financial': 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
      'hr': 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      'inventory': 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
      'legal': 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
      'salary': 'linear-gradient(135deg, #eab308 0%, #fbbf24 100%)',
      'security': 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      'sgarot': 'linear-gradient(135deg, #14b8a6 0%, #5eead4 100%)',
      'general': 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
    }
    return gradientMap[category] || 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
  }

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'accessibility': 'נגישות',
      'accounting': 'הנהלת חשבונות', 
      'budget': 'תקציב',
      'community': 'קהילה',
      'financial': 'ניהול כספי',
      'hr': 'משאבי אנוש',
      'inventory': 'מלאי',
      'legal': 'משפטי',
      'salary': 'שכר',
      'security': 'אבטחה',
      'sgarot': 'סגרות',
      'general': 'כללי'
    }
    return categoryMap[category] || category
  }

  const getSectionQuestions = (sectionTitle: string | null) => {
    return questionnaireData?.questionnaire.questions.filter(q => q.section_title === sectionTitle) || [];
  };

  const getUniqueSections = () => {
    const sections = questionnaireData?.questionnaire.questions.map(q => q.section_title) || [];
    return Array.from(new Set(sections));
  };

  const getCurrentSectionIndex = () => {
    const sections = getUniqueSections();
    return sections.indexOf(currentSection);
  };

  const canGoNext = () => {
    const sections = getUniqueSections();
    const currentIndex = getCurrentSectionIndex();
    return currentIndex < sections.length - 1;
  };

  const canGoBack = () => {
    const currentIndex = getCurrentSectionIndex();
    return currentIndex > 0;
  };

  const goToNextSection = () => {
    const sections = getUniqueSections();
    const currentIndex = getCurrentSectionIndex();
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    }
  };

  const goToPreviousSection = () => {
    const sections = getUniqueSections();
    const currentIndex = getCurrentSectionIndex();
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  };

  const isQuestionnaireComplete = () => {
    if (!questionnaireData) return false;
    const totalQuestions = questionnaireData.questionnaire.questions.length;
    const answeredQuestions = Object.keys(answers).filter(questionId => {
      const answer = answers[questionId];
      return answer && (answer.radio || answer.text);
    }).length;
    return answeredQuestions === totalQuestions;
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '400px' }}>
          <div className="loading">
            <div className="spinner"></div>
          </div>
          <h2 style={{ marginTop: '20px' }}>טוען שאלון...</h2>
        </div>
      </div>
    );
  }

  if (error || !questionnaireData) {
    return (
      <div className="page-container" style={{ textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>שגיאה</h2>
          <p style={{ marginBottom: '30px' }}>{error || 'שאלון לא נמצא'}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="btn btn-primary"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    );
  }

  const currentSectionQuestions = getSectionQuestions(currentSection);
  const sections = getUniqueSections();
  
  console.log('🎯 Current section questions:', currentSectionQuestions);
  console.log('📝 Current answers state:', answers);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header with gradient background */}
      <div style={{
        background: getCategoryGradient(category),
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        padding: '2rem 0'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <button 
                onClick={() => router.push('/dashboard')}
                className="back-button"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none'
                }}
              >
                ← חזרה לדשבורד
              </button>
              
              <div>
                <h1 className="questionnaire-title">
                  {getCategoryDisplayName(category)}
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
                  {questionnaireData.questionnaire.description}
                </p>
              </div>
            </div>
            
            {/* Auto Save Status */}
            {autoSaveStatus && (
              <div className="auto-save-status" style={{
                background: autoSaveStatus.includes('✓') ? 'rgba(34, 197, 94, 0.15)' : 
                           autoSaveStatus.includes('✗') ? 'rgba(239, 68, 68, 0.15)' : 
                           'rgba(59, 130, 246, 0.15)',
                color: autoSaveStatus.includes('✓') ? '#22c55e' : 
                       autoSaveStatus.includes('✗') ? '#ef4444' : '#3b82f6',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                border: `1px solid ${autoSaveStatus.includes('✓') ? '#22c55e' : 
                                    autoSaveStatus.includes('✗') ? '#ef4444' : '#3b82f6'}`
              }}>
                {autoSaveStatus}
              </div>
            )}
            
            {/* Progress */}
            <div className="questionnaire-progress">
              <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '14px' }}>התקדמות</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '10px' }}>
                  {questionnaireData.progress.percentage}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${questionnaireData.progress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Section Navigation */}
        {sections.length > 1 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: getCategoryGradient(category),
                borderRadius: '6px'
              }}></div>
              סעיפי השאלון
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              {sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSection(section)}
                  className={`btn ${currentSection === section ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    background: currentSection === section ? getCategoryGradient(category) : undefined
                  }}
                >
                  {section || 'ללא סעיף'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Section Questions */}
        <div className="questionnaire-section">
          {currentSection && (
            <div className="section-header" style={{
              background: getCategoryGradient(category)
            }}>
              <h2>{currentSection}</h2>
            </div>
          )}
          
          <div style={{ padding: '2rem' }}>
            {currentSectionQuestions.map((question, index) => (
              <div key={question.id} className="question-group">
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: '40px',
                    height: '40px',
                    background: getCategoryGradient(category),
                    color: 'white',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    {question.question_number}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '18px',
                      marginBottom: '20px',
                      lineHeight: '1.6',
                      fontWeight: '500'
                    }}>
                      {question.question_text}
                      {question.is_required && (
                        <span style={{ color: '#ef4444', marginRight: '5px' }}>*</span>
                      )}
                    </p>

                    {/* Radio Options */}
                    <div className="radio-group">
                      {['כן', 'לא', 'חלקית'].map((option) => {
                        const isSelected = answers[question.id]?.radio === option;
                        return (
                          <label key={option} className="radio-label">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={isSelected}
                              onChange={() => {
                                handleAnswerChange(question.id, 'radio', option);
                                saveAnswer(question.id);
                              }}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Text Answer */}
                    <div className="follow-up">
                      <label>הערות נוספות:</label>
                      <textarea
                        value={answers[question.id]?.text || ''}
                        onChange={(e) => {
                          handleAnswerChange(question.id, 'text', e.target.value);
                        }}
                        onBlur={() => saveAnswer(question.id)}
                        rows={3}
                        placeholder="הוסיפו הערות או הסברים נוספים..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Status */}
        {!isQuestionnaireComplete() && (
          <div className="alert alert-info" style={{ 
            textAlign: 'center',
            margin: '2rem auto',
            maxWidth: '600px'
          }}>
            <p>
              עוד {questionnaireData ? questionnaireData.questionnaire.questions.length - Object.keys(answers).filter(qId => answers[qId]?.radio || answers[qId]?.text).length : 0} שאלות נותרו לענות כדי להשלים את השאלון
            </p>
          </div>
        )}

        {/* Questionnaire Complete Message */}
        {isQuestionnaireComplete() && (
          <div className="alert alert-success" style={{ 
            textAlign: 'center',
            margin: '2rem auto',
            maxWidth: '600px'
          }}>
            <h3>✅ השאלון הושלם בהצלחה!</h3>
            <p>כל השאלות נענו. ניתן להגיש את השאלון עכשיו.</p>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="form-actions">
          {/* Previous Button */}
          <button
            onClick={goToPreviousSection}
            disabled={!canGoBack()}
            className={`btn ${canGoBack() ? 'btn-secondary' : ''}`}
            style={{ opacity: canGoBack() ? 1 : 0.5 }}
          >
            ← חזור
          </button>

          {/* Complete Button - Only when questionnaire is complete */}
          {isQuestionnaireComplete() && (
            <button
              onClick={completeQuestionnaire}
              disabled={saving}
              className="submit-button"
              style={{
                background: getCategoryGradient(category),
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ 
                    width: '20px', 
                    height: '20px',
                    marginLeft: '10px'
                  }}></div>
                  שומר...
                </>
              ) : (
                <>
                  ✓ השלם שאלון
                </>
              )}
            </button>
          )}

          {/* Next Button */}
          <button
            onClick={goToNextSection}
            disabled={!canGoNext()}
            className={`btn ${canGoNext() ? 'btn-primary' : ''}`}
            style={{ 
              background: canGoNext() ? getCategoryGradient(category) : undefined,
              opacity: canGoNext() ? 1 : 0.5 
            }}
          >
            הבא →
          </button>
        </div>
      </div>
    </div>
  );
} 