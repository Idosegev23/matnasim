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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      accessibility: 'from-purple-500 to-pink-500',
      accounting: 'from-blue-500 to-cyan-500',
      budget: 'from-green-500 to-teal-500',
      community: 'from-pink-500 to-rose-500',
      financial: 'from-yellow-500 to-orange-500',
      hr: 'from-indigo-500 to-purple-500',
      inventory: 'from-gray-500 to-slate-500',
      legal: 'from-red-500 to-pink-500',
      salary: 'from-emerald-500 to-green-500',
      security: 'from-orange-500 to-red-500',
      sgarot: 'from-violet-500 to-purple-500',
      general: 'from-slate-500 to-gray-500'
    }
    return colors[category] || 'from-gray-500 to-slate-500'
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin absolute top-2 left-2 animate-reverse-spin"></div>
            </div>
          </div>
          <p className="text-center text-lg text-gray-600 mt-4">טוען תשובות השאלון...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">שגיאה</h1>
            <p className="text-gray-600 mb-6">{error || 'לא ניתן לטעון את הנתונים'}</p>
            <button 
              onClick={() => router.push('/admin/completed-questionnaires')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              חזרה לשאלונים מושלמים
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                👁️ תשובות השאלון
              </h1>
              <p className="text-gray-600 mt-2">צפייה בתשובות מפורטות של שאלון מושלם</p>
            </div>
            <div className="flex space-x-4 space-x-reverse">
              <button
                onClick={exportToPDF}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                📄 ייצוא ל-PDF
              </button>
              <button
                onClick={() => router.push('/admin/completed-questionnaires')}
                className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
              >
                ← חזרה לרשימה
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Info */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 פרטי המנהל</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-gray-500">שם:</span>
                  <span className="font-medium">{data.user.name}</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-gray-500">אימייל:</span>
                  <span>{data.user.email}</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-gray-500">ארגון:</span>
                  <span>{data.user.organization}</span>
                </div>
              </div>
            </div>

            {/* Questionnaire Info */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 פרטי השאלון</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getCategoryColor(data.questionnaire.category)} flex items-center justify-center text-white text-sm`}>
                    {getCategoryIcon(data.questionnaire.category)}
                  </div>
                  <span className="font-medium">{data.questionnaire.title}</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-gray-500">קטגוריה:</span>
                  <span>{data.questionnaire.category}</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-gray-500">תאריך השלמה:</span>
                  <span>{data.stats.completion_date ? formatDate(data.stats.completion_date) : 'לא הושלם'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 סטטיסטיקות</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{data.stats.answered_questions}</div>
                <div className="text-sm text-gray-600">שאלות שנענו</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 mb-1">{data.stats.total_questions}</div>
                <div className="text-sm text-gray-600">סה"כ שאלות</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{data.stats.completion_percentage}%</div>
                <div className="text-sm text-gray-600">אחוז השלמה</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${data.stats.completion_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 סינון תשובות</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סעיף</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">כל הסעיפים</option>
                  {uniqueSections.map(section => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={showOnlyAnswered}
                    onChange={(e) => setShowOnlyAnswered(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">הצג רק שאלות שנענו</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">לא נמצאו תשובות</h3>
              <p className="text-gray-600">נסה לשנות את הסינון לצפייה בתוצאות אחרות</p>
            </div>
          ) : (
            filteredQuestions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start space-x-4 space-x-reverse mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {question.question_number || index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <span className="text-lg">{getQuestionTypeIcon(question.question_type)}</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {question.question_type}
                      </span>
                      {question.is_required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                      {question.section_name && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {question.section_name}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 mb-3">
                      {question.question_text}
                    </h4>
                    
                    {/* Answer */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      {question.response ? (
                        <div>
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <span className="text-green-600">✅</span>
                            <span className="text-sm font-medium text-green-700">נענתה</span>
                            <span className="text-xs text-gray-500">
                              עודכן: {formatDate(question.response.updated_at)}
                            </span>
                          </div>
                          {question.response.radio_answer && (
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">תשובה נבחרת: </span>
                              <span className="font-medium text-blue-600">
                                {question.response.radio_answer}
                              </span>
                            </div>
                          )}
                          {question.response.text_answer && (
                            <div>
                              <span className="text-sm text-gray-600">הסבר/הערה: </span>
                              <div className="mt-1 p-3 bg-white border border-gray-200 rounded-lg">
                                <p className="text-gray-800 whitespace-pre-wrap">
                                  {question.response.text_answer}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="text-gray-400">❌</span>
                          <span className="text-sm text-gray-500">לא נענתה</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 