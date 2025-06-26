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
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{textAlign: 'center'}}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem auto'
          }}></div>
          <p style={{
            color: '#4a5568',
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>
            טוען שאלון...
          </p>
        </div>
      </div>
    );
  }

  if (error || !questionnaireData) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold'}}>!</span>
            </div>
          </div>
          <p style={{
            color: '#ef4444',
            fontSize: '1.1rem',
            fontWeight: '500',
            marginBottom: '1.5rem'
          }}>
            {error || 'שאלון לא נמצא'}
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.transform = 'translateY(-1px)'
              target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = 'none'
            }}
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
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: getCategoryColor(category),
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <button 
                onClick={() => router.push('/dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.background = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px'
                }}></div>
                <span>חזרה לדשבורד</span>
              </button>
              
              <div>
                <h1 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  margin: '0 0 0.5rem 0'
                }}>
                  {getCategoryDisplayName(category)}
                </h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  margin: 0
                }}>
                  {questionnaireData.questionnaire.description}
                </p>
              </div>
            </div>
            
            {/* Auto Save Status */}
            {autoSaveStatus && (
              <div style={{
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
                                    autoSaveStatus.includes('✗') ? '#ef4444' : '#3b82f6'}`,
                transition: 'all 0.3s ease'
              }}>
                {autoSaveStatus}
              </div>
            )}
            
            {/* Progress */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '1.5rem',
              minWidth: '250px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{fontSize: '1rem', fontWeight: '500'}}>התקדמות</span>
                <span style={{fontSize: '1.3rem', fontWeight: '700'}}>{questionnaireData.progress.percentage}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '5px',
                    transition: 'width 0.8s ease-out',
                    width: `${questionnaireData.progress.percentage}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Section Navigation */}
        {sections.length > 1 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: getCategoryColor(category),
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
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: currentSection === section ? getCategoryColor(category) : '#f3f4f6',
                    color: currentSection === section ? 'white' : '#374151'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    if (currentSection !== section) {
                      target.style.background = '#e5e7eb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    if (currentSection !== section) {
                      target.style.background = '#f3f4f6'
                    }
                  }}
                >
                  {section || 'ללא סעיף'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Section Questions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }}>
          {currentSection && (
            <div style={{
              background: getCategoryColor(category),
              color: 'white',
              padding: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px'
                }}></div>
                {currentSection}
              </h2>
            </div>
          )}
          
          <div style={{padding: '2rem'}}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem'
            }}>
              {currentSectionQuestions.map((question, index) => (
                <div key={question.id} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '2rem',
                  background: 'rgba(249, 250, 251, 0.5)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(249, 250, 251, 0.8)'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(249, 250, 251, 0.5)'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      flexShrink: 0,
                      width: '40px',
                      height: '40px',
                      background: getCategoryColor(category),
                      color: 'white',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '1rem'
                    }}>
                      {question.question_number}
                    </div>
                    
                    <div style={{flex: 1}}>
                      <p style={{
                        color: '#2d3748',
                        fontSize: '1.1rem',
                        marginBottom: '2rem',
                        lineHeight: '1.6',
                        fontWeight: '500'
                      }}>
                        {question.question_text}
                        {question.is_required && <span style={{color: '#ef4444', marginRight: '0.25rem'}}>*</span>}
                      </p>

                      {/* Radio Options */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '2rem'
                      }}>
                         {['כן', 'לא', 'חלקית'].map((option) => {
                           const isSelected = answers[question.id]?.radio === option;
                           console.log(`Question ${question.question_number}, Option ${option}: isSelected=${isSelected}, currentValue=${answers[question.id]?.radio}`);
                           return (
                           <label key={option} style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: '1rem',
                             cursor: 'pointer',
                             padding: '12px 16px',
                             borderRadius: '10px',
                             transition: 'all 0.3s ease',
                             background: isSelected ? 
                               `${getCategoryColor(category)}15` : 'transparent'
                           }}
                          onMouseEnter={(e) => {
                            if (answers[question.id]?.radio !== option) {
                              e.currentTarget.style.background = '#f8fafc'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (answers[question.id]?.radio !== option) {
                              e.currentTarget.style.background = 'transparent'
                            }
                          }}>
                            <div style={{position: 'relative'}}>
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={answers[question.id]?.radio === option}
                                onChange={() => {
                                  handleAnswerChange(question.id, 'radio', option);
                                  saveAnswer(question.id);
                                }}
                                style={{display: 'none'}}
                              />
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: `2px solid ${answers[question.id]?.radio === option ? getCategoryColor(category) : '#cbd5e1'}`,
                                background: answers[question.id]?.radio === option ? getCategoryColor(category) : 'white',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {answers[question.id]?.radio === option && (
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    background: 'white',
                                    borderRadius: '50%'
                                  }}></div>
                                )}
                              </div>
                            </div>
                            <span style={{
                              color: answers[question.id]?.radio === option ? '#2d3748' : '#4a5568',
                              fontWeight: answers[question.id]?.radio === option ? '600' : '500',
                              fontSize: '1rem'
                            }}>
                              {option}
                            </span>
                          </label>
                           );
                         })}
                      </div>

                      {/* Text Answer */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.75rem'
                        }}>
                          הערות נוספות:
                        </label>
                        <textarea
                          value={answers[question.id]?.text || ''}
                          onChange={(e) => {
                            handleAnswerChange(question.id, 'text', e.target.value);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            resize: 'vertical',
                            background: 'white',
                            transition: 'all 0.3s ease',
                            fontFamily: 'inherit'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = getCategoryColor(category)
                            e.target.style.boxShadow = `0 0 0 3px ${getCategoryColor(category)}20`
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#cbd5e1'
                            e.target.style.boxShadow = 'none'
                            saveAnswer(question.id)
                          }}
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
        </div>

        {/* Completion Status */}
        {!isQuestionnaireComplete() && (
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            padding: '1rem',
            maxWidth: '600px',
            margin: '1.5rem auto 0 auto',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <p style={{
              color: '#6b7280',
              fontSize: '0.9rem',
              fontWeight: '500',
              margin: 0
            }}>
              עוד {questionnaireData ? questionnaireData.questionnaire.questions.length - Object.keys(answers).filter(qId => answers[qId]?.radio || answers[qId]?.text).length : 0} שאלות נותרו לענות כדי להשלים את השאלון
            </p>
          </div>
        )}

        {/* Questionnaire Complete Message */}
        {isQuestionnaireComplete() && (
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '600px',
            margin: '1.5rem auto 0 auto',
            color: 'white',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{color: '#10b981', fontSize: '1rem', fontWeight: 'bold'}}>✓</span>
              </div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: 0
              }}>
                השאלון הושלם בהצלחה!
              </h3>
            </div>
            <p style={{
              fontSize: '0.9rem',
              margin: 0,
              opacity: 0.9
            }}>
              כל השאלות נענו. ניתן להגיש את השאלון עכשיו.
            </p>
          </div>
        )}

        {/* Navigation Actions */}
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '800px',
          margin: '2rem auto 0 auto',
          padding: '0 1rem'
        }}>
          {/* Previous Button */}
          <button
            onClick={goToPreviousSection}
            disabled={!canGoBack()}
            style={{
              padding: '12px 24px',
              background: canGoBack() ? 'rgba(255, 255, 255, 0.9)' : 'rgba(226, 232, 240, 0.5)',
              color: canGoBack() ? getCategoryColor(category) : '#9ca3af',
              fontWeight: '600',
              borderRadius: '10px',
              border: `2px solid ${canGoBack() ? getCategoryColor(category) : '#e2e8f0'}`,
              cursor: canGoBack() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              opacity: canGoBack() ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (canGoBack()) {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(-1px)'
                target.style.boxShadow = `0 4px 15px ${getCategoryColor(category)}30`
              }
            }}
            onMouseLeave={(e) => {
              if (canGoBack()) {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(0)'
                target.style.boxShadow = 'none'
              }
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              background: canGoBack() ? getCategoryColor(category) : '#9ca3af',
              borderRadius: '50%',
              transform: 'rotate(180deg)'
            }}></div>
            <span>חזור</span>
          </button>

          {/* Complete Button - Only when questionnaire is complete */}
          {isQuestionnaireComplete() && (
            <button
              onClick={completeQuestionnaire}
              disabled={saving}
              style={{
                padding: '16px 32px',
                background: getCategoryColor(category),
                color: 'white',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '1.1rem',
                opacity: saving ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'translateY(-2px)'
                  target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'translateY(0)'
                  target.style.boxShadow = 'none'
                }
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>שומר...</span>
                </>
              ) : (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%'
                  }}></div>
                  <span>השלם שאלון</span>
                </>
              )}
            </button>
          )}

          {/* Next Button */}
          <button
            onClick={goToNextSection}
            disabled={!canGoNext()}
            style={{
              padding: '12px 24px',
              background: canGoNext() ? getCategoryColor(category) : 'rgba(226, 232, 240, 0.5)',
              color: canGoNext() ? 'white' : '#9ca3af',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              cursor: canGoNext() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              opacity: canGoNext() ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (canGoNext()) {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(-1px)'
                target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (canGoNext()) {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(0)'
                target.style.boxShadow = 'none'
              }
            }}
          >
            <span>הבא</span>
            <div style={{
              width: '16px',
              height: '16px',
              background: canGoNext() ? 'rgba(255, 255, 255, 0.9)' : '#9ca3af',
              borderRadius: '50%'
            }}></div>
          </button>
        </div>

        {/* Auto-save indicator */}
        {saving && (
          <div style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            zIndex: 1000
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: getCategoryColor(category)
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${getCategoryColor(category)}30`,
                borderTop: `2px solid ${getCategoryColor(category)}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>שומר...</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 