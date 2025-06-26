'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CompletedQuestionnaire {
  id: string
  completion_date: string
  year: number
  progress_percentage: number
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
}

interface CompletedData {
  stats: {
    total_completed: number
    unique_users: number
    categories_completed: number
    completion_rate_this_month: number
  }
  completed_questionnaires: CompletedQuestionnaire[]
  by_category: Array<{
    category: string
    title: string
    completions: CompletedQuestionnaire[]
  }>
}

export default function CompletedQuestionnairesPage() {
  const [data, setData] = useState<CompletedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/admin/login')
          return
        }

        const response = await fetch('/api/admin/completed-questionnaires', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError('שגיאה בטעינת נתוני השאלונים המושלמים')
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
  }, [router])

  const handleViewResponses = (userId: string, questionnaireId: string) => {
    router.push(`/admin/questionnaire-responses/${userId}/${questionnaireId}`)
  }

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

  const filteredQuestionnaires = data?.completed_questionnaires.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.questionnaire.category === selectedCategory
    const userMatch = selectedUser === 'all' || item.user.id === selectedUser
    return categoryMatch && userMatch
  }) || []

  const uniqueUsers = data?.completed_questionnaires.reduce((acc: any[], item) => {
    if (!acc.find(user => user.id === item.user.id)) {
      acc.push(item.user)
    }
    return acc
  }, []) || []

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
          <p className="text-center text-lg text-gray-600 mt-4">טוען נתוני שאלונים מושלמים...</p>
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
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              נסה שוב
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
                📊 שאלונים מושלמים
              </h1>
              <p className="text-gray-600 mt-2">צפייה בשאלונים שהושלמו על ידי המנהלים</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
            >
              ← חזרה לדשבורד
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-2xl font-bold text-blue-600">{data.stats.total_completed}</div>
              <div className="text-sm text-gray-600">סה"כ שאלונים מושלמים</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-green-600">{data.stats.unique_users}</div>
              <div className="text-sm text-gray-600">מנהלים פעילים</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl mb-2">📂</div>
              <div className="text-2xl font-bold text-purple-600">{data.stats.categories_completed}</div>
              <div className="text-sm text-gray-600">קטגוריות פעילות</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-2xl font-bold text-orange-600">{data.stats.completion_rate_this_month}</div>
              <div className="text-sm text-gray-600">השלמות החודש</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 סינון נתונים</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">כל הקטגוריות</option>
                  {data.by_category.map(category => (
                    <option key={category.category} value={category.category}>
                      {getCategoryIcon(category.category)} {category.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מנהל</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">כל המנהלים</option>
                  {uniqueUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Questionnaires List */}
        <div className="space-y-4">
          {filteredQuestionnaires.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">לא נמצאו שאלונים</h3>
              <p className="text-gray-600">נסה לשנות את הסינון לצפייה בתוצאות אחרות</p>
            </div>
          ) : (
            filteredQuestionnaires.map(item => (
              <div key={`${item.user.id}-${item.questionnaire.id}`} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                  <div className="lg:col-span-2">
                    <div className="flex items-center space-x-4 space-x-reverse mb-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getCategoryColor(item.questionnaire.category)} flex items-center justify-center text-white text-xl`}>
                        {getCategoryIcon(item.questionnaire.category)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{item.questionnaire.title}</h3>
                        <p className="text-sm text-gray-600">{item.questionnaire.category}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <span>👤</span>
                        <span>{item.user.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <span>📧</span>
                        <span>{item.user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span>🏢</span>
                        <span>{item.user.organization}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">{item.progress_percentage}%</div>
                      <div className="text-sm text-gray-600">הושלם</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${item.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center mt-3">
                      <div className="text-sm text-gray-600">
                        {formatDate(item.completion_date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => handleViewResponses(item.user.id, item.questionnaire.id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      👁️ צפה בתשובות
                    </button>
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