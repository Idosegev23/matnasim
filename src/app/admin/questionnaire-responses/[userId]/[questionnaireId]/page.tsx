'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QuestionWithResponse {
  id: string
  question_text: string
  question_type: string
  question_number: number
  section_name?: string
  options?: any
  is_required: boolean
  response: {
    radio_answer: string | null
    text_answer: string | null
    created_at: string
    updated_at: string
  } | null
}

interface ResponseData {
  user: {
    id: string
    name: string
    email: string
    organization: string
  }
  questionnaire: {
    id: string
    title: string
    category: string
    description: string
  }
  questions: QuestionWithResponse[]
  stats: {
    total_questions: number
    answered_questions: number
    completion_percentage: number
    completion_date: string | null
    is_completed: boolean
  }
  completion_info: any
}

export default function QuestionnaireResponsesPage({ 
  params 
}: { 
  params: { userId: string; questionnaireId: string } 
}) {
  const [data, setData] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [showOnlyAnswered, setShowOnlyAnswered] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/admin/login')
          return
        }

        const response = await fetch(`/api/admin/questionnaire-responses/${params.userId}/${params.questionnaireId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError('שגיאה בטעינת תשובות השאלון')
          if (response.status === 401) {
            localStorage.removeItem('token')
            router.push('/admin/login')
          }
        }
      } catch (error) {
        setError('שגיאה בחיבור לשרת')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.userId, params.questionnaireId, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      accessibility: 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)',
      accounting: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      budget: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      community: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      financial: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
      hr: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      inventory: 'linear-gradient(135deg, #374151 0%, #9ca3af 100%)',
      legal: 'linear-gradient(135deg, #b91c1c 0%, #fca5a5 100%)',
      salary: 'linear-gradient(135deg, #047857 0%, #6ee7b7 100%)',
      security: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
      sgarot: 'linear-gradient(135deg, #6d28d9 0%, #c4b5fd 100%)',
      general: 'linear-gradient(135deg, #4b5563 0%, #d1d5db 100%)'
    }
    return gradients[category] || 'linear-gradient(135deg, #4b5563 0%, #d1d5db 100%)'
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      accessibility: '♿',
      accounting: '📊',
      budget: '💰',
      community: '🏘️',
      financial: '💼',
      hr: '👥',
      inventory: '📦',
      legal: '⚖️',
      salary: '💵',
      security: '🔒',
      sgarot: '📋',
      general: '📄'
    }
    return icons[category] || '📄'
  }

  const getQuestionTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      radio: '⚪',
      text: '📝',
      textarea: '📄',
      checkbox: '☑️'
    }
    return icons[type] || '❓'
  }

  const uniqueSections = data?.questions.reduce((acc: string[], question) => {
    if (question.section_name && !acc.includes(question.section_name)) {
      acc.push(question.section_name)
    }
    return acc
  }, []) || []

  const filteredQuestions = data?.questions.filter(question => {
    const sectionMatch = selectedSection === 'all' || question.section_name === selectedSection
    const answeredMatch = !showOnlyAnswered || question.response !== null
    return sectionMatch && answeredMatch
  }) || []

  const exportToPDF = () => {
    // TODO: Implement PDF export functionality
    alert('תכונת ייצוא ל-PDF תוטמע בעתיד')
  }

  if (loading) {
    return (
      <div className="page-container" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', maxWidth: '600px' }}>
            <div className="loading" style={{ margin: '40px auto' }}>
              <div className="spinner"></div>
            </div>
            <h2>טוען תשובות השאלון...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-container" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', maxWidth: '600px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>שגיאה</h2>
            <p style={{ marginBottom: '30px' }}>{error || 'לא ניתן לטעון את הנתונים'}</p>
            <button 
              onClick={() => router.push('/admin/completed-questionnaires')}
              className="btn btn-primary"
            >
              חזרה לשאלונים מושלמים
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '42px', 
                fontWeight: 'bold',
                background: getCategoryGradient(data.questionnaire.category),
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                {getCategoryIcon(data.questionnaire.category)} תשובות מפורטות
              </h1>
              <p style={{ color: '#6c757d', fontSize: '18px' }}>
                צפייה בתשובות השאלון שנמלא על ידי המשתמש
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/completed-questionnaires')}
              className="btn btn-secondary"
              style={{ 
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              ← חזרה לשאלונים
            </button>
          </div>

          {/* Info Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '25px',
            marginBottom: '40px'
          }}>
            {/* User Info */}
            <div className="card hover-card" style={{ padding: '25px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                👤 פרטי המשתמש
              </h3>
              <div style={{ lineHeight: '1.8' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>שם:</strong> {data.user.name}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>אימייל:</strong> {data.user.email}
                </div>
                <div>
                  <strong>ארגון:</strong> {data.user.organization}
                </div>
              </div>
            </div>

            {/* Questionnaire Info */}
            <div className="card hover-card" style={{ padding: '25px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {getCategoryIcon(data.questionnaire.category)} פרטי השאלון
              </h3>
              <div style={{ lineHeight: '1.8' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>כותרת:</strong> {data.questionnaire.title}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>קטגוריה:</strong> {data.questionnaire.category}
                </div>
                <div>
                  <strong>תיאור:</strong> {data.questionnaire.description}
                </div>
              </div>
            </div>

            {/* Completion Stats */}
            <div className="card hover-card" style={{ padding: '25px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📊 סטטיסטיקות השלמה
              </h3>
              <div style={{ lineHeight: '1.8' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>התקדמות:</strong>
                  <span style={{ 
                    marginRight: '10px',
                    color: data.stats.completion_percentage === 100 ? '#27ae60' : '#f39c12',
                    fontWeight: 'bold'
                  }}>
                    {data.stats.completion_percentage}%
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>שאלות שנענו:</strong> {data.stats.answered_questions}/{data.stats.total_questions}
                </div>
                <div>
                  <strong>סטטוס:</strong>
                  <span style={{ 
                    marginRight: '10px',
                    color: data.stats.is_completed ? '#27ae60' : '#f39c12',
                    fontWeight: 'bold'
                  }}>
                    {data.stats.is_completed ? 'הושלם' : 'בתהליך'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ padding: '25px', marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>🔍 סינון תשובות</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px' 
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  סינון לפי סעיף:
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">כל הסעיפים</option>
                  {uniqueSections.map(section => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  הצג רק תשובות שמולאו:
                </label>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '12px'
                }}>
                  <input
                    type="checkbox"
                    checked={showOnlyAnswered}
                    onChange={(e) => setShowOnlyAnswered(e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span>הצג רק שאלות שנענו</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button
                  onClick={exportToPDF}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  📄 ייצא ל-PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Questions and Responses */}
        <div>
          <h3 style={{ 
            marginBottom: '25px', 
            color: '#2c3e50',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📝 שאלות ותשובות ({filteredQuestions.length})
          </h3>
          
          {filteredQuestions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>📭</div>
              <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>לא נמצאו תשובות</h3>
              <p style={{ color: '#adb5bd' }}>נסה לשנות את הסינון או לבדוק שאלונים אחרים</p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '25px' 
            }}>
              {filteredQuestions.map((question) => (
                <div 
                  key={question.id} 
                  className="card hover-card"
                  style={{ padding: '25px' }}
                >
                  {/* Question Header */}
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    gap: '15px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: getCategoryGradient(data.questionnaire.category),
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
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '5px'
                      }}>
                        <span style={{ 
                          fontSize: '14px',
                          color: '#6c757d',
                          fontWeight: '500'
                        }}>
                          {getQuestionTypeIcon(question.question_type)} {question.question_type}
                        </span>
                        {question.section_name && (
                          <span style={{
                            fontSize: '12px',
                            background: '#f8f9fa',
                            color: '#495057',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                          }}>
                            {question.section_name}
                          </span>
                        )}
                        {question.is_required && (
                          <span style={{
                            fontSize: '12px',
                            background: '#fff3cd',
                            color: '#856404',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #ffeaa7'
                          }}>
                            חובה
                          </span>
                        )}
                      </div>
                      <h4 style={{
                        margin: 0,
                        color: '#2c3e50',
                        fontSize: '18px',
                        lineHeight: '1.5'
                      }}>
                        {question.question_text}
                      </h4>
                    </div>
                  </div>

                  {/* Response */}
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e9ecef'
                  }}>
                    {question.response ? (
                      <div>
                        {/* Radio Answer */}
                        {question.response.radio_answer !== null && question.response.radio_answer !== undefined && (
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              marginBottom: '8px'
                            }}>
                              <span style={{ 
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#495057'
                              }}>
                                ⚪ תשובה:
                              </span>
                              <span style={{
                                background: question.response.radio_answer === 'כן' ? '#d4edda' :
                                           question.response.radio_answer === 'לא' ? '#f8d7da' : '#fff3cd',
                                color: question.response.radio_answer === 'כן' ? '#155724' :
                                       question.response.radio_answer === 'לא' ? '#721c24' : '#856404',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: `1px solid ${
                                  question.response.radio_answer === 'כן' ? '#c3e6cb' :
                                  question.response.radio_answer === 'לא' ? '#f5c6cb' : '#ffeaa7'
                                }`
                              }}>
                                {question.response.radio_answer}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Text Answer */}
                        {question.response.text_answer !== null && question.response.text_answer !== undefined && (
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ 
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#495057',
                              marginBottom: '8px'
                            }}>
                              📝 הערות נוספות:
                            </div>
                            <div style={{
                              background: 'white',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #dee2e6',
                              fontSize: '15px',
                              lineHeight: '1.6',
                              color: '#495057',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {question.response.text_answer}
                            </div>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          fontSize: '12px',
                          color: '#6c757d',
                          marginTop: '15px',
                          paddingTop: '15px',
                          borderTop: '1px solid #dee2e6'
                        }}>
                          <span>📅 נוצר: {formatDate(question.response.created_at)}</span>
                          {question.response.updated_at && question.response.updated_at !== question.response.created_at && (
                            <span>🔄 עודכן: {formatDate(question.response.updated_at)}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center',
                        color: '#6c757d',
                        fontSize: '16px',
                        padding: '20px'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
                        <p style={{ margin: 0 }}>שאלה זו לא נענתה</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 